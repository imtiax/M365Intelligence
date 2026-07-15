# Client demonstration guide

## Purpose and safety

The local showcase represents Apex Financial Group, a synthetic regulated multinational with 12,480 identities. Every person, alert, control result, cost, finding, connector state, report, and workflow action is fictional. The UI displays persistent demo labeling; do not remove it when presenting generated data as a product capability.

No Microsoft 365 tenant, internet connection, or external model is required for the showcase. Buttons simulate safe presentation flows and never change Microsoft 365.

## Start locally

The fastest presentation mode does not require the API or data services:

```powershell
cd "C:\Projects\M365 Intelligence and Security Operations Platform\apps\web"
npm.cmd install
npm.cmd run auth:setup
npm.cmd run dev
```

Open `http://localhost:3008`.

The setup command prints the local username and generated password once. Authentication uses a rate-limited server endpoint, scrypt-derived password hash, signed eight-hour session, and HttpOnly/SameSite cookie. Local HTTP sets `AEGIS_COOKIE_SECURE=false`; any network or production deployment must use trusted HTTPS and `AEGIS_COOKIE_SECURE=true`.

For the complete local infrastructure demonstration:

```powershell
cd "C:\Projects\M365 Intelligence and Security Operations Platform"
Copy-Item .env.example .env
# Replace all CHANGE_ME values, start Docker Desktop, then:
docker compose up --build -d
```

Open `http://localhost:8080`.

## Recommended 30-minute seller-led presentation

1. **Command Center — 2 minutes.** Establish the combined security, compliance, cost, and operations narrative. Open the critical MFA finding to show evidence, controls, ownership, and remediation.
2. **Explorer 360 — 2 minutes.** Present ten workload domains, local object coverage, collection assurance, and historical depth.
3. **Reporting and Custom Reports — 4 minutes.** Search “mailbox,” open a catalog report, then build a custom report: select Mailboxes, add/remove fields, show a calculated expression, preview rows, configure scheduling, and inspect access/masking policy.
4. **Auditing — 2 minutes.** Investigate a risky activity, show normalized context, correlation, evidence integrity, and alert creation.
5. **Management — 2 minutes.** Select a high-risk operation and walk through preflight, dry run, approval, idempotency, verification, and rollback.
6. **Security and Alerts — 2 minutes.** Show correlated threats, deterministic findings, alert routing, and suppression effectiveness.
7. **Identity and Delegation — 2 minutes.** Explain authentication strength, departmental risk, non-admin scopes, and separation of duties.
8. **Usage and Licenses — 2 minutes.** Connect adoption depth to the $501K annual optimization opportunity.
9. **Governance and Reminders — 2 minutes.** Walk through a resource request lifecycle and the follow-up agents driving owner/user action.
10. **Compliance — 2 minutes.** Compare framework readiness, evidence freshness, failed controls, owners, and deadlines.
11. **Digital Twin and Hybrid AD — 2 minutes.** Reconstruct six-month tenant state, then show forests, synchronization, and hybrid risk.
12. **Automations and AI Analyst — 2 minutes.** Run a synthetic dry run and generate grounded analysis with local sources.
13. **Dashboard Designer — 1 minute.** Add a governed widget, change its size, and explain role-aware executive dashboards.
14. **Enterprise Configuration — 2 minutes.** Move through identity, collection, data, private AI, integrations, backup, and security to prove deployability.
15. **Value Center — 2 minutes.** Enter the client’s users, administrators, labor cost, and tool overlap; use the result as a discovery hypothesis, not a guaranteed saving.
16. **Administration — 1 minute.** Close with connectors, collection state, audit immutability, backup RPO, and sovereignty.

## Reset behavior

The showcase is deterministic and client-side. Refreshing clears temporary filters, drawers, previews, and notifications. Saved custom-report definitions, dashboard widgets, and theme preference persist in browser local storage so a presentation can continue after reload. Clear site data for `localhost:3008` to return those items to defaults. No client presentation action modifies Microsoft 365 or local infrastructure.

## Verification

With the local demo password in `AEGIS_SMOKE_PASSWORD`, run:

```powershell
cd apps/web
$env:AEGIS_SMOKE_PASSWORD = '<local demo password>'
npm.cmd run test:smoke
npm.cmd run audit:controls
```

The browser suite authenticates, visits all 23 workspaces, exercises the report and dashboard designers, shell controls, a governed workflow, administration tabs, configuration, persistence, and global search. The control audit inventories every visible button and input on every routed page.

## What is demonstrated versus integrated

The showcase demonstrates intended workflows and presentation UX across the product. The API foundation, tenant boundary, local deployment assets, temporal schema, audit protections, health metrics, builds, and unit tests are executable. Live Microsoft Graph/workload collection, Entra production authentication, persistent workflow execution, ServiceNow delivery, and local model inference require the implementation phases and customer-specific credentials documented in `docs/roadmap.md`.
