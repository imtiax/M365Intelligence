CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS twin;
CREATE SCHEMA IF NOT EXISTS intelligence;
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE IF NOT EXISTS twin.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  provider text NOT NULL,
  resource_type text NOT NULL,
  external_id text NOT NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider, resource_type, external_id)
);

CREATE TABLE IF NOT EXISTS twin.resource_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  resource_id uuid NOT NULL REFERENCES twin.resources(id),
  valid_from timestamptz NOT NULL,
  valid_to timestamptz,
  observed_at timestamptz NOT NULL DEFAULT now(),
  schema_version integer NOT NULL,
  normalized jsonb NOT NULL,
  content_hash bytea NOT NULL,
  CHECK (valid_to IS NULL OR valid_to > valid_from)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_resource_current ON twin.resource_versions(resource_id) WHERE valid_to IS NULL;
CREATE INDEX IF NOT EXISTS ix_resource_version_tenant_time ON twin.resource_versions(tenant_id, valid_from DESC);

CREATE TABLE IF NOT EXISTS intelligence.findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  rule_id text NOT NULL,
  rule_version integer NOT NULL,
  title text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical','high','medium','low')),
  risk_score smallint NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  confidence numeric(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  impact text NOT NULL,
  recommendation text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  first_seen timestamptz NOT NULL,
  last_seen timestamptz NOT NULL,
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS ix_findings_queue ON intelligence.findings(tenant_id, status, severity, risk_score DESC);

CREATE TABLE IF NOT EXISTS audit.events (
  sequence_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id text NOT NULL,
  action text NOT NULL,
  object_type text NOT NULL,
  object_id text,
  result text NOT NULL,
  correlation_id uuid NOT NULL,
  details_hash bytea NOT NULL,
  previous_hash bytea,
  event_hash bytea NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_audit_tenant_time ON audit.events(tenant_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION audit.reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit ledger rows are immutable';
END $$;
DROP TRIGGER IF EXISTS audit_events_immutable ON audit.events;
CREATE TRIGGER audit_events_immutable BEFORE UPDATE OR DELETE ON audit.events
FOR EACH ROW EXECUTE FUNCTION audit.reject_mutation();

ALTER TABLE twin.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin.resource_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_resources ON twin.resources USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_versions ON twin.resource_versions USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_findings ON intelligence.findings USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_audit ON audit.events USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

