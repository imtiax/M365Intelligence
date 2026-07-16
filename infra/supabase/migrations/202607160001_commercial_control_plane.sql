begin;

create extension if not exists pgcrypto;

create type public.organization_state as enum ('onboarding','trialing','active','suspended','closed');
create type public.membership_role as enum ('owner','platform_admin','security_admin','m365_admin','report_admin','auditor','read_only');
create type public.subscription_state as enum ('trialing','active','past_due','suspended','expired','cancelled');
create type public.license_state as enum ('draft','issued','active','grace','expired','revoked','replaced');
create type public.connection_state as enum ('not_configured','consent_pending','validating','connected','synchronizing','healthy','degraded','action_required','disconnected');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  job_title text check (job_title is null or char_length(job_title) <= 120),
  mfa_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (char_length(legal_name) between 2 and 200),
  display_name text not null check (char_length(display_name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  industry text not null,
  company_size text not null,
  primary_region text not null,
  state public.organization_state not null default 'onboarding',
  microsoft_tenant_id uuid,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint active_tenant_required check (state not in ('active') or microsoft_tenant_id is not null)
);

create unique index organizations_microsoft_tenant_unique
  on public.organizations(microsoft_tenant_id)
  where microsoft_tenant_id is not null and state <> 'closed';

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null,
  active boolean not null default true,
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, role)
);

create index organization_memberships_user_active
  on public.organization_memberships(user_id, organization_id)
  where active;

create table public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  document_type text not null check (document_type in ('terms','privacy','trial','commercial_eula')),
  document_version text not null,
  accepted_at timestamptz not null default now(),
  ip_hash text,
  user_agent_hash text,
  unique (organization_id, user_id, document_type, document_version)
);

create table public.onboarding_sessions (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  current_step smallint not null default 1 check (current_step between 1 and 9),
  completed_steps smallint[] not null default '{}',
  mode text not null default 'trial' check (mode in ('trial','customer')),
  demo_data_enabled boolean not null default true,
  connect_now boolean not null default false,
  completed_at timestamptz,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

create table public.trials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  state text not null check (state in ('provisioning','active','expiring','read_only','converted','expired','deleted')),
  industry_profile text not null,
  seed_reference text not null unique,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  read_only_until timestamptz,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint trial_dates_valid check (expires_at > starts_at)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  provider_customer_ref text,
  provider_subscription_ref text,
  plan_code text not null,
  state public.subscription_state not null,
  seats integer not null check (seats > 0),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_ref),
  constraint subscription_period_valid check (current_period_end > current_period_start)
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete cascade,
  feature_code text not null,
  enabled boolean not null default true,
  limit_value integer,
  valid_from timestamptz not null,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, feature_code),
  constraint entitlement_dates_valid check (valid_until is null or valid_until > valid_from)
);

create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  license_number text not null unique,
  state public.license_state not null default 'draft',
  edition text not null,
  microsoft_tenant_id uuid not null,
  max_instances smallint not null default 1 check (max_instances between 1 and 100),
  max_users integer not null check (max_users > 0),
  feature_codes text[] not null default '{}',
  signing_key_id text,
  payload_sha256 text,
  not_before timestamptz not null,
  expires_at timestamptz not null,
  offline_grace_until timestamptz,
  issued_at timestamptz,
  revoked_at timestamptz,
  revocation_reason text,
  created_at timestamptz not null default now(),
  constraint license_dates_valid check (expires_at > not_before),
  constraint license_tenant_matches_org check (microsoft_tenant_id is not null)
);

create table public.license_activations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  license_id uuid not null references public.licenses(id) on delete cascade,
  instance_fingerprint text not null check (char_length(instance_fingerprint) between 43 and 128),
  activation_mode text not null check (activation_mode in ('connected','offline')),
  state text not null check (state in ('pending','active','grace','deactivated','blocked')),
  product_version text not null,
  activated_at timestamptz,
  lease_expires_at timestamptz,
  last_heartbeat_at timestamptz,
  deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (license_id, instance_fingerprint)
);

create table public.tenant_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  microsoft_tenant_id uuid not null,
  cloud text not null default 'global',
  state public.connection_state not null default 'not_configured',
  application_id uuid,
  certificate_thumbprint text,
  certificate_expires_at timestamptz,
  requested_permissions text[] not null default '{}',
  granted_permissions text[] not null default '{}',
  last_validated_at timestamptz,
  validation_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, microsoft_tenant_id)
);

create table public.connector_registrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tenant_connection_id uuid references public.tenant_connections(id) on delete cascade,
  connector_code text not null,
  state public.connection_state not null default 'not_configured',
  last_sync_at timestamptz,
  next_sync_at timestamptz,
  last_success_at timestamptz,
  last_failure_code text,
  processed_count bigint not null default 0,
  rejected_count bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique (organization_id, connector_code)
);

create table public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  code text not null,
  enabled boolean not null,
  rollout_percent smallint not null default 100 check (rollout_percent between 0 and 100),
  minimum_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (organization_id, code)
);

