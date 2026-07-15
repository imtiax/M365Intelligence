# Microsoft 365 connection guide

## Current integration status

The repository contains the product experience, API and worker boundaries, tenant-aware contracts, data/audit architecture, infrastructure services, and configuration model. The customer showcase uses synthetic data. Production Microsoft Graph collector workers, Entra OIDC login, persistent workflow execution, and workload-specific write adapters must be implemented and validated before a tenant can be considered live.

Configuration values are therefore reserved integration inputs; setting them does not turn synthetic views into live Microsoft 365 views by itself.

## Recommended identity separation

Use separate identities for separate trust levels:

| Identity | Purpose | Permission posture |
| --- | --- | --- |
| Workforce web app | User sign-in through Entra OIDC | Delegated sign-in scopes only; platform RBAC is enforced server-side |
| Read-only collector | Scheduled Graph collection | Application permissions limited to enabled read modules |
| Remediation worker | Approved changes | Separate app/service principal, narrow write permissions, approval gate, short-lived jobs |

Do not reuse the local showcase account or a Global Administrator account as a collector identity.

## 1. Register the collector application

1. Sign in to the Microsoft Entra admin center and select the customer tenant.
2. Go to **Entra ID > App registrations > New registration**.
3. Name it `M365 Intelligence Collector - <environment>`.
4. Choose **Accounts in this organizational directory only**.
5. Record the Directory (tenant) ID and Application (client) ID.

For a multi-customer SaaS deployment, use a separately reviewed multitenant consent design. The default recommendation for a customer-controlled deployment is single tenant.

## 2. Add certificate credentials

Use a CA-issued certificate for production. A self-signed certificate is acceptable only for an isolated pilot.

1. Upload only the public `.cer` or public `.pem` under **Certificates & secrets > Certificates**.
2. Store the private key in Windows Certificate Store, Azure Key Vault, HashiCorp Vault, a Kubernetes secret provider, or equivalent protected storage.
3. Record the certificate thumbprint and expiry date.
4. Configure overlapping certificates before rotation so collection continues during rollover.

Never place `.pfx`, private `.pem`, certificate passwords, or exported secrets in this repository or a container image.

## 3. Select least-privilege Graph permissions

Permissions depend on the endpoints and licensed workloads selected for the customer. Start with a module-by-module access request and verify every permission against the current Microsoft Graph permissions reference.

| Capability | Candidate application permissions to evaluate | Notes |
| --- | --- | --- |
| Tenant metadata | `Organization.Read.All` | Basic organization and verified-domain context |
| Users and authentication posture | `User.Read.All`, `UserAuthenticationMethod.Read.All`, `AuditLog.Read.All` | Some reports and authentication data require specific Entra licensing/roles |
| Groups and membership | `Group.Read.All` | Prefer this over broad directory access when sufficient |
| Directory roles | `RoleManagement.Read.Directory` | Only when privileged-role intelligence is enabled |
| Usage reports | `Reports.Read.All` | Microsoft 365 usage/report endpoints |
| Devices | `Device.Read.All`, plus relevant Intune permissions | Intune Graph permissions are workload specific |
| Applications/service principals | `Application.Read.All` | Required only for application and credential posture features |
| Sites/files | `Sites.Selected` where supported | Prefer selected-site grants over tenant-wide site access |
| Audit query workloads | Relevant `AuditLogsQuery-*.Read.All` permissions | Enable only the approved Exchange/SharePoint/OneDrive audit workloads |

`Directory.Read.All` is a high-privilege read permission. Request it only when narrower permissions cannot support documented endpoints. Never add write permissions to the collector identity.

After configuration, an authorized administrator must grant and verify admin consent. Export the granted permission list into the customer security record and recertify it periodically.

## 4. Runtime configuration

Copy `.env.example` to `.env` and populate the non-secret identifiers:

```dotenv
M365_GRAPH_ENABLED=false
M365_TENANT_ID=00000000-0000-0000-0000-000000000000
M365_CLIENT_ID=00000000-0000-0000-0000-000000000000
M365_CLOUD=global
M365_GRAPH_BASE_URL=https://graph.microsoft.com/v1.0
M365_CERTIFICATE_THUMBPRINT=<certificate-thumbprint>
M365_CERTIFICATE_PATH=/run/secrets/m365-collector.pem
```

