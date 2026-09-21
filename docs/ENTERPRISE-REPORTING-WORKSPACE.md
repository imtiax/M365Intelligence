# M365Intelligence Enterprise Reporting Workspace v1

Status: implementation candidate in the current working branch

Scope: tenant-scoped local demonstration runtime

Evidence date: 2026-07-17

## Purpose

The M365Intelligence Enterprise Reporting Workspace gives Microsoft 365 administrators one governed path from an executive indicator to the contributing records, a reusable report definition, an executed report job, an export, and retained operational evidence.

Version 1 is designed for a credible local client demonstration. It runs against the M365Intelligence deterministic enterprise dataset and local API state. It does not represent live Microsoft Graph collection, unattended scheduling, or external email and Teams delivery. Those boundaries are stated throughout this document and in the product experience.

## Public research basis

The workspace was informed by clean-room review of general, publicly accessible enterprise reporting and management patterns. No authentication was bypassed, no tenant was connected, no management action was executed, and no third-party source code, assets, screenshots, report definitions, or demo records were copied.

The reusable industry patterns identified were:

- workload and tenant context that remains consistent while the user moves between dashboards, reports, operations, and administration;
- report discovery through search, workload categories, frequently used views, and operational metadata;
- dashboard indicators that drill into records rather than ending at a decorative chart;
- reusable report views that preserve selected columns, filters, visibility, and ownership;
- report schedules, threshold monitoring, execution history, and audit evidence in the same workspace;
- separation between report access, data scope, and permission to create or execute operational objects; and
- an explicit workflow from observation to evidence, action, verification, and accountability.

These are general product and workflow concepts. M365Intelligence implements them with its own information architecture, data model, visual system, terminology, code, synthetic data, security controls, and acceptance tests.

## Originality and no-copy boundary

M365Intelligence is an original implementation, not a clone, derivative interface, embedded service, or integration of any third-party product.

The following material must not be imported into M365Intelligence:

- third-party names, branding, logos, iconography, color systems, screenshots, layout measurements, copy, or marketing claims;
- third-party HTML, JavaScript, stylesheets, network responses, internal APIs, route structure, product assets, or compiled resources;
- proprietary report catalogues, report descriptions, identifiers, sample records, workflow templates, alert templates, or dashboard compositions; and
- unsupported comparison claims based only on a public demonstration.

The 947-entry M365Intelligence catalogue is original demonstration template content. It is assembled from M365Intelligence-owned base definitions, customer-presentation templates, and workload perspectives such as overview, trend, exception, risk, owner, region, evidence, cohort, exposure, and lifecycle. It is not scraped data and it must not be presented as 947 independently implemented reports or Microsoft Graph collectors. Microsoft product and workload names are used descriptively.

## Version 1 capability

### Ten workload dashboards

The workspace provides dashboard coverage for:

1. Microsoft Entra ID
2. Exchange Online
3. Microsoft Teams
4. SharePoint Online
5. OneDrive
6. Microsoft Intune
7. Defender XDR
8. Microsoft Purview
9. Licensing and Cost
10. Hybrid Active Directory

Each dashboard contains workload-specific indicators, trend or distribution panels, a representative record table, and related report entry points. Indicator cards are interactive: opening a metric displays the contributing local preview records, evidence context, and a path to generate the corresponding full report job.

Dashboard values and previews are deterministic demonstration data until live collectors are enabled. The UI must retain its local/synthetic disclosure and must not label these values as a current customer tenant snapshot.

### Original 947-template registry

The catalogue contains exactly 947 Aegis presentation templates across the ten workloads. A template is discovery metadata that opens the governed workload report engine; it is not a separate collector or unique server query. Its columns and filters become an executed definition only when configured and run. Catalogue counts are derived from the registry rather than hard-coded category totals.

Users can narrow the registry through:

- report name, category, field, and description search;
- workload;
- category;
- data-freshness band;
- favourite status; and
- scheduled-template status.

The result counter reports the current result set against the full registry. Workload and category facets use the actual registry distribution. Up to 75 matching entries are rendered at once to keep the catalogue responsive while preserving an accurate match count.

### Executed report jobs

Generating a report creates a tenant-scoped report job in the local API. This is an executed data operation, not a toast-only simulation.

The job:

1. validates that the requested workload exists for the tenant;
2. stores the requester, requested columns, filters, trigger, and correlation context;
3. progresses through queued, running, and terminal state;
4. applies the configured filters to the tenant's local resource records;
5. shapes the result using the requested columns;
6. persists result rows, totals, and critical, warning, and average-risk metrics; and
7. records completion or failure in the audit and run history.

