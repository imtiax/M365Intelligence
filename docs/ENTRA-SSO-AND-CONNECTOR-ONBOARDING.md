# Entra SSO and Microsoft 365 Connector Onboarding

This guide activates the production foundation added by the Connection Center. It does not turn on collection merely by setting environment variables. A customer must complete every release gate before live Microsoft 365 data is enabled.

## Trust separation

Use three distinct Entra applications or managed identities:

| Identity | Purpose | Permission boundary |
| --- | --- | --- |
| Workforce web application | Human sign-in to Aegis | OIDC delegated sign-in only; no Graph collection permissions |
| Read-only collector | Microsoft 365 inventory, audit, and reporting collection | Application permissions only for approved connector packs |
| Remediation worker | Approved write actions | Disabled by default; separate narrow write permissions and approval gate |

Never use a Global Administrator account, a user password, or a single shared application for all three boundaries.

## 1. Configure workforce Entra SSO

Create a single-tenant Entra application using authorization code flow with PKCE.

1. Register `Aegis Workforce - <environment>` in the customer tenant.
2. Add only exact HTTPS redirect URIs. A production example is `https://aegis.example.com/api/auth/entra/callback`.
3. Add an exact post-logout redirect URI.
4. Map approved Entra app roles or immutable group object IDs to Aegis platform roles.
5. Enforce Conditional Access and phishing-resistant MFA for Aegis administrators.
6. Configure the protected deployment environment:

```dotenv
ENTRA_OIDC_ENABLED=false
ENTRA_OIDC_TENANT_ID=<directory-guid>
ENTRA_OIDC_CLIENT_ID=<application-guid>
ENTRA_OIDC_REDIRECT_URI=https://aegis.example.com/api/auth/entra/callback
ENTRA_OIDC_ALLOWED_TENANT_ID=<directory-guid>
```

Keep `ENTRA_OIDC_ENABLED=false` until issuer, audience, nonce, state, PKCE, token signature, tenant binding, role mapping, and denial-path tests have been implemented and validated. The current local login remains the protected evaluation identity boundary.

## 2. Configure the read-only collector

Create a second, single-tenant application such as `Aegis M365 Collector - <environment>`.

1. Use a certificate or managed identity. Do not use a production client secret.
2. Store the private key outside Git, container images, and `.env` files.
3. Enable a connector pack only after documenting its Graph endpoints, data classification, retention, and least-privilege permissions.
4. Obtain independent admin-consent evidence.
5. Begin with one read-only pack in a nonproduction tenant.

The Connection Center reports readiness from these values without exposing any secret:

```dotenv
M365_GRAPH_ENABLED=false
M365_TENANT_ID=<directory-guid>
M365_CLIENT_ID=<collector-application-guid>
M365_CERTIFICATE_THUMBPRINT=<certificate-thumbprint>
M365_CERTIFICATE_PATH=/run/secrets/m365-collector.pem
```

## 3. Initial connector packs

| Pack | Initial permissions to evaluate | Purpose |
| --- | --- | --- |
| Entra identity and sign-in | `User.Read.All`, `Group.Read.All`, `AuditLog.Read.All`, `RoleManagement.Read.Directory` | Users, groups, roles, sign-ins, and directory audit |
| Licensing and usage | `Organization.Read.All`, `Reports.Read.All` | SKU, assignment, and usage reporting |
| Defender XDR | `SecurityIncident.Read.All`, `SecurityAlert.Read.All` | Alert and incident visibility |
| Purview audit | Workload-specific `AuditLogsQuery-*.Read.All` permissions | Administrator and workload audit evidence |
| Intune | `DeviceManagementManagedDevices.Read.All`, `DeviceManagementConfiguration.Read.All` | Managed-device and policy posture |

Permission names and provider availability change. Revalidate them against current Microsoft documentation and the customer’s licence plan before consent.

## 4. Release gate evidence

Before enabling a live collector, record evidence for each gate:

- Least-privilege endpoint and permission review.
- Admin-consent record and app-owner list.
- Certificate rotation and expiry-monitoring runbook.
- Tenant-isolation negative test.
- Pagination, delta cursor, throttling, retry, and dead-letter test.
- Backup, restore, and audit-ledger validation.

Enable no remediation permissions during this phase. A later remediation release must use a separate identity, business justification, dry run, approval, target allow-list, idempotency key, rollback plan, and immutable execution evidence.

## Current implementation boundary

The Connection Center and `GET /api/v1/control-plane/connection-readiness` provide configuration-readiness visibility only. They intentionally do not acquire an OAuth token, validate a certificate, call Microsoft Graph, or activate a connector. This avoids accidental tenant access while the production OIDC and collector workers remain under customer-controlled onboarding.
