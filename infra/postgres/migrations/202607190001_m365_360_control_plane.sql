CREATE SCHEMA IF NOT EXISTS control;

CREATE TYPE control.connector_state AS ENUM ('not_configured','consent_pending','connected','synchronizing','healthy','degraded','action_required','disabled');
CREATE TYPE control.report_visibility AS ENUM ('private','team','organization');
CREATE TYPE control.workflow_state AS ENUM ('draft','pending_approval','approved','rejected','running','completed','failed','rolled_back');
CREATE TYPE control.runbook_risk AS ENUM ('read_only','approval_required');

CREATE TABLE control.tenants (
  id uuid PRIMARY KEY,
  display_name text NOT NULL,
  microsoft_tenant_id uuid,
  cloud text NOT NULL DEFAULT 'global',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE control.connector_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES control.tenants(id) ON DELETE CASCADE,
  connector_code text NOT NULL,
  display_name text NOT NULL,
  state control.connector_state NOT NULL DEFAULT 'not_configured',
  requested_permissions text[] NOT NULL DEFAULT '{}',
  granted_permissions text[] NOT NULL DEFAULT '{}',
  coverage jsonb NOT NULL DEFAULT '{}'::jsonb,
  cursor_ref text,
  last_started_at timestamptz,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  last_failure_code text,
  next_sync_at timestamptz,
  records_processed bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, connector_code)
);

CREATE TABLE control.report_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES control.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  dataset_code text NOT NULL,
  definition jsonb NOT NULL,
  owner_id text NOT NULL,
  visibility control.report_visibility NOT NULL DEFAULT 'private',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name, owner_id)
);

CREATE TABLE control.report_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES control.tenants(id) ON DELETE CASCADE,
  report_definition_id uuid NOT NULL REFERENCES control.report_definitions(id) ON DELETE CASCADE,
  name text NOT NULL,
  definition jsonb NOT NULL,
  owner_id text NOT NULL,
  visibility control.report_visibility NOT NULL DEFAULT 'private',
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, report_definition_id, name, owner_id)
);

CREATE TABLE control.report_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES control.tenants(id) ON DELETE CASCADE,
  report_view_id uuid NOT NULL REFERENCES control.report_views(id) ON DELETE CASCADE,
  timezone text NOT NULL,
  schedule jsonb NOT NULL,
  delivery jsonb NOT NULL,
  empty_result_policy text NOT NULL CHECK (empty_result_policy IN ('suppress','deliver_summary')),
  status text NOT NULL CHECK (status IN ('active','paused')) DEFAULT 'active',
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE control.runbook_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  service text NOT NULL,
  risk control.runbook_risk NOT NULL,
  required_modules text[] NOT NULL DEFAULT '{}',
  required_permissions text[] NOT NULL DEFAULT '{}',
  content text NOT NULL,
  content_hash text NOT NULL,
  version integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE control.workflow_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES control.tenants(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  target_scope jsonb NOT NULL,
  justification text NOT NULL,
  requested_by text NOT NULL,
  approver_id text,
  state control.workflow_state NOT NULL DEFAULT 'draft',
  dry_run jsonb,
  execution jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE control.collection_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES control.tenants(id) ON DELETE CASCADE,
  connector_installation_id uuid NOT NULL REFERENCES control.connector_installations(id) ON DELETE CASCADE,
  trigger text NOT NULL CHECK (trigger IN ('initial','delta','notification','manual','reconciliation')),
  state text NOT NULL CHECK (state IN ('queued','running','completed','failed','throttled')),
  cursor_before text,
  cursor_after text,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_control_connector_tenant_state ON control.connector_installations(tenant_id, state);
CREATE INDEX ix_control_reports_tenant_updated ON control.report_definitions(tenant_id, updated_at DESC);
CREATE INDEX ix_control_workflows_tenant_state ON control.workflow_cases(tenant_id, state, updated_at DESC);
CREATE INDEX ix_control_jobs_tenant_created ON control.collection_jobs(tenant_id, created_at DESC);

ALTER TABLE control.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.connector_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.report_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.workflow_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.collection_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY control_tenant_scope ON control.tenants USING (id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY control_connector_scope ON control.connector_installations USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY control_report_scope ON control.report_definitions USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY control_view_scope ON control.report_views USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY control_schedule_scope ON control.report_schedules USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY control_workflow_scope ON control.workflow_cases USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY control_job_scope ON control.collection_jobs USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
