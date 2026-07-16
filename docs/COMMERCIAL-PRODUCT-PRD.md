# Aegis M365 Commercial Product Requirements

Status: implementation baseline  
Owner: Product and Architecture  
Version: 1.0  
Last updated: 2026-07-16

## 1. Product outcome

Aegis M365 is a commercial Microsoft 365 intelligence and security operations product with four deliberate experiences:

1. Public website for product education, pricing, trust, documentation, and conversion.
2. Trial workspace with verified identities and isolated synthetic enterprise data.
3. Customer workspace connected to a licensed customer's Microsoft 365 tenant and local data plane.
4. Super Admin control plane for customers, subscriptions, licenses, releases, and privacy-preserving support metadata.

The product is not a shared hosted repository for customer Microsoft 365 content. Real tenant identities, messages, files, findings, report rows, audit events, and AI context stay in the customer-controlled data plane. The hosted control plane stores identity, organization, commercial entitlement, release, and minimal operational metadata only.

## 2. Product principles

- Tenant isolation is mandatory at the database, API, cache, job, search, audit, and UI layers.
- A trial contains synthetic data only and is visibly marked as a simulation.
- A customer decides which connectors and permissions to enable.
- Sensitive remediation requires separation of duties and a durable audit trail.
- Licensing does not weaken data sovereignty. Offline activation remains available.
- Every product claim must distinguish implemented behavior, simulation behavior, and external integration gates.
- The platform fails closed when organization, tenant, role, subscription, or license context is invalid.

## 3. Personas and roles

### Public

- Visitor: view marketing, trust, documentation, and pricing.
- Trial registrant: register and verify an account.

### Organization

- Organization Owner: contract, subscription, administrators, tenant connection, export, deletion.
- Platform Administrator: platform configuration, users, connectors, and licenses.
- Security Administrator: security investigation and controlled remediation.
- Microsoft 365 Administrator: workload operations and connector administration.
- Report Administrator: reporting, schedules, distribution, and templates.
- Compliance Auditor: immutable evidence and read-only audit access.
- Read-only Analyst: authorized dashboards and reports.

### Internal

- Super Administrator: customer and platform lifecycle; cannot silently browse customer operational data.
- Billing Administrator: subscriptions, invoices, entitlements, and renewals.
- Support Engineer: time-bound support cases with customer approval and scoped diagnostics.
- Release Manager: versions, channels, signatures, and rollout rings.

## 4. Product modes

### 4.1 Public website

Required routes:

- `/landing`
- `/pricing`
- `/security`
- `/docs`
- `/signup`
- `/login`

Required behavior:

- Start Free Trial and Request Licensed Deployment calls to action.
- Clear local-first and data-boundary disclosure.
- No authenticated application data in public responses or caches.
- Accessible, responsive, search-friendly content.

### 4.2 Trial mode

- Verified email identity.
- One isolated organization and trial workspace per registration policy.
- Fourteen-day default entitlement, configurable by campaign.
- Unique deterministic seed derived from organization and trial IDs.
- Continuous simulation of identity, activity, security, collaboration, compliance, and cost events.
- No production Microsoft Graph mutations.
- Optional connection-readiness assessment without storing tenant content.
- Trial expiry transitions to read-only conversion mode before deletion.

### 4.3 Customer mode

- Active commercial entitlement and valid signed license.
- Microsoft Entra tenant ID bound to the organization and license.
- Customer-controlled collectors and data stores.
- Connector consent, permission inventory, synchronization, and health.
- Role-aware dashboards and governed workflows.
- Online activation with grace period or offline signed activation.

### 4.4 Super Admin mode

- Customer directory and lifecycle states.
- Trial, subscription, entitlement, license, activation, and release management.
- Aggregate product telemetry only when contractually enabled.
- Support access requires a case, customer approval, explicit scope, expiry, and audit record.
- No universal operational-data browsing capability.

## 5. Registration and onboarding

### 5.1 Registration states

`started -> pending_verification -> verified -> onboarding -> active_trial`

Failure states:

`rate_limited | duplicate | blocked_domain | verification_expired | abandoned`

### 5.2 Registration requirements

- Email and password or Microsoft organizational sign-in.
- Passwords handled by the configured identity provider; never stored in application tables.
- Email verification before workspace access.
- Abuse controls: rate limit, bot protection, disposable-domain policy, and duplicate detection.
- Acceptance records for Terms, Privacy Notice, and Trial Agreement with version and timestamp.

### 5.3 Onboarding wizard

1. Welcome and product-mode explanation.
2. Organization legal/display name.
3. Industry and company size.
4. Primary operating region and data-residency preference.
5. Administrator profile and MFA enrollment.
6. Generate synthetic trial data or prepare a licensed connection.
7. Connect Microsoft 365 now or later.
8. Review security and privacy boundary.
9. Finish and enter workspace.

Onboarding must be resumable and idempotent. Each completed step is stored independently.

## 6. Authentication and session requirements

- Hosted mode: provider abstraction with Supabase Auth as the initial adapter.
- Customer mode: Microsoft Entra OIDC is the production workforce identity authority.
- Local identities are limited to development, recovery, and explicitly configured sovereign deployments.
- Email verification for hosted accounts.
- MFA mandatory for organization and internal administrators.
- Refresh-token rotation and replay detection delegated to the identity provider and verified by the application.
- Session idle timeout, absolute lifetime, logout-all-devices, and administrator revocation.
- Login history includes time, outcome, identity, IP prefix, device label, and correlation ID according to retention policy.
- Authorization never relies on email, display name, or mutable domain values.