create table public.support_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_number text not null unique,
  title text not null,
  state text not null check (state in ('open','awaiting_customer','approved','resolved','closed')),
  opened_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  support_case_id uuid not null references public.support_cases(id) on delete cascade,
  approved_by uuid not null references auth.users(id),
  support_subject_id uuid not null,
  allowed_scopes text[] not null,
  reason text not null,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint support_grant_dates_valid check (expires_at > starts_at)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete restrict,
  actor_subject_id uuid,
  actor_type text not null check (actor_type in ('user','service','support','system')),
  action text not null,
  object_type text not null,
  object_id text,
  outcome text not null,
  reason text,
  correlation_id uuid not null,
  previous_hash text not null,
  event_hash text not null unique,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index audit_events_org_time on public.audit_events(organization_id, occurred_at desc);
create index connector_registrations_org_state on public.connector_registrations(organization_id, state);
create index licenses_org_state on public.licenses(organization_id, state);

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = target_org and m.user_id = auth.uid() and m.active
  );
$$;

create or replace function public.has_org_role(target_org uuid, allowed public.membership_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = target_org and m.user_id = auth.uid() and m.active and m.role = any(allowed)
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, public.membership_role[]) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.membership_role[]) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.terms_acceptances enable row level security;
alter table public.onboarding_sessions enable row level security;
alter table public.trials enable row level security;
alter table public.subscriptions enable row level security;
alter table public.entitlements enable row level security;
alter table public.licenses enable row level security;
alter table public.license_activations enable row level security;
alter table public.tenant_connections enable row level security;
alter table public.connector_registrations enable row level security;
alter table public.feature_flags enable row level security;
alter table public.support_cases enable row level security;
alter table public.support_grants enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_self_select on public.profiles for select using (user_id = auth.uid());
create policy profiles_self_update on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy organizations_member_select on public.organizations for select using (public.is_org_member(id));
create policy organizations_owner_update on public.organizations for update
  using (public.has_org_role(id, array['owner','platform_admin']::public.membership_role[]))
  with check (public.has_org_role(id, array['owner','platform_admin']::public.membership_role[]));

create policy memberships_member_select on public.organization_memberships for select using (public.is_org_member(organization_id));
create policy memberships_admin_manage on public.organization_memberships for all
  using (public.has_org_role(organization_id, array['owner','platform_admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','platform_admin']::public.membership_role[]));

create policy terms_member_select on public.terms_acceptances for select using (public.is_org_member(organization_id));
create policy terms_self_insert on public.terms_acceptances for insert with check (user_id = auth.uid() and public.is_org_member(organization_id));

create policy onboarding_member_select on public.onboarding_sessions for select using (public.is_org_member(organization_id));
create policy onboarding_admin_update on public.onboarding_sessions for update
  using (public.has_org_role(organization_id, array['owner','platform_admin']::public.membership_role[]))
  with check (updated_by = auth.uid() and public.has_org_role(organization_id, array['owner','platform_admin']::public.membership_role[]));

create policy trials_member_select on public.trials for select using (public.is_org_member(organization_id));
create policy subscriptions_member_select on public.subscriptions for select using (public.is_org_member(organization_id));
create policy entitlements_member_select on public.entitlements for select using (public.is_org_member(organization_id));
create policy licenses_member_select on public.licenses for select using (public.is_org_member(organization_id));
create policy activations_admin_select on public.license_activations for select using (public.has_org_role(organization_id, array['owner','platform_admin']::public.membership_role[]));

create policy connections_member_select on public.tenant_connections for select using (public.is_org_member(organization_id));
create policy connections_admin_manage on public.tenant_connections for all
  using (public.has_org_role(organization_id, array['owner','platform_admin','m365_admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','platform_admin','m365_admin']::public.membership_role[]));

create policy connectors_member_select on public.connector_registrations for select using (public.is_org_member(organization_id));
create policy connectors_admin_manage on public.connector_registrations for all
  using (public.has_org_role(organization_id, array['owner','platform_admin','m365_admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['owner','platform_admin','m365_admin']::public.membership_role[]));

create policy flags_member_select on public.feature_flags for select using (organization_id is null or public.is_org_member(organization_id));
create policy support_cases_member_select on public.support_cases for select using (public.is_org_member(organization_id));
create policy support_cases_member_insert on public.support_cases for insert with check (opened_by = auth.uid() and public.is_org_member(organization_id));
create policy support_grants_admin_select on public.support_grants for select using (public.has_org_role(organization_id, array['owner','platform_admin']::public.membership_role[]));
create policy support_grants_owner_insert on public.support_grants for insert with check (approved_by = auth.uid() and public.has_org_role(organization_id, array['owner']::public.membership_role[]));
create policy audit_member_select on public.audit_events for select using (public.is_org_member(organization_id));

-- Internal service roles use narrowly scoped server functions; ordinary authenticated users receive no direct writes
-- to trials, subscriptions, entitlements, licenses, activations, flags, or audit events.

commit;
