# Aegis M365 Commercial System Design

Status: architecture baseline  
Version: 1.0  
Last updated: 2026-07-16

## 1. Architecture decision

The commercial product uses a split control-plane/data-plane architecture.

```text
Public web and hosted control plane
|-- Marketing, documentation, pricing
|-- Hosted identity adapter
|-- Organizations and memberships
|-- Trials and synthetic simulation
|-- Subscriptions and entitlements
|-- Licenses, activations, releases
`-- Opt-in support and fleet metadata

Customer-controlled data plane
|-- Microsoft Entra workforce authentication
|-- Microsoft Graph and workload collectors
|-- Normalized operational store
|-- Reports, search, jobs and audit
|-- Governed workflows
`-- Local/private AI
```

Real Microsoft 365 content does not traverse or persist in the hosted control plane. Trial workspaces run on synthetic data and may be hosted because they contain no customer tenant content.

## 2. Trust boundaries

### Boundary A: public internet

Only public pages, authentication endpoints, verification, and tightly rate-limited registration are exposed. All state-changing requests require origin checks, abuse controls, validation, and correlation IDs.

### Boundary B: hosted control plane

Stores commercial and identity metadata. Row Level Security and application authorization both enforce organization membership. Service-role credentials are restricted to server-side jobs and are never shipped to browsers.

### Boundary C: customer edge

Terminates TLS and exposes the customer application. The API, database, queues, search, and local AI remain on internal networks.

### Boundary D: Microsoft cloud

Collectors communicate directly from the customer environment to tenant-authorized Microsoft identity and Graph endpoints. Permissions are workload-specific and least privilege.

### Boundary E: vendor licensing

Connected activation sends only license/instance metadata. Offline activation exchanges signed files. Neither path carries Microsoft 365 operational content.

## 3. Identity architecture

The application defines an `IdentityProvider` contract:

```text
register(email, password, metadata)
verifyEmail(token)
authenticate(credentials)
refresh(refreshToken)
enrollMfa(userId)
revokeSessions(userId)
resolveClaims(accessToken)
```

Adapters:

- Supabase Auth for hosted trial/control-plane identities.
- Microsoft Entra OIDC for customer workforce identities.
- Local scrypt adapter for development/recovery only.

The authorization subject uses immutable provider user ID plus organization ID. Email is display/contact data, not an authorization key.

## 4. Organization context

Each authenticated request resolves:

```json
{
  "subjectId": "immutable-provider-user-id",
  "organizationId": "uuid",
  "microsoftTenantId": "guid-or-null",
  "roles": ["platform-admin"],
  "entitlements": ["reporting"],
  "sessionId": "uuid",
  "correlationId": "uuid"
}
```

The browser cannot select an arbitrary organization ID. Organization switching requests a new server-validated context after membership verification.

## 5. Data ownership classes

| Class | Examples | Location |
|---|---|---|
| Public | Product pages, documentation | Public web |
| Commercial | Organization, subscription, license | Hosted control plane |
| Synthetic trial | Generated identities and events | Isolated hosted trial store |
| Customer operational | Users, devices, reports, findings | Customer data plane only |
| Support metadata | Version, health code, job status | Opt-in control plane |
| Secret | Tokens, certificates, private keys | Dedicated secret store |

## 6. Control-plane relational model

Core tables:

- `profiles`
- `organizations`
- `organization_memberships`
- `terms_acceptances`
- `onboarding_sessions`
- `trials`
- `subscriptions`
- `entitlements`
- `licenses`
- `license_activations`
- `tenant_connections`
- `connector_registrations`
- `feature_flags`
- `support_cases`
- `support_grants`
- `release_artifacts`
- `audit_events`

Every organization-owned record has `organization_id`. Hosted RLS uses an immutable authenticated subject mapped through `organization_memberships`.

## 7. Tenant isolation enforcement

### Database

- RLS enabled and forced.
- Membership helper functions use the authenticated subject.
- Internal service operations require scoped RPCs or audited service jobs.

### API

- Verified token -> subject -> membership -> organization context.
- DTOs do not accept trusted organization context from callers.
- Repository methods require organization ID as a non-optional first argument.

### Asynchronous processing

- Job envelope includes organization, job, correlation, issued-at, and nonce.
- Envelope is signed between trusted services.
- Workers select credentials and storage partitions from organization context.

### Storage and search

- Object prefix: `org/{organizationId}/...`.
- Search index or mandatory filter contains organization ID.
- Export URLs are short-lived, organization-scoped, and single-purpose.

## 8. Trial lifecycle

```text
pending_verification
  -> onboarding
  -> provisioning
  -> active
  -> expiring
  -> read_only
  -> converted | deleted
```

Provisioning is idempotent. A unique seed is derived with HMAC from a server secret and the trial ID. The seed selects industry, departments, regions, risk posture, utilization, and scenario timing. The raw secret is never stored with the trial.

Simulation events are emitted through the same normalized contracts used by collectors:

```text
Source event -> validation -> normalization -> tenant partition -> projection -> UI
```

## 9. Customer connection lifecycle

```text
not_configured
 -> consent_pending
 -> validating
 -> connected
 -> synchronizing
 -> healthy | degraded | action_required
 -> disconnected
```

The connection record stores identifiers, requested/granted permission names, certificate thumbprint, expiry, and health metadata. It never stores certificate private material or access tokens in ordinary tables.

## 10. License design

### Installation identity

On first start, the customer data plane generates an Ed25519 installation key. The private key is stored in TPM/HSM/OS-protected storage where available. The activation request contains the public key fingerprint, product version, requested tenant ID, and nonce.

### Vendor license

The vendor issuer signs a canonical payload using an offline-protected Ed25519 key. The customer application contains a versioned verification-key ring.

Validation checks:

