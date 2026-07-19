# Aegis Microsoft 365 360 capability matrix

This is the delivery contract for the rebuilt product. A page is not a capability: each item below requires a connector/data contract, normalized data, an API, authorization, a user workflow, audit evidence, and automated verification.

## Common capability contract for every admin center

Every enabled service must provide the same operating model:

| Plane | Required capability |
| --- | --- |
| **Inventory** | Current objects, ownership, configuration, posture, lifecycle state, and scoped search. |
| **Activity** | Durable events: actor, target, operation, timestamp, IP/device where available, outcome, and source freshness. |
| **Trends** | Historical measures, comparison period, anomaly/threshold rules, drill-down to contributing records. |
| **Reports** | Column selection, filters, multi-sort, grouping, joins to approved datasets, saved views, schedule, export, receipt. |
| **Actions** | Read-only by default; dry-run, policy check, MFA/approval, execution receipt, and rollback/compensation where supported. |
| **Governance** | Data-scoped delegation, retention, control mappings, exceptions, and audit trail. |

## Admin-center coverage

| Service | Inventory | Activity | Trends | First governed actions |
| --- | --- | --- | --- | --- |
| **Entra ID** | Users, groups, roles, guests, devices, applications, service principals, authentication methods, CA policies | Directory audit, sign-ins, risk events, role changes | MFA/SSPR, sign-in failure, guest, privilege and device posture | Disable/restore user, group membership, license assignment, revoke sessions — approval-gated |
| **Exchange Online** | Mailboxes, shared mailboxes, holds, quotas, forwarding, permissions, rules, accepted domains | Mailbox/admin audit, permission, forwarding, transport and configuration changes | Mail flow, mailbox growth, inactive mailbox, threat indicators | Forwarding/rule review, mailbox permission changes — approval-gated |
| **Teams** | Teams, channels, owners, members, guests, apps, policies | Creation, membership, ownership, channel/app/policy events | Usage, meetings, calls, inactive teams/users | Owner remediation, membership workflow, archival review |
| **SharePoint Online** | Sites, owners, sharing, sensitivity, storage, libraries | Sharing, permissions, file/site events, admin changes | Storage, external sharing, inactive sites, adoption | Sharing remediation and ownership workflow |
| **OneDrive** | Drives, owners, storage, external links | Sharing/file activity and access events | Storage, inactive/unenrolled owners, external exposure | Link/ownership review workflow |
| **Defender XDR** | Incidents, alerts, devices, exposure signals | Alert/incident lifecycle and investigation events | Incident volume, severity, mean time to triage | Ticket/containment workflow integration |
| **Purview** | DLP, retention, labels, eDiscovery/insider-risk metadata as consent allows | DLP/label/retention audit evidence | Policy/control coverage and exception trends | Evidence and exception workflow |
| **Intune** | Devices, compliance, configuration/app deployment state, Autopilot where licensed | Device/compliance/configuration changes | Compliance, stale device, OS/update posture | Device remediation workflow, no direct write without explicit pack |
| **Licensing & Cost** | SKUs, assignments, capacity, service plans, cost catalog | Assignment/removal history and approval audit | Utilization, dormant license, forecast, reclaim opportunity | Reclaim proposal, staged license action, rollback plan |
| **Power BI / Fabric** | Workspaces, reports, datasets, owners, sharing | Sharing/export/admin audit where API supports | Adoption, unused assets, exposure | Ownership/access review workflow |
| **Hybrid AD** | Domains, users, groups, computers, OUs, GPOs | Auth, lockout, group/GPO/object changes | Stale accounts/devices, lockouts, risky privilege paths | Local agent runbook workflow, never internet-exposed |

## Custom report builder

1. Select a governed dataset and tenant/resource/time scope.
2. Add/remove/reorder columns; set multi-sort and filter groups.
3. Join only datasets declared compatible by a semantic model. Joins are visible in the report definition and evidence receipt.
4. Preview paged results from the backend; no browser-only filtering for connected data.
5. Save private/team/organization views with owner, revision, permission, and retention metadata.
6. Export CSV, XLSX, PDF, HTML, and raw JSON plus a signed evidence receipt.
7. Schedule a saved view using explicit time windows, destination approval, in-body preview, empty-result policy, and delivery audit.
8. Promote a report definition to an alert rule or an approval-gated operational workflow.

## PowerShell runbook contract

PowerShell is an administrator acceleration layer, not an unrestricted remote shell.

- A runbook is versioned, reviewed, signed/hashed, tagged with service, required modules, least-privilege scopes, data classification, and whether it is read-only or mutating.
- Read-only runbooks can be copied/downloaded from the portal and produce optional evidence imports.
- Mutating runbooks require dry-run support, explicit target input, connector policy validation, a fresh MFA claim, independent approval, and a durable execution receipt.
- The product must never accept arbitrary PowerShell from a browser and execute it on a customer host.
- Initial library: inactive accounts, privileged-role review, external forwarding, mailbox permissions, ownerless Teams, external sharing, inactive sites, device compliance, dormant license staging, and audit collection health.

## Data and integration milestones

1. **Persistent core:** PostgreSQL tenant model, connector registrations, encrypted cursor/secrets references, report definitions, views, schedules, jobs, workflow cases, and immutable audit ledger.
2. **Connected Entra and Licensing:** OAuth/OIDC sign-in, app-only certificate collector, delta/notification collection, user/group/role/sign-in/license reporting, controlled license workflow.
3. **Collaboration and Exchange:** Exchange, Teams, SharePoint, OneDrive normalized models and first 360 explorers.
4. **Security/compliance/device:** Defender, Purview, Intune integrations; historical controls and policy evidence.
5. **MSP/Hybrid scale:** partner tenants, data-scoped delegation, local hybrid agent, backup/restore, performance and disaster-recovery validation.

## Acceptance criteria

The rebuilt solution is accepted only when a tenant administrator can:

1. Connect an allowed Microsoft 365 tenant using documented least-privilege consent and see connector freshness/coverage.
2. Move from a dashboard measure into the exact underlying records and the source evidence.
3. Build, save, schedule, export, and delegate a custom report without using browser-only demo data.
4. Open User, Mailbox, Team, Site, Device, and Application 360 views with cross-service relationships.
5. Use a read-only daily PowerShell runbook safely and submit a mutating operation through dry-run and independent approval.
6. Demonstrate that a delegated administrator cannot view or act outside their data scope.
7. Export a time-bounded, tenant-scoped audit/control evidence pack with source freshness and retention metadata.