Supported filter fields are status, risk, department, region, resource type, external state, and activity score. Operators include equals, not equals, contains, greater-than-or-equal, and less-than-or-equal. Multiple clauses are evaluated in their displayed order with explicit `AND` or `OR` connectors. Numeric comparisons reject non-numeric values rather than silently coercing them.

The existing result experience can preview the persisted rows and produce populated PDF and SpreadsheetML Excel outputs. An export is derived from the completed local job; it is not evidence of live Graph collection.

### Persistent saved views

A saved view is a tenant-scoped, reusable execution definition containing:

- source report identifier and name;
- workload and optional description;
- selected columns;
- ordered `AND`/`OR` filter clauses;
- `private` or `team` visibility;
- favourite state;
- creator; and
- created and updated timestamps.

Private views are visible to their creator and authorized platform administrators. Team views are available to the tenant's authenticated reporting users. Duplicate active view names are rejected within a tenant. Saving a view appends an audit record and makes the definition available in the Views and Operations workspace after reload.

Opening a saved view restores its persisted columns, ordered filters, visibility, and favourite state. Running it uses the dedicated saved-view endpoint, so the API copies the persisted definition server-side and links the resulting job to that view; the browser cannot attach a view identifier to an unrelated query.

### Schedules and local archive

An authorized user can attach a daily, weekly, or monthly schedule to a saved view. The schedule stores its time zone, local run time, applicable day, active or paused state, calculated next-run time, creator, and local-archive delivery target.

For version 1, **Run now** queues a report job linked to both the saved view and schedule. The result and execution metadata are retained in the tenant's local runtime archive and appear in run history. A schedule definition alone does not cause unattended execution: the durable automatic worker is an external gate described below.

“Local archive” currently means the persisted Aegis local runtime record and its report result. It must not be represented as a customer-configured immutable archive, encrypted evidence vault, SharePoint library, or external records-management repository unless those services are separately implemented and verified.

### Threshold alerts

An authorized user can attach a threshold policy to a saved view. Policies support:

- row count, critical count, warning count, or average risk;
- greater than, greater than or equal, equal, less than or equal, or less than;
- information, warning, or critical severity; and
- active or paused state.

When a job linked to that view completes, the local report engine evaluates each active policy, records the observed value and evaluation time, and records a trigger time when the condition matches. Evaluation and trigger events are written to the local event stream and audit history. Version 1 does not send the alert through email, Teams, SMS, or a third-party incident platform.

### Views and Operations control plane

The control plane brings together:

- totals for saved views, active schedules, active alerts, completed jobs, failures, and triggered alerts;
- saved view ownership, visibility, column, and filter metadata;
- schedule cadence, next-run state, and manual acceptance execution;
- alert threshold, severity, last-observed value, and last-evaluated or triggered time; and
- recent interactive and schedule-triggered runs with requester, progress, row count, state, error, and timestamps.

This makes the reporting lifecycle inspectable after navigation or browser reload and provides a single operational hand-off point for reporting administrators.

### RBAC, tenant isolation, and audit

Report creation, saved-view creation, schedules, alert policies, and manual scheduled runs are protected API operations for Platform Administrator and Report Administrator roles. Read access honours tenant context and saved-view visibility. Platform administrators can inspect private tenant reporting objects for operational support; ordinary users cannot read another creator's private view.

Every reporting object carries a tenant identifier. View, schedule, alert, run, and audit queries are constrained to that tenant. Reporting mutations append actor, object, action, outcome, correlation, and timestamp evidence to the local audit chain. The control plane exposes operational state but does not weaken the underlying authorization checks.

Job result visibility follows the same boundary: platform administrators may inspect all tenant jobs; unlinked interactive jobs are visible only to their requester; jobs linked to a team view are available to authenticated tenant users; and jobs linked to a private view are visible only to its creator. Unauthorized job detail requests return not found rather than disclosing the object.

This local authorization model is acceptance evidence for the demonstration. Public production still requires the production identity provider, transactional database, row-level isolation, key management, and independently verified authorization tests listed in the go-live runbook.

## Capability boundary

