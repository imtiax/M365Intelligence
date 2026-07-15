# Security architecture

## Trust boundaries

External Microsoft endpoints, the user network, workload containers, data stores, the model runtime, and administrative management plane are separate trust zones. Network policy permits only documented flows. The public edge terminates TLS 1.3; service identities use mTLS in Kubernetes.

## Identity

- Primary workforce authentication: Entra ID using OIDC authorization code flow with PKCE.
- Alternatives: AD/LDAP through a configured federation provider; local accounts only for named break-glass operators.
- Administrator MFA is mandatory. Conditional Access should require phishing-resistant authentication for privileged roles.
- Workload access uses managed identity where supported, otherwise certificate credentials held in Vault or an OS certificate store. Client secrets are prohibited.
- Sessions are short lived, audience/issuer/nonce validated, and revoked on relevant identity events.

The local showcase identity adapter uses a scrypt-derived password hash, generic authentication failures, per-client throttling, an HS256 session with explicit issuer/audience/JTI and eight-hour expiry, and an HttpOnly/SameSite=Strict cookie. It is a single-node evaluation boundary. Production must use Entra federation, centralized Redis-backed throttling, HTTPS Secure cookies, conditional access, and server-side revocation for high-risk events.

## Authorization

RBAC roles are Platform Administrator, Security Administrator, Microsoft 365 Administrator, Auditor, Report Administrator, and Read Only User. Authorization also evaluates tenant membership, resource classification, action, and workflow state. Deny is the default. API policies, not UI visibility, are authoritative.

The data plane applies tenant context from a verified claim, never a caller-supplied query parameter. Background jobs carry a signed workload identity and tenant envelope. Database row-level security and per-tenant encryption contexts reduce blast radius.

## Data protection

- TLS 1.3 at ingress; mTLS and network policy for east-west traffic.
- AES-256 storage encryption plus envelope encryption for sensitive values. Key-encryption keys remain in Vault/HSM and are versioned.
- Passwords use Argon2id with rate limiting; no reversible password storage.
- Exports are policy checked, watermarked, time-limited, encrypted when sensitive, and audited.
- Logs redact credentials, tokens, cookies, authorization headers, and sensitive Graph fields.

## AI control plane

Requests pass through input classification, prompt-injection detection, tenant/RBAC-filtered retrieval, context minimization, and a local inference endpoint. Outputs pass secret/PII detection, grounding checks, and action-policy validation. Model access has no general network egress. Conversations and tool calls are audited with configurable redaction and retention. Retrieved content is treated as untrusted data, never system instruction.

## Application controls

Strict CSP and security headers, schema validation, parameterized database access, CSRF protection for cookie-authenticated mutations, output encoding, request size limits, per-identity rate limits, malware scanning of imports, signed images, SBOM generation, and continuous dependency/container scanning are required.

## Audit integrity

Audit records include tenant, actor, subject, action, result, time, IP, device/session, correlation ID, and canonical details hash. Each record chains the previous hash. Daily roots are signed and may be exported to WORM storage or a SIEM. Audit administrators can read but cannot update ledger rows.