## 7. Multi-tenant requirements

- Every tenant-owned table has a non-null `organization_id`.
- Customer tenant data also carries immutable `microsoft_tenant_id` where applicable.
- Row Level Security is enabled and forced for hosted control-plane tables.
- API authorization derives organization context from verified membership, never from an untrusted query parameter alone.
- Background jobs carry signed organization and correlation context.
- Cache keys, object paths, search indexes, queues, metrics, and exports include organization scope.
- Cross-tenant administrative reporting uses separately authorized aggregate projections.
- Tenant-isolation negative tests are release blocking.

## 8. Commercial entitlements and licensing

### Subscription states

`trialing | active | past_due | suspended | expired | cancelled`

### License states

`draft | issued | active | grace | expired | revoked | replaced`

### License claims

- Schema and key version.
- Unique license and customer identifiers.
- Organization identifier.
- Microsoft Entra tenant ID.
- Installation public-key fingerprint.
- Edition and feature entitlements.
- User, tenant, and instance limits.
- Issue, not-before, expiry, and offline-grace timestamps.
- Release channel and optional minimum/maximum version.

Licenses are signed with an offline-protected vendor Ed25519 private key. Products contain verification public keys only. Key rotation supports overlapping verification keys.

### Activation models

- Connected: one active lease per permitted installation, privacy-preserving heartbeat, configurable grace period.
- Sovereign offline: customer creates an activation request; vendor returns a signed license bound to tenant and installation key.
- Trial: hosted entitlement, synthetic data only, no exportable production license.

## 9. Connection Center

Connectors:

- Microsoft Entra ID
- Exchange Online
- Microsoft Teams
- SharePoint Online and OneDrive
- Microsoft Intune
- Microsoft Defender XDR
- Microsoft Purview
- Hybrid Active Directory
- ServiceNow
- Slack
- SMTP
- Webhooks

Each connector exposes:

- Connection and consent state.
- Required, granted, and missing permissions.
- Credential/certificate expiry without exposing secret material.
- Last successful and failed synchronization.
- Next scheduled synchronization.
- Objects processed and rejected.
- Throttling and backoff state.
- Data residency and destination.
- Validation and reconnect actions.

## 10. Simulation Engine

- Seed is unique per trial and reproducible for support.
- Industry profile changes departments, locations, controls, incidents, and KPIs.
- Events include sign-ins, risk, MFA gaps, license changes, mailbox growth, Teams activity, devices, compliance findings, and recommendations.
- Simulation clock supports pause, accelerate, scenario activation, and reset.
- Generated content is visibly synthetic and contains no real personal information.
- Trial events use the same normalized contracts as customer collectors.

## 11. AI requirements

- AI queries the normalized semantic data layer, not Microsoft Graph directly.
- Organization, role, and row-security filters are applied before retrieval.
- Responses include grounded sources, query time, and data freshness.
- Local model is the default for sovereign deployments.
- Cloud models require explicit administrator enablement and a documented data-processing boundary.
- Prompts, model configuration, tool calls, and approvals are versioned and audited.

## 12. Super Admin requirements

- Customer and trial search with lifecycle state.
- Subscription and invoice status through a billing-provider abstraction.
- License issue, replace, revoke, and activation history.
- Feature flags scoped by environment, edition, organization, cohort, and version.
- Release rings, signed artifacts, rollback, and compatibility status.
- Job and connector fleet health based only on opted-in metadata.
- Support cases and customer-approved diagnostic bundles.
- Internal actions require reason, ticket/case, MFA, and immutable audit entry.

## 13. Non-functional requirements

- Availability targets are defined separately for hosted control plane and customer data plane.
- API p95 under 500 ms for interactive control-plane operations, excluding providers.
- Zero critical tenant-isolation defects at release.
- Encryption in transit and at rest; field protection for sensitive control-plane metadata.
- Secret rotation without rebuild.
- Signed releases, SBOM, dependency scanning, container scanning, and provenance.
- Backup restore tests and documented RPO/RTO per deployment profile.
- WCAG 2.2 AA target for public and application interfaces.
- Data retention and deletion are configurable and auditable.

## 14. Release acceptance gates

- Registration, verification, onboarding resume, and expiry tests.
- Positive and negative role matrix tests.
- Cross-tenant database, API, cache, job, export, and search tests.
- License tampering, wrong tenant, wrong instance, expiry, grace, and revocation tests.
- Connector consent and failure-state tests.
- Audit-chain integrity and support-access expiry tests.
- Desktop and mobile browser journeys.
- Backup/restore and upgrade/rollback tests.
- Security review and threat-model delta approval.

## 15. Delivery sequence

1. Control-plane schema, identity adapter, organization membership, and RLS.
2. Signup, verification, onboarding, unique trial generation, and conversion.
3. Subscription, entitlement, signed licensing, and activation.
4. Connection Center and local collector registration.
5. Super Admin customer, release, feature, and support management.
6. Billing integration, notifications, marketplace, plugins, and white labeling.
7. Hardened automatic updates, backup/restore, and sovereign deployment certification.

## 16. Explicit exclusions from the first commercial tranche

- Storing customer Microsoft 365 operational records in the hosted control plane.
- Unattended real-tenant remediation during a trial.
- Universal internal support access.
- Claims of absolute offline copy prevention.
- Production billing charges before provider, tax, refund, and reconciliation requirements are approved.

