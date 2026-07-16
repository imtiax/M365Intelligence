# Enterprise Microsoft 365 simulation

## Customer environment

The local acceptance environment simulates **Global Enterprise Holdings**, a 5,000-user logistics, manufacturing, and financial-services organization operating across 25 countries. It is deterministic, persistent, resettable, and connected to the secured application APIs. It does not claim to be live Microsoft Graph data.

## Generated ecosystem

| Entity | Count |
| --- | ---: |
| Users | 5,000 |
| Microsoft 365 groups | 500 |
| Teams | 800 |
| Channels | 5,000 |
| SharePoint sites | 300 |
| OneDrive accounts | 5,000 |
| Mailboxes | 5,000 |
| Managed devices | 7,000 |
| Enterprise applications | 300 |
| **Normalized enterprise objects** | **28,900** |

Users contain name, username, department, location, manager, job title, license, account state, risk, last login, MFA state, device count, Teams membership, mailbox usage, and contextual recommendations. The generator also creates departments, locations, license plans, security events, risk findings, compliance controls, report templates, timeline activity, audit records, and automation workflows.

## Interactive customer journeys

- **Executive command center:** live tenant KPIs, object population, timeline, scenario controls, event generation, and full reset.
- **User 360:** search and risk filtering across 5,000 identities with a detailed profile and recommendations.
- **Security operations:** impossible travel, failed MFA, legacy authentication, active incidents, and prioritized findings.
- **License optimization:** 1,500 unused E5 assignments, per-user downgrade candidates, and annual savings modeling.
- **Compliance:** ISO 27001, NIST, CIS, and SOC 2 controls, scores, failed objects, and recommendations.
- **AI analyst:** API-generated, evidence-grounded answers for security, licensing, compliance, and executive questions.
- **Automation:** requester/approver/executor separation, persistent status, failure isolation, audit, and rollback.
- **Reporting:** customer-ready security, identity, license, and compliance templates with PDF/Excel export.

## Scenario selector

The customer demo selector activates Normal Operations, Security Breach, License Optimization, Compliance Audit, Identity Risk, or Executive CIO mode. Activation changes persisted KPIs and adds timeline/audit events. The simulation engine adds login, risk, alert, AI recommendation, license, and device events every 30 seconds; the administrator can also trigger an event immediately.

## Logical demo database

The local JSON repository is the acceptance storage adapter for the same logical entities that map to production tables: users, departments, locations, licenses, devices, mailboxes, teams, channels, groups, SharePoint sites, OneDrive accounts, applications, security events, risk findings, reports, compliance controls, audit logs, automation workflows, and timeline events. Production deployment should replace this adapter with tenant-partitioned PostgreSQL and worker-backed ingestion without changing the API contracts.

## API surface

Secured routes are available under `/api/v1/demo`: `overview`, `users`, `users/:id`, `security`, `licenses`, `compliance`, `timeline`, `report-templates`, `ai`, `scenarios/:scenario/activate`, and `tick`. Browser calls use the same signed, replay-protected web-to-API identity boundary as reporting and workflows.

Reset the environment with the Command Center button or:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-acceptance.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\start-acceptance.ps1 -SkipBuild -ResetData
```