Keep `M365_GRAPH_ENABLED=false` until the collector implementation, permission review, isolation tests, and release gate are complete. Provide the private certificate through the runtime secret provider. Do not encode it directly in `.env`.

Supported cloud endpoint mapping must be implemented and tested before using US Government or China cloud tenants; do not assume the global Graph/login endpoints.

## 5. Validate app-only authentication

The collector should use a Microsoft-supported authentication library and the OAuth 2.0 client credentials flow with scope:

```text
https://graph.microsoft.com/.default
```

Validation sequence:

1. Acquire a token using tenant ID, client ID, and the protected certificate.
2. Verify the token tenant, audience, app ID, expiry, and granted roles without logging the token.
3. Call only a minimal approved endpoint such as organization metadata.
4. Confirm that an endpoint outside the permission catalogue returns access denied.
5. Write an immutable connection-test audit event containing tenant, app ID, certificate thumbprint, endpoint family, result, and correlation ID—not credentials or response payloads.

## 6. Collector behavior required for production

- Use delta queries and change notifications where supported; persist delta links per tenant/resource.
- Follow pagination links exactly and reject links for an unexpected host or tenant context.
- Honor `Retry-After` for HTTP 429; otherwise use bounded exponential backoff with jitter.
- Use bounded concurrency, circuit breakers, dead-letter queues, cursor replay, and idempotent upserts.
- Separate raw evidence, normalized entities, temporal versions, and derived findings.
- Apply database row-level tenant isolation and verify it with cross-tenant negative tests.
- Redact tokens, authorization headers, credentials, and sensitive fields from logs.
- Track permission/certificate drift, collection lag, last successful cursor, throttling, and data freshness.
- Use Microsoft Graph Data Connect rather than aggressive REST extraction when bulk volume warrants it.

## 7. Entra workforce sign-in

Production user authentication is separate from collection:

1. Register a web application for OIDC authorization code flow with PKCE.
2. Add exact HTTPS redirect and post-logout URIs for each environment.
3. Validate issuer, tenant, audience, signature, nonce, state, and token lifetime.
4. Map immutable Entra object IDs, approved group IDs, or app roles to server-side platform roles.
5. Apply Conditional Access and phishing-resistant MFA to administrators.
6. Replace the API development identity adapter and the local showcase login only after integration and negative security tests pass.

## 8. Write/remediation enablement

Do not add write permissions during read-only onboarding. For a later remediation phase:

1. Create a separate service principal for each write capability boundary.
2. Grant the narrowest workload-specific write permission.
3. Require platform RBAC, business justification, dry run, approval, idempotency key, target allow-list, rollback plan, and immutable evidence.
4. Test in a nonproduction tenant and validate denial paths.
5. Obtain change/security approval before production consent.
6. Provide a kill switch that disables token acquisition and queued writes.

## 9. Production acceptance checklist

- [ ] Customer tenant ownership and data residency recorded
- [ ] App registrations and owners documented
- [ ] Certificate private key stored outside Git/images
- [ ] Read permissions mapped to exact Graph endpoints
- [ ] Admin consent independently reviewed
- [ ] Token and minimal endpoint test passed
- [ ] Cross-tenant isolation test passed
- [ ] Delta, pagination, 429, replay, and dead-letter tests passed
- [ ] Logging redaction verified
- [ ] Certificate rotation alert and runbook tested
- [ ] Restore drill and audit-chain validation passed
- [ ] Write identity remains disabled or passes its separate release gate

## Official references

- [Register an application](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)
- [Certificate credentials](https://learn.microsoft.com/en-us/entra/identity-platform/certificate-credentials)
- [App-only Microsoft Graph access](https://learn.microsoft.com/en-us/graph/auth-v2-service)
- [Graph permissions overview](https://learn.microsoft.com/en-us/graph/permissions-overview)
- [Graph permissions reference](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Delta query overview](https://learn.microsoft.com/en-us/graph/delta-query-overview)
- [Throttling guidance](https://learn.microsoft.com/en-us/graph/throttling)
