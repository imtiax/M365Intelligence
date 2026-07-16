# End-to-end acceptance environment

## Purpose

This environment validates the platform workflow before Microsoft 365 credentials are introduced. It is not a static UI fixture: the web application calls the local API, 5,000 detailed users and 28,900 normalized enterprise objects persist alongside 7,850 reporting resources, scenarios and timeline activity change in real time, report jobs and workflows transition through enforced states, and audit entries form a verifiable SHA-256 chain.

The resources are synthetic. Live Graph data and production Microsoft 365 changes remain disabled until the connection and release checklist in `MICROSOFT-365-CONNECTION.md` is complete.

## Start

Generate local credentials once:

```powershell
cd apps\web
npm.cmd install
npm.cmd run auth:setup
cd ..\api
npm.cmd install
cd ..\..
```

Start both production builds and reset deterministic acceptance data:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-acceptance.ps1 -ResetData
```

Use `-SkipBuild` after the first successful build. Open `http://localhost:3008/login`. API documentation is at `http://localhost:3001/api/docs`.

The generated acceptance organization includes `admin@apex.local`, `security@apex.local`, `m365admin@apex.local`, `reports@apex.local`, `auditor@apex.local`, and `viewer@apex.local`. They use the shared local password printed by `auth:setup`, but receive different signed roles and effective access.

Stop the environment:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-acceptance.ps1
```

## Seeded dataset

| Admin center | Persistent resources |
| --- | ---: |
| Microsoft Entra ID | 1,400 |
| Exchange Online | 900 |
| Microsoft Teams | 650 |
| SharePoint Online | 650 |
| OneDrive | 750 |
| Microsoft Intune | 900 |
| Defender XDR | 350 |
| Microsoft Purview | 450 |
| Licensing & Cost | 1,100 |
| Hybrid Active Directory | 700 |
| **Total** | **7,850** |

State is stored in `apps/api/data/runtime-state.json`, which is ignored by Git. Restarting the API reloads the same report jobs, workflow executions, events, and audit history. Use the reset endpoint or `-ResetData` for a deterministic first-run state.

## Automated acceptance tests

API state-machine and repository tests:

```powershell
cd apps\api
npm.cmd test
```

HTTP end-to-end test while the API is running:

```powershell
cd apps\api
npm.cmd run test:e2e
```

The HTTP suite validates:

- readiness and deterministic reset;
- the 5,000-user Global Enterprise Holdings ecosystem and exact Microsoft 365 object populations;
- user 360, security incidents, risk findings, license optimization, four compliance frameworks, report templates, grounded AI, scenario activation, and timeline ticks;
- ten admin centers and 7,850 resources;
- invalid report rejection;
- asynchronous report queued/running/completed states;
- custom selected-column projection and 250-row result preview;
- requester/approver separation of duties;
- approved execution and verified rollback;
- an injected failure path with zero committed target changes;
- SSE `resource.updated` delivery;
- audit-chain integrity;
- persisted report and workflow history.

Browser end-to-end test:

```powershell
cd apps\web
$env:AEGIS_SMOKE_PASSWORD = '<password printed by auth:setup>'
npm.cmd run test:smoke
```

The browser suite logs in, visits all 23 modules, switches all ten admin dashboards, generates catalogue and custom reports through the API, validates result rows, downloads and validates PDF/Excel output, submits a governed workflow for independent approval, tests shell controls and administration, and captures screenshots under the ignored `apps/web/artifacts` directory.

Organization role and cross-persona workflow test:

```powershell
cd apps\web
$env:AEGIS_SMOKE_PASSWORD = '<password printed by auth:setup>'
npm.cmd run test:roles
```

## Manual acceptance workflow

1. Open **Reporting** and confirm the header reports the persisted object count rather than `runtime API offline`.
2. Switch through all admin centers and generate a recommended report.
3. Confirm the report shows a runtime job UUID, 250 preview rows, total matching rows, freshness, and metrics.
4. Download PDF and Excel and open both files.
5. Open **Custom reports**, select a source and fields, preview, then run the full report. Confirm the result columns match the selected fields.
6. Open **Security**, choose **Run investigation**, and execute the governed workflow.
7. Confirm the top bar shows new live events and the completion toast includes succeeded count and audit UUID.
8. Query `/api/v1/workflows`, `/api/v1/report-jobs`, and `/api/v1/audit` in Swagger to verify persisted state.
9. Restart the API and confirm those records remain.

## Failure and recovery checks

- A workflow cannot be approved by its requester.
- A workflow cannot execute before approval.
- A workflow whose target contains `failure-test` fails deterministically and records zero successful target changes.
- A completed workflow can be rolled back; other states reject rollback.
- Unknown workloads reject report creation.
- Corrupt local runtime state is replaced by a deterministic seed on the next start; preserve a copy first when investigating corruption.
- PDF/Excel generation remains client-side, but its source rows and execution ID come from the persisted report job.
