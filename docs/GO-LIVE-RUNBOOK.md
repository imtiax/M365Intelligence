# Aegis M365 Go-Live Runbook

Status: release-candidate operating procedure  
Last updated: 2026-07-17

## Release decisions

Aegis has three independent release decisions.

### Client demonstration

The local enterprise demonstration may be declared ready when the automated release-candidate suite passes. It uses synthetic data, local identities, an evaluation entitlement, and simulated Microsoft 365 integrations that are explicitly labelled.

### Public synthetic demo

The persona-led public demo may be deployed only to a dedicated, internet-hardened environment after its launcher, all four personas, session isolation, reset, expiry, read-only API boundary, abuse controls, and synthetic-data provenance are evidenced. It must contain no Microsoft Graph credential, customer secret, customer data, or route to a customer data plane. The detailed contract is in [PUBLIC-DEMO.md](PUBLIC-DEMO.md).

### Public production service

The public commercial product must not be declared live until every external production gate in this document is evidenced. A working demonstration is not evidence that hosted identity, billing, licensing, Microsoft consent, privacy, support, and operational response are production ready.

## Automated release gate

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\release-candidate.ps1 `
  -DemoPassword '<local acceptance password>'
```

The script validates:

- Production dependency vulnerabilities.
- API unit tests and production build.
- Web production build and type checks.
- Docker Compose rendering.
- API authentication replay defense and tenant-scoped workflows.
- Enterprise simulation counts and persistence.
- All authenticated navigation modules and deep links.
- Reports, populated results, valid SpreadsheetML Excel and PDF files.
- Five operational exports with populated domain rows, KPIs, local-snapshot disclosure, and valid PDF headers.
- Custom report design, preview, schedule, security, and save.
- Finding assignment with owner, team, priority, future due date, note, reload persistence, and activity history.
- Dormant-E5 exception review for leave, service-account, and legal-hold candidates before submission.
- Governed request, independent approval, execution, rollback, and audit integrity.
- Exact dormant-E5 outcome accounting: 87 evaluated, 67 reclaimed, and 20 documented exclusions in the deterministic acceptance dataset.
- Rejection decisions and tenant-isolated real-time events.
- Six API roles and six UI navigation personas.
- Every visible control has an accessible name and is not silently disabled.
- Public landing desktop/mobile rendering, local CTAs, hash targets, and product screenshots.
- Public-demo launcher, four persona sessions, bounded identity claims, broad module bootstrap, report preview, mutation denial, per-session reset/isolation, logout, and expiry-friendly routing.

Machine-readable evidence is written to `artifacts/release-candidate.json`.

## Day-before production sequence

1. Freeze the release branch and assign a signed version.
2. Verify the proprietary distribution license and repository visibility.
3. Run the complete release-candidate suite from a clean clone.
4. Build signed container images and generate an SBOM and provenance record.
5. Scan source, dependencies, containers, secrets, and infrastructure configuration.
6. Deploy to an isolated staging environment matching production.
7. Run backup/restore, upgrade/rollback, certificate rotation, and disaster-recovery exercises.
8. Validate DNS, TLS, WAF/rate limits, mail delivery, monitoring, paging, status page, and support rota.
9. Complete business-owner, security-owner, privacy-owner, and operations-owner sign-off.
10. Deploy to a limited release ring, execute smoke tests, observe, then expand.

## Required external production evidence

| Gate | Required evidence | Current local demo state |
|---|---|---|
| Hosted signup | Verified production identity project, email verification, MFA, recovery, abuse protection | Designed; not connected |
| Organization isolation | Applied control-plane migration and positive/negative RLS tests | Migration authored; hosted database not supplied |
| Billing | Provider webhooks, idempotency, tax/refund process, reconciliation | Not connected |
| Licensing | Private issuer, protected signing key, activation/lease service, offline process, revocation | Evaluation metadata only |
| Microsoft 365 | Customer-owned Entra registration, validated issuer/audience/tenant, least-privilege consent, certificate rotation | Configuration boundary only |
| Data protection | Production key management, retention, deletion, backup/restore evidence | Local design/demo controls |
| Legal | Proprietary EULA, privacy notice, DPA, subprocessors, terms, trademark review | Requires counsel and owner approval |
| Operations | SLOs, alerts, paging, incident response, status communications, support coverage | Local health endpoints only |
| Distribution | Private registry, signed artifacts, SBOM, update/rollback process | Repository build only |
| Penetration test | Independent test and closure of critical/high findings | Not performed |

Any missing row above is a `NO-GO` for public production even when the demonstration suite passes.

## Required public-demo evidence

The public synthetic demo has a narrower data scope than the commercial product, but it is still an internet-facing service. Before exposure, retain evidence for:

| Gate | Required evidence |
|---|---|
| Deployment isolation | Separate compute, network, state, secrets, queues, logs, backups, and observability labels from customer/workforce environments |
| Synthetic provenance | Seed manifest uses only `.example` identities and contains no customer-derived sample or export |
| No connector secrets | `M365_GRAPH_ENABLED=false`; no tenant ID, client ID, certificate, managed identity, OAuth token, mail/Teams credential, or customer secret in the deployment |
| Session isolation | Unique short-lived session IDs; scenario/reset tests prove no cross-session state change |
| Mutation boundary | Ordinary runtime mutations return `403 public_demo_boundary`; delivery and connector operations remain previews |
| Edge abuse protection | TLS, WAF/bot controls, distributed start/API rate limits, body limits, no-cache, noindex, and alerting |
| Expiry and reset | Thirty-minute expiry, logout invalidation, deterministic per-session reset, and recovery to the public launcher |
| Security review | Dependency/container/secret scans plus independent review of BFF signing, session claims, and tenant boundaries |

Any missing public-demo gate is a `NO-GO` for the public URL. It does not block a private local client demonstration.

## Demo opening checklist

- Start the acceptance environment and confirm ports 3008 and 3001.
- Open `/landing` in a private browser and validate all public CTAs.
- Open `/landing/demo`, start one guided persona, confirm the synthetic-data boundary, reset it, and verify logout returns to a public entry route.
- Sign in as the platform administrator and confirm the runtime badge is online.
- Reset synthetic data if a deterministic presentation baseline is required.
- Select the customer scenario appropriate to the audience.
- Generate one admin-center report and open both Excel and PDF outputs.
- Open finding `FND-1029`, assign it to FinOps, complete all three exception reviews, and submit the remediation.
- Complete the linked workflow across requester, independent approver, and Microsoft 365 executor personas; verify 87 outcomes, the audit activity, and rollback.
- Open Connection Center, Customer Portal, and Super Admin and explain the data boundary.
- State clearly that screenshots, identities, events, entitlement, and Microsoft connectors are evaluation data.

## Rollback triggers

Rollback immediately when authentication, tenant isolation, report integrity, audit-chain validation, license enforcement, data deletion, or connector authorization behaves unexpectedly. Do not work around these controls during a customer or production session.

## Evidence retention

Retain the release commit, build logs, test JSON, SBOM, scan results, approvals, deployment timestamp, image digests, configuration hashes, database migration version, rollback result, and post-deployment observations according to the release evidence policy.

The per-module behavior and integration boundaries accepted by this gate are recorded in [FUNCTIONAL-ACCEPTANCE-MATRIX.md](FUNCTIONAL-ACCEPTANCE-MATRIX.md).