1. Schema and key ID supported.
2. Signature valid over exact payload bytes.
3. License not before/expired/revoked according to mode.
4. Organization and Microsoft tenant match verified context.
5. Installation fingerprint matches local key.
6. Edition, feature, user, tenant, and version constraints pass.
7. Connected lease or offline grace is valid.

License files are signed, not encrypted. They contain identifiers and entitlements, never secrets.

### One-instance semantics

Connected mode provides strict activation-slot enforcement with leases. Offline mode proves binding to an installation key but cannot absolutely detect a fully cloned disconnected machine. Contracts and hardware-backed non-exportable keys address the remaining risk.

## 11. API surface

### Public

- `POST /v1/registrations`
- `POST /v1/verifications`
- `GET /v1/public/plans`
- `GET /health/live`

### Authenticated organization

- `GET/PATCH /v1/organization`
- `GET/POST /v1/memberships`
- `GET/PATCH /v1/onboarding`
- `GET /v1/subscription`
- `GET /v1/entitlements`
- `GET /v1/license`
- `POST /v1/license/activation-request`
- `GET/POST /v1/connections`
- `POST /v1/connections/{id}/validate`
- `GET /v1/connectors`

### Internal Super Admin

- `GET /v1/internal/customers`
- `POST /v1/internal/licenses/issue`
- `POST /v1/internal/licenses/{id}/revoke`
- `POST /v1/internal/features/rollout`
- `POST /v1/internal/support-grants`
- `POST /v1/internal/releases`

Internal routes require internal identity, MFA, role, reason, and audit context. They are not made reachable merely by possessing an organization administrator token.

## 12. Signup and verification security

- Per-IP and per-email rate limits.
- Generic responses prevent account enumeration.
- Verification tokens are random, single use, short lived, and stored as hashes.
- Password policy and breach checking are delegated to the identity provider where supported.
- Production requires bot protection and verified outbound email domain.
- Terms acceptance is recorded after verification and before provisioning.

## 13. Session security

- Secure, HttpOnly, SameSite cookies for web sessions.
- Rotating refresh tokens remain provider-managed and server-side where possible.
- CSRF/origin validation on mutations.
- Absolute and idle timeouts.
- Session and device inventory.
- Administrator ability to revoke all sessions.
- Authentication events stored in a dedicated audit stream with privacy-aware IP retention.

## 14. Supabase deployment rules

Supabase is used only for hosted identity and control-plane PostgreSQL during the initial commercial phase.

- Browser uses the anonymous key and RLS-protected APIs only.
- Service-role key exists only in trusted server workloads.
- Customer Graph credentials and operational payloads are prohibited.
- Database webhooks cannot carry customer operational content.
- Migrations are source controlled and tested with positive/negative RLS cases.
- Provider access, backups, region, and retention are documented in the privacy notice.

## 15. Feature entitlement evaluation

Effective access is the intersection of:

```text
identity role
AND organization membership
AND subscription state
AND signed license
AND feature entitlement
AND deployment policy
```

UI feature flags improve experience but never replace server authorization.

## 16. Support architecture

Support diagnostics are generated locally and previewed by the customer. A bundle may include version, configuration schema, sanitized health codes, connector state, job failure codes, and correlation IDs. It excludes Microsoft 365 object content by default.

Remote support grant fields:

- Case ID and purpose.
- Customer approver.
- Scope and allowed actions.
- Start and expiry.
- Support identity.
- Revocation and complete audit trail.

## 17. Observability

### Local customer telemetry

Full operational metrics and logs stay local.

### Opt-in vendor telemetry

Permitted examples: version, edition, health category, connector type/status, job duration bucket, error code, and activation status. Prohibited examples: usernames, message/file content, report rows, raw Graph payloads, prompts containing tenant data, and security-event details.

## 18. Threat controls

| Threat | Primary controls |
|---|---|
| Cross-tenant access | RLS, mandatory context, negative tests |
| Forged license | Asymmetric signature, offline private key |
| Copied offline install | TPM key, tenant binding, EULA |
| Activation cloning | Server-side lease and slot |
| Service-role leakage | Secret manager, server only, rotation |
| Support abuse | Customer grant, scope, expiry, audit |
| Connector compromise | Least privilege, certificates, rotation |
| Trial abuse | Verification, throttling, bot and domain controls |
| Job context tampering | Signed envelope, nonce, expiry |
| Malicious update | Signed artifact, provenance, rollback |

## 19. Deployment profiles

### Hosted trial/control plane

Managed web/API, Supabase Auth/PostgreSQL, job workers, transactional email, billing adapter, release storage, and monitoring.

### Connected customer data plane

Docker/Kubernetes inside customer boundary plus outbound Microsoft and licensing endpoints explicitly allowlisted.

### Sovereign offline customer data plane

No runtime internet requirement. Offline license, offline release bundle, local identity federation, local AI, and customer-managed observability.

## 20. Repository evolution

```text
apps/web                 public + organization experience
apps/api                 customer data-plane API
apps/control-api         hosted commercial control plane (planned extraction)
apps/license-issuer      isolated internal issuer (private repository recommended)
packages/contracts       versioned shared DTO/event contracts
infra/supabase           hosted schema and RLS
infra/customer           local deployment assets
docs                     PRD, SDD, runbooks, threat models
```

The license issuer and vendor private-key operations must not be distributed in the customer repository.

## 21. Architecture decision records required next

- ADR-001 control-plane/data-plane split.
- ADR-002 hosted identity provider and migration abstraction.
- ADR-003 tenant-context propagation.
- ADR-004 connected/offline licensing.
- ADR-005 customer connector secret storage.
- ADR-006 synthetic trial isolation and retention.
- ADR-007 billing provider and entitlement source of truth.
- ADR-008 update signing and release channels.