| Capability | Version 1 working behavior | Persistence and boundary |
|---|---|---|
| Catalogue | 947 original templates with real facets and counts | Bundled Aegis demonstration registry; not 947 implemented queries or Graph collectors |
| Dashboards | Ten workload views, interactive metrics, record drilldowns | Deterministic local data |
| Report jobs | Server-side filters, selected columns, rows, metrics, terminal status | Tenant-scoped local API state |
| Saved views | Columns, ordered filters, private/team visibility, favourite and owner | Tenant-scoped local API state |
| Schedules | Validated cadence/time zone, next-run metadata and manual Run now | Local schedule metadata; no unattended worker |
| Alerts | Threshold definition and evaluation during linked report jobs | Local event and audit evidence; no external notification |
| Operations | View, schedule, alert and run history with outcome summaries | Local API state survives browser reload |
| Exports | Populated PDF and Excel output from completed local rows | User-initiated file output |
| RBAC | Protected mutations and private/team view enforcement | Local demo identities and roles |
| Audit | Reporting lifecycle events with actor and correlation evidence | Local audit chain; no external immutable anchor |

## Client demonstration acceptance flow

Use a clean local runtime and the published demo identities. Do not enter customer credentials or connect a customer tenant during this flow.

1. Sign in as a Platform Administrator or Report Administrator and open **Reporting**.
2. Confirm the catalogue summary displays 947 entries and the dashboard selector displays all ten workloads.
3. Open a workload dashboard, select a metric, inspect its contributing records and local-data disclosure, then choose **Generate full evidence**.
4. Open the catalogue and combine workload, category, freshness, favourite, and scheduled facets. Confirm the displayed result count changes from registry data.
5. Open a report, select a meaningful column set, and add at least two filters joined with `AND` or `OR`.
6. Generate the report. Confirm the job reaches completed state and that its persisted rows reflect the selected columns and filters.
7. Open the result preview and generate the PDF and Excel outputs. Confirm each contains populated report rows and the local-snapshot disclosure.
8. Save the configuration as a favourite team view. Reload the workspace and confirm the view, owner, columns, filters, and visibility remain available.
9. Add a daily local-archive schedule to the view. Open **Views and Operations**, choose **Run now**, and confirm a schedule-linked job and completed run-history entry appear.
10. Add a warning or critical threshold alert. Run the linked view again and confirm its observed value and evaluated or triggered time are recorded.
11. Review the operations summary and recent runs. Confirm requester, trigger type, state, timestamps, row count, and any failure are visible.
12. Sign in with a role that lacks reporting administration permission and verify that protected reporting mutations are rejected.
13. Review the reporting audit records for view creation, schedule creation, alert creation or evaluation, report completion, actor, and correlation evidence.

A successful walkthrough demonstrates the local enterprise reporting lifecycle. It does not authorize a claim that live collection, unattended delivery, or public production is complete.

## Explicit external gates

### Live Microsoft Graph data

Live reporting remains gated until a customer-owned Entra application and collection service are available. Production evidence must include:

- tenant-specific administrator consent and least-privilege read scopes;
- certificate-based application authentication with protected key storage and rotation;
- Graph, security, audit, usage, Intune, Exchange, SharePoint, Teams, Purview, and other required workload collectors;
- delta, pagination, throttling, retry, reconciliation, and deletion handling;
- normalized identifiers and cross-workload entity correlation;
- collection watermark, source, query window, and freshness provenance on every metric and report; and
- positive and negative tenant-isolation tests over the production repository.

Until that evidence exists, the dashboards and report rows must remain labelled as local demonstration data.

### Automatic schedule worker

Unattended schedules remain gated on a durable worker service. It must provide:

- time-zone and daylight-saving-safe dispatch;
- durable leases, idempotency keys, retry policy, dead-letter handling, and restart recovery;
- concurrency, back-pressure, cancellation, and tenant resource limits;
- atomic job, archive, alert-evaluation, and audit transitions;
- worker health, lag, failure, and delivery monitoring; and
- tested upgrade, backup, restore, and disaster-recovery procedures.

Version 1 calculates the next run and supports a governed manual run. It must not claim that active schedules execute automatically.

### Email and Microsoft Teams delivery

External delivery remains gated until approved providers and tenant configuration are connected. Production evidence must include:

- verified sender and recipient configuration;
- protected SMTP, Graph mail, Teams bot, or webhook credentials;
- authorized templates, attachment size controls, classification and DLP policy;
- recipient and destination allow-lists where required;
- delivery identifiers, acknowledgements, failure reasons, retry and suppression handling; and
- auditable delivery history without logging credentials or sensitive report contents.

Version 1 stores reports in the local runtime and raises local events. It does not send email or Teams notifications.

## Release statement

The Enterprise Reporting Workspace v1 may be presented as a locally operational, synthetic-data reporting demonstration after its automated API, browser, role, persistence, export, and audit acceptance tests pass on the release commit.

It must not be presented as a live Microsoft 365 reporting service until the three external gates above and the wider public-production gates in [GO-LIVE-RUNBOOK.md](GO-LIVE-RUNBOOK.md) have verified evidence.
