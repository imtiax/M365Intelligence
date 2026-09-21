# Functional acceptance matrix

Status: verified local demonstration candidate  
Evidence date: 2026-07-16

## Scope and decision

This matrix records what the automated gate actually proves. The accepted target is the local enterprise demonstration on ports 3008 and 3001 using the deterministic Example Organization dataset. It does not certify a public SaaS service or live Microsoft 365 collection/remediation.

`Server-persistent` means the action survives a browser reload in the tenant-scoped local API state. `Browser-persistent` means versioned non-secret state survives in that browser. `Session outcome` means the control produces a visible, testable result during the current workspace session but is not yet a durable production record.

## Cited finding: required action and verified result

Finding `FND-1029`, **Dormant E5 assignments show no qualifying activity**, now has the following executable path:

1. A Platform, Security, or Microsoft 365 administrator assigns an owner, team, priority, future due date, and review note.
2. The reviewer assesses all 87 candidates and explicitly confirms leave, service-account, and legal-hold exceptions.
3. The requester saves a remediation draft or submits it for approval. Duplicate active remediation is rejected.
4. A different Platform or Security administrator approves or rejects with a recorded comment. Self-approval and self-rejection are blocked.
5. A Platform or Microsoft 365 administrator executes the approved local workflow.
6. The deterministic result accounts for every candidate: 67 reclaimed and 20 excluded (8 leave, 7 service account, 5 legal hold).
7. The finding drawer shows assignment, linked workflow, status, and activity after reload. Audit integrity is recomputed over the full tenant chain, and rollback restores the before-state.

The $4,957 monthly value remains an illustrative local estimate. A connected deployment must recalculate it from the customer contract, SKU inventory, service activity, and approved exception policy.

## Workspace acceptance

| Workspace | Accepted working behavior | State and external boundary |
|---|---|---|
| Command Center | Findings open with evidence, required-action guidance, assignment, remediation, linked workflow, and activity timeline | Finding lifecycle is server-persistent; source evidence is synthetic until collectors are enabled |
| Explorer 360 | Search, domain/risk filters, inventory composition, user/object drill-down, and history views | Read-only deterministic dataset; filters are session state |
| Dashboard Designer | Add and configure widgets; saved layout restores after reload | Browser-persistent draft; server publication remains future work |
| Value Center | Adjustable assumptions recalculate the proposal; Export proposal creates a populated PDF from current inputs | Calculation and PDF are working; financial values are illustrative |
| Security | Incident/finding drill-down, governed action draft, and populated incident-register PDF | Drafts are server-persistent; incidents are synthetic until security connectors are enabled |
| Alerts | Policy search, delivery-history view, and test-delivery result | Test/history are visible session outcomes; no production delivery provider is connected |
| Identity | Risk/MFA/privilege analysis and governed remediation draft | Draft is server-persistent; identity signals are synthetic until Graph collection |
| Management | Workload action selection, scope/justification capture, saved workflow draft, and governed queue | Workflow is server-persistent; no live Microsoft 365 mutation is performed |
| Automations | Draft, submit, independent approve/reject, execute, failure isolation, results, rollback, and audit | Server-persistent local executor; live executor requires a customer-approved write identity |
| Reporting | Ten admin-center dashboards, 947-template registry search, populated API report jobs, result preview, Excel, and PDF | Templates become workload queries only after configuration; report jobs are server-persistent and rows come from the local dataset |
| Custom reports | Source/field/filter design, preview, schedule, security policy, save, and export | Definition is browser-persistent; report preview/export works on local data |
| Auditing | Search/filter, event context, populated evidence PDF, Add to case, and Create alert feedback | Export is real; case/alert controls are session outcomes; events are synthetic/local audit data |
| Usage analytics | Adoption metrics, drill-down, and populated adoption/value PDF | PDF is working; trends require Graph Reports history for live use |
| Compliance | Framework/control views, failed-control evidence, and populated evidence-pack PDF | PDF is working; external immutable evidence store is not connected |
| Licenses | SKU/utilization analysis, savings view, and full `FND-1029` governed lifecycle | Lifecycle is server-persistent; license/activity source is deterministic local data |
| Digital twin | Object relationship, connector assurance, and historical reconstruction views | Read-only local model; live temporal graph needs collector/storage integration |
| Report Studio | Template/library selection, report preview, and publication-oriented controls | Client-ready presentation path; durable publication/version service remains future work |
| Governance | Request/policy/attestation views and governed action draft | Workflow draft is server-persistent; external approval/notification delivery is not connected |
| Reminders | Rules and a rendered preview of the next reminder message | Preview is a session outcome; scheduler and delivery worker are not connected |
| Delegation | Role/scope review drawer plus approve-for-90-days and revoke-request decisions | Decisions are visible session outcomes; production entitlement writes are not connected |
| Hybrid AD | Health scan result and topology drawer | Results are session outcomes over synthetic data; on-premises agent is not connected |
| Connection Center | Connector inventory, deployment guidance, and configuration entry points | Configuration boundary only; Microsoft Graph workers are not shipped in this branch |
| Customer Portal | Tenant/license/support commercial presentation and deployment request path | Demonstration control-plane UX; no hosted billing or activation service |
| AI Analyst | Grounded local synthetic answers, cited sources, and action/report draft entry points | Local deterministic API behavior; no live model or customer retrieval index is enabled |
| Configuration | Controlled fields, inline validation, test/validate actions, safe versioned save, and reload restoration | Non-secret values are browser-persistent; secret-like fields are excluded from storage |
| Administration | Connector/access/audit/protection/infrastructure tabs and authorized organization directory | Platform-admin protected presentation and local identity data; production services remain external gates |
| Super Admin | Cross-tenant commercial and entitlement administration presentation | Platform-admin only; hosted control plane is not connected |

