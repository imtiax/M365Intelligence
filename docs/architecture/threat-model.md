# Threat model

Method: STRIDE with privacy and AI-specific abuse cases. Review at each release and after boundary changes.

| Threat | Example | Primary mitigations | Verification |
|---|---|---|---|
| Spoofing | Forged token or worker identity | OIDC validation, PKCE, mTLS, workload identity, short TTL | Auth integration tests |
| Tenant escape | Query returns another tenant's users | Claim-derived tenant, repository scoping, RLS, negative tests | Cross-tenant test suite |
| Tampering | Finding/evidence altered | Immutable evidence, rule versions, audit hash chain, signed roots | Ledger verifier |
| Repudiation | Admin denies exporting data | Correlated immutable audit, trusted time, WORM export | Restore/audit exercise |
| Information disclosure | Token in logs or AI context | Central redaction, secret stores, AI denylist, egress deny | DLP and log tests |
| Denial of service | Graph throttling or expensive report | Backoff, queues, quotas, bounded queries, circuit breakers | Load/chaos tests |
| Elevation | Read-only user invokes workflow | Server authorization, step-up auth, approval separation | Policy tests |
| Supply chain | Compromised image/package | Lockfiles, provenance, SBOM, signature admission, scans | CI gates |
| Prompt injection | SharePoint text instructs model to disclose | Content/instruction separation, filtered retrieval, no raw tools | Adversarial evals |
| Model exfiltration | Model runtime calls internet | Network egress deny, local models, proxy allowlist | Network tests |
| Unsafe automation | Hallucinated account disable | Typed allow-listed tools, dry run, approval, idempotency, rollback | Playbook simulations |
| Collector overreach | Excessive Graph permissions | Per-capability consent, least privilege catalog, periodic grant review | Permission attestation |

Highest residual risks are customer misconfiguration of identity/network controls, upstream API semantic changes, and privileged insider access to host infrastructure. Deployment validation, connector contract tests, split duties, and external immutable audit sinks address but do not eliminate them.

