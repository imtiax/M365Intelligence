# Customer acceptance and enhancement register

## Acceptance scope

This review treats the local platform as a customer pilot. The production Next.js build, production-authenticated API, persistent local state, six organization personas, Command Center plus 26 modules, 391 visible buttons, and 65 visible inputs are exercised. Microsoft 365 remains deliberately disconnected; Graph collection and tenant mutation are integration work, not represented as completed by synthetic acceptance data.

## Module results and enhancement disposition

| Page or module | Customer journey exercised | Result | Enhancement identified | Disposition |
| --- | --- | --- | --- | --- |
| Command center | Posture, findings, assignment, exception review, remediation, linked workflow, navigation, tenant and notification controls | Pass | Personalize data and actions by effective role | Implemented tenant-scoped case persistence, role-filtered navigation and signed identity |
| Explorer 360 | Search, filters, object relationships and drill-down | Pass | Enforce tenant and role boundary at the data API | Implemented authenticated same-origin proxy and tenant claims |
| Dashboard designer | Add/configure/persist widgets | Pass | Preserve user-specific drafts | Browser persistence verified; server persistence remains P2 |
| Value center | Assumptions, calculation and populated proposal PDF | Pass | Record model/version used for a business case | P2 product enhancement |
| Security | Findings, investigation drawer and governed action submission | Pass | Stop automatic self-approval | Implemented independent approval queue |
| Alerts | Policy list, search, delivery history and test-delivery outcome | Pass | Persist alert-policy edits and evaluation history | Session outcome implemented; durable history is P1 after live signal ingestion |
| Identity | Identity risk, MFA and privileged-access analysis | Pass | Bind remediation to organization role | Implemented security/M365 role enforcement |
| Management | Workload dashboards and guarded actions | Pass | Separate requester, approver and executor | Implemented and cross-persona tested |
| Automations | Playbook selection, dry run and workflow state | Pass | Replace static approval count with real queue | Implemented persistent approval/execution/rollback queue |
| Reporting | Ten admin centers, catalogue, generation and downloads | Pass | Prevent viewers from creating reports | Implemented API role enforcement |
| Custom reports | Source, field, filter, preview, schedule, security and save | Pass | Apply report-author permission at execution | Implemented signed report-admin/platform-admin identity |
| Auditing | Search, evidence filters, populated PDF export, case and alert outcomes | Pass | Restrict chained audit evidence | Implemented platform/security/auditor access; case/alert outcomes are session state |
| Usage analytics | Adoption metrics and drill-down | Pass | Replace synthetic trend with collector history | P1 with Graph Reports collector |
| Compliance | Framework posture, evidence and exception views | Pass | Add immutable evidence storage backend | P1 infrastructure integration |
| Licenses | Assignment, utilization and savings analysis | Pass | Add live subscribed-SKU and usage collection | P1 Graph integration |
| Digital twin | Object graph and relationship exploration | Pass | Persist Graph-derived relationships | P1 collector/storage integration |
| Report studio | Templates, library, previews and export | Pass | Server-side publication/version workflow | P2 product enhancement |
| Governance | Policy, exception and attestation views | Pass | Persist attestations and escalation SLA | P1 workflow enhancement |
| Reminders | Reminder rules and rendered next-message preview | Pass | Add scheduler/notification worker | Preview implemented; delivery is P1 platform service |
| Delegation | Delegated roles and permission flow | Pass | Make displayed roles effective | Implemented six effective organization personas |
| Hybrid AD | Health, sync, scan outcome and topology drawer | Pass | Add on-premises agent and secure outbound channel | Session outcomes implemented; P1 external agent integration |
| AI analyst | Prompt, grounded answer and evidence presentation | Pass | Enforce retrieval filtering and prompt audit in model service | P1 before enabling a live model |
| Configuration | Tenant, connectors, auth, data and AI settings | Pass | Prevent browser-supplied identity headers | Implemented signed server-to-server claims |
| Administration | Connector, access, audit, protection and infrastructure tabs | Pass | Show actual configured identities | Implemented safe organization directory for platform admins |

## Implemented security controls

- Six local organization identities with scrypt password hashes and individual random salts.
- Signed HttpOnly sessions containing tenant, user, title, and assigned role claims.
- SameSite cookies, origin validation, login throttling, generic authentication errors, and no-store responses.
- A same-origin web API boundary; browsers no longer supply tenant IDs, actor IDs, or role headers.
- HMAC-SHA256 signed, one-minute internal identity envelopes between web and API.
- Production acceptance API rejects unsigned, expired, tampered, or replayed identity envelopes.
- Restrictive browser/API security headers include CSP, frame denial, MIME sniffing prevention, referrer policy, and disabled browser sensor permissions.
- Deny-by-default module navigation by effective role.
- Server-side authorization for reports, workflows, approvals, execution, rollback, audit access, simulation, reset, and organization-directory access.
- Separation of duties: a requester cannot approve their own workflow.
- Persistent workflow state, failure isolation, rollback, real-time events, correlation IDs, and SHA-256 audit chaining.

## Organization acceptance personas

| Account | Effective role | Primary access |
| --- | --- | --- |
| `admin@apex.local` | Platform Administrator | Full platform and organization administration |
| `security@apex.local` | Security Administrator | Security, identity, audit and approval |
| `m365admin@apex.local` | Microsoft 365 Administrator | Management, execution and rollback |
| `reports@apex.local` | Reporting Administrator | Reporting, report design and dashboards |
| `auditor@apex.local` | Compliance Auditor | Read-only security, compliance and audit evidence |
| `viewer@apex.local` | Read-only Analyst | Restricted business intelligence views |

These accounts share the generated local acceptance password only for the local pilot. Production must use Microsoft Entra OIDC, MFA/authentication-strength claims, group or app-role mapping, Conditional Access, and managed identity or certificate authentication between services.

## Remaining production gates

The local acceptance product is functional, but the following cannot be truthfully marked complete without customer infrastructure: Microsoft Graph collectors, delta cursors and subscriptions; Exchange/Teams/Purview workload-specific APIs; an on-premises Hybrid AD agent; durable PostgreSQL/queue workers; enterprise notification delivery; immutable external evidence storage; backup/restore rehearsal; HA/performance testing; SIEM integration; and a customer-approved Entra application/permission model.