## Known local-demo limitations

- Versioned report schedules, access-policy metadata, enterprise configuration, dashboard layouts, and some suite decisions use browser `localStorage`. They are editable by the local browser user, are not tenant/user partitioned, and are not server authorization controls.
- Activating a demo schedule records validated metadata but does not start a durable scheduler or notification worker. Access-rule editor/picker controls remain presentation entry points until a server-side policy service is connected.
- The runtime JSON store uses atomic file replacement per write, but a domain change, audit append, event publication, and case activity are separate writes. Production requires a transactional PostgreSQL repository plus outbox and externally anchored audit evidence.
- The 87 dormant-E5 candidates and their 67/20 classification are deterministic fixture logic. They are not derived from a connected tenant’s 90-day Graph activity or contractual evidence.
- Client-generated exports use populated local rows and disclosures, but browser-only report-policy metadata is not an enforced export authorization or masking boundary.

## Automated evidence

The release suite proves:

- API production build and 12 unit tests.
- API end-to-end replay defense, tenant scoping, finding lifecycle, rejection, exact 87-candidate accounting, rollback, report jobs, failure isolation, tenant-filtered SSE, persistence, and audit integrity.
- Browser traversal of Command Center plus 26 modules.
- Five populated operational PDFs with valid PDF headers and one populated SpreadsheetML Excel export.
- 26 shared governed workflow CTAs creating persistent drafts, plus five stateful suite-action outcomes during the complete journey.
- Six API authorization personas and six UI navigation personas, including denied mutation checks.
- An inventory of 391 visible buttons and 65 visible inputs with zero unlabeled or silently disabled controls.
- Desktop and mobile landing rendering, screenshots, internal links, deployment CTA, and overflow checks.

Machine-readable release evidence is written to `artifacts/release-candidate.json`. See [GO-LIVE-RUNBOOK.md](GO-LIVE-RUNBOOK.md) for the separate public-production `NO-GO` gates.
