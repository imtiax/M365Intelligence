# 360-degree suite capability matrix

The client showcase is a locally executable product experience backed by one internally consistent synthetic financial-services tenant. It presents intended operational workflows without claiming that fictional results came from a live customer tenant.

| Workspace | Demonstrated capabilities | Primary drill-downs |
|---|---|---|
| Command Center | Executive security, compliance, cost, operations, findings | Finding evidence, business impact, control mapping, remediation draft |
| Explorer 360 | Ten workload domains, 158K objects, relationship and history coverage | Workload search, inventory composition, collection assurance |
| Dashboard Designer | Role-aware widget composition, layouts, audiences and refresh | Widget library, responsive sizes, source configuration and saved dashboards |
| Value Center | Adjustable client ROI model and buyer evidence checklist | User/admin/cost assumptions, value breakdown and proof gaps |
| Security | SOC metrics, signals, incidents, threat distribution, exposure | Risk-filtered finding detail and response guidance |
| Alerts | Versioned alert policies, routing, suppression, delivery channels | Test notification, severity, latency, match history |
| Identity | Workforce, guests, privilege, MFA, department risk | Identity watchlist and authentication posture |
| Management | 68 guarded actions across identity, messaging, collaboration, endpoint, and compliance | Action selection, preflight, dry run, approval, execution and rollback flow |
| Automations | Approval-aware lifecycle and response playbooks | Playbook selection, steps, dry run, savings and success history |
| Reporting | Searchable 947-report presentation catalogue across ten workloads | Workload tree, query, favorites, report preview, columns, filters, schedule and run |
| Custom Reports | Governed semantic builder with calculations, preview, schedules and security | Source selection, field ordering, formula, predicates, grouping, delivery and access policy |
| Auditing | Long-term unified audit explorer and activity trend | Search/filter, event context, correlation, integrity evidence, case and alert actions |
| Usage Analytics | Service and organizational adoption, value realization | Adoption depth, departmental heatmap, opportunity segments |
| Compliance | ISO, NIST, CIS, SOC 2 and GDPR readiness | Failed control queue, evidence coverage, owner and due date |
| Licenses | Spend, utilization, savings, SKU analysis | Annual business case and activity-aware SKU details |
| Digital Twin | Temporal resources, relationships, connector health | Six-month historical reconstruction and relationship intelligence |
| Report Studio | Executive, regulatory, security and FinOps publications | Client-ready report preview and decision narrative |
| Governance | Resource request portal, ownership, naming and lifecycle | Request stage, risk, approval and recertification flow |
| Reminders | MFA, guest, license, training and access-review follow-up agents | Cadence, completion, next message and escalation funnel |
| Delegation | Non-admin scoped roles, reports/actions, access reviews | Resource scope, permission chain and separation-of-duties controls |
| Hybrid AD | Forest/domain, controllers, replication, synchronization and privilege | Domain topology, hybrid risks and Entra object-flow view |
| AI Analyst | Local grounded analysis with citations and action drafts | Suggested prompts, sources, report and workflow draft actions |
| Administration | Connectors, collection health, audit, backup, platform configuration | Connector test, configuration validation and immutable activity |
| Enterprise Configuration | Nine production configuration domains with validation and versions | Tenant, collection, identity, data, AI, notification, integration, recovery and security controls |

## Navigation and discovery

Workspaces are grouped into Overview, Operations, Intelligence, Governance, and Platform. Each selection updates a stable URL fragment such as `#reporting` or `#hybrid-ad`, allowing bookmarks and browser history. Global discovery searches both workspace names and the 947-report presentation catalogue.

## Automated showcase verification

`apps/web/scripts/smoke-suite.mjs` starts a headless Chrome session against port 3008, authenticates, visits all 23 workspaces, verifies headings and deep links, exercises global report search, changes a custom-report semantic source, adds a field, opens preview/schedule/security, saves the report, adds a dashboard widget, navigates private-AI configuration, and captures screenshots. Supply the local password through `AEGIS_SMOKE_PASSWORD`; never embed it in the script.

## Honest implementation boundary

The local authentication boundary, UI, synthetic data model, API foundation, temporal PostgreSQL schema, immutable-audit protections, deployment definitions, and security pipeline are executable. Report results, audit events, management actions, connector states, notifications, and AI responses shown in the showcase are deterministic synthetic demonstrations. Live data and action execution require the customer-specific collectors, application registrations, certificates/managed identities, permission consent, persistent repositories, workflow workers, notification credentials, and release gates in `docs/roadmap.md`.
