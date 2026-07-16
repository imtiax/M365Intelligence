# M365 Intelligence

A local-first Microsoft 365 intelligence and security operations platform for reporting, auditing, identity, governance, compliance, licensing, hybrid operations, private AI, and approval-controlled remediation.

The repository includes a production-buildable Next.js application, a NestJS API, Docker deployment assets, security architecture, an extensible tenant/data model, and a persistent 5,000-user Global Enterprise Holdings simulation for client demonstrations.

## What is working

- Secure local authentication with scrypt password hashing, signed HttpOnly sessions, throttling, protected routes, and security headers.
- A deterministic enterprise generator with 5,000 detailed users, 28,900 Microsoft 365 objects, six customer scenarios, user 360, security incidents, identity risk, licensing, compliance, grounded AI, and continuous timeline events.
- Twenty-seven product workspaces and hundreds of interactive controls, including a tenant-scoped Connection Center, Customer Portal, and role-restricted Super Admin commercial workspace.
- Ten workload-specific admin-center dashboards with count drill-downs, an original 947-template presentation registry, server-filtered report jobs, persistent saved views, local-archive schedules, threshold alerts, run history, populated PDF/Excel downloads, a custom report builder, dashboard designer, tenant-scoped finding assignment, approval-controlled remediation, explicit rejection, verified execution results, rollback, real-time events, tamper-evident audit history, administration, global search, and persistent browser drafts.
- Production Next.js build, browser smoke suite, control inventory, Docker topology, NestJS API, PostgreSQL/TimescaleDB, Redis, RabbitMQ, optional OpenSearch, optional Ollama, and observability assets.

The bundled dataset and workflow results are synthetic. Live Microsoft Graph collectors and real Microsoft 365 mutations are an integration boundary, not silently simulated production functionality. See [Connect Microsoft 365](#connect-microsoft-365).

## Product landing page

The public, responsive industry landing page is available at `http://localhost:3008/landing`. It uses screenshots captured from the working platform, presents industry use cases, explains platform differentiation without unsupported competitor claims, and links into the secure sign-in experience. The landing page is intentionally public; application routes and data remain session protected.

The deployment is local-first: application services, databases, reports, indexes, audit history, and optional local AI run within customer-controlled infrastructure. There is no Aegis-operated cloud data store. A live tenant deployment communicates directly with the Microsoft identity platform and Microsoft Graph only when explicitly configured and authorized; optional outbound integrations must also be enabled by the customer.

The commercial architecture separates the hosted signup, trial, subscription, license, and support control plane from the customer-controlled Microsoft 365 data plane. See the [commercial product requirements](docs/COMMERCIAL-PRODUCT-PRD.md), [commercial system design](docs/COMMERCIAL-SYSTEM-DESIGN.md), and the RLS-first Supabase migration under `infra/supabase/migrations`.

For a complete local release-candidate gate and the explicit distinction between demo readiness and public-production readiness, follow the [go-live runbook](docs/GO-LIVE-RUNBOOK.md) and run `scripts/release-candidate.ps1`.

## Isolated public demo

The persona-led synthetic tour is available at `http://localhost:3008/landing/demo` when `AEGIS_PUBLIC_DEMO_ENABLED=true`. It is disabled by default in `.env.example`; `scripts/start-acceptance.ps1` enables it for local acceptance. Four bounded personas can explore a dedicated read-only workspace backed only by `.example` identities and session-isolated synthetic state.

The public demo is not a customer trial and cannot connect Microsoft Graph or invoke ordinary runtime mutations. An internet-facing deployment must be isolated from customer environments and must contain no customer identity, Graph credential, certificate, token, export, queue, database, or shared secret. Architecture, route contracts, reset semantics, ingress safeguards, and deployment gates are documented in [Isolated Public Demo](docs/PUBLIC-DEMO.md).

Run its persona and isolation smoke test after starting the acceptance environment:

```powershell
cd apps\web
npm.cmd run test:public-demo
```

## Quick local setup

### Prerequisites

- Windows 10/11, macOS, or Linux
- Node.js 22 LTS or newer and npm
- Git
- Docker Desktop only if you want the complete infrastructure stack

### Full end-to-end acceptance environment (recommended)

After cloning the repository, install both applications and generate the local login once:

```powershell
cd apps\web
npm.cmd install
npm.cmd run auth:setup
cd ..\api
npm.cmd install
cd ..\..
powershell -ExecutionPolicy Bypass -File .\scripts\start-acceptance.ps1 -ResetData
```

Open `http://localhost:3008/login`. This starts the production web build plus the persistent API runtime on port `3001`, seeds 5,000 detailed users, 28,900 normalized enterprise objects, and 7,850 reporting resources across ten admin centers, and enables scenarios, user 360, security operations, license optimization, compliance, grounded AI, report execution, governed workflows, rollback, audit history, and live events. See the [enterprise demo guide](docs/ENTERPRISE-DEMO.md) and [end-to-end testing guide](docs/END-TO-END-TESTING.md).

The setup command creates six organization personas for platform administration, security, Microsoft 365 operations, reporting, audit, and read-only access. See the [customer acceptance and enhancement register](docs/CUSTOMER-ACCEPTANCE-AND-ENHANCEMENTS.md) for per-module results, implemented controls, and remaining live-tenant gates.

### Frontend showcase on port 3008

```powershell
git clone https://github.com/sherazahmad24/M365Intelligence.git
cd M365Intelligence\apps\web
npm.cmd install
npm.cmd run auth:setup
npm.cmd run dev
```

`auth:setup` creates a git-ignored `.env.local` with a random 384-bit session secret, password salt, and scrypt password hash. Save the generated password when the command prints it.

Open `http://localhost:3008/login` and use:

- Username: `admin@apex.local`
- Password: the value printed by `npm.cmd run auth:setup`

For a production-mode local build:

```powershell
cd apps\web
npm.cmd run build
npm.cmd start
```

Both `dev` and `start` use port `3008`.

### API development

```powershell
cd apps\api
npm.cmd install
npm.cmd run start:dev
```

The API listens on port `3001`. Its development identity adapter is for local evaluation only and must be replaced by validated Entra OIDC claims before an internet-facing deployment.

### Complete Docker stack

```powershell
Copy-Item .env.example .env
# Replace every CHANGE_ME value in .env
docker compose up --build -d
docker compose ps
```

Open `http://localhost:8080`. The reverse proxy exposes the web application and API while the data services remain on internal Docker networks.

Optional profiles:

```powershell
docker compose --profile search up --build -d
docker compose --profile ai up --build -d
docker compose --profile observability up --build -d
```

Stop the stack with `docker compose down`. Add `-v` only when you intentionally want to delete all local volumes and data.

## Connect Microsoft 365

Use a dedicated, single-tenant Entra application for each customer environment. The recommended collector uses application permissions with certificate authentication or managed identity; do not use a production client secret.

1. In Microsoft Entra admin center, create a single-tenant app registration such as `M365 Intelligence Collector`.
2. Record the Directory (tenant) ID and Application (client) ID.
3. Upload the public certificate under **Certificates & secrets > Certificates**. Keep its private key in a certificate store, Key Vault, Vault, or another protected secret provider—never in Git.
4. Add only the Microsoft Graph **application permissions** required by enabled modules. A typical read-only pilot starts with `Organization.Read.All`, `User.Read.All`, `Group.Read.All`, `AuditLog.Read.All`, `Reports.Read.All`, and workload-specific permissions. Do not grant `Directory.Read.All` by default merely for convenience.
5. Have an authorized tenant administrator review and grant admin consent.
6. Configure the reserved `M365_*` values in the root `.env`; mount the certificate/private key from a protected runtime secret rather than adding it to the repository.
7. Validate token acquisition with the `https://graph.microsoft.com/.default` scope, then validate only the endpoints approved for that tenant.
8. Implement/enable collectors with delta queries or change notifications where supported, persist delta links and cursors, honor `Retry-After` on HTTP 429, and keep tenant data partitioned.
9. Run a read-only pilot and permission review before enabling any write/remediation permission. Use a separate application identity and explicit approval policy for writes.

The current branch provides the UI, API boundaries, tenant model, queues, storage, audit design, configuration experience, and deployment foundation. It does **not** yet ship production Graph collector workers or enable the disabled Entra sign-in button. Supplying IDs and a certificate alone will therefore not replace demo data. The implementation and validation checklist is in [Microsoft 365 connection guide](docs/MICROSOFT-365-CONNECTION.md).

Official references:

- [Register an application in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)
- [Microsoft identity platform certificate credentials](https://learn.microsoft.com/en-us/entra/identity-platform/certificate-credentials)
- [Microsoft Graph app-only authentication](https://learn.microsoft.com/en-us/graph/auth-v2-service)
- [Microsoft Graph permissions reference](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Microsoft Graph delta query](https://learn.microsoft.com/en-us/graph/delta-query-overview)
- [Microsoft Graph throttling guidance](https://learn.microsoft.com/en-us/graph/throttling)

## Verification

```powershell
cd apps\web
npm.cmd run build
$env:AEGIS_SMOKE_PASSWORD = '<password generated by auth:setup>'
npm.cmd run test:smoke
npm.cmd run test:public-demo
npm.cmd run audit:controls

cd ..\api
npm.cmd run build
npm.cmd test
```

The browser suite authenticates and opens all 27 workspaces (Command Center plus 26 modules). It verifies the dormant-E5 finding lifecycle, reload persistence, exception validation, governed workflows, five populated PDF exports, report/dashboard persistence, schedule and security settings, shell controls, administration, configuration versioning, and search. The control audit inventories every visible button and input on every routed view.

Reporting verification also switches through all ten admin-center dashboards, opens a metric drill-down, applies a server-side filter, persists a saved view, schedule, and alert, manually executes that scheduled view, verifies operations history, generates catalogue and custom reports, and validates populated PDF and Excel files.

## Repository map

- `apps/web` — Next.js/TypeScript user interface and local authentication
- `apps/api` — NestJS tenant-aware API foundation
- `docs/architecture` — architecture, security, threat model, data model, and APIs
- `docs/operations` — deployment, authentication, and administration
- `infra` — Nginx, PostgreSQL, and observability assets
- `.github/workflows` — build, test, dependency, secret, and container scanning

Useful documents:

- [Client demonstration guide](docs/DEMO-GUIDE.md)
- [360-degree capability matrix](docs/360-SUITE.md)
- [Enterprise sales playbook](docs/SALES-PLAYBOOK.md)
- [Enterprise reporting workspace](docs/ENTERPRISE-REPORTING-WORKSPACE.md)
- [Isolated public demo](docs/PUBLIC-DEMO.md)
- [Security architecture](docs/architecture/security.md)
- [Threat model](docs/architecture/threat-model.md)
- [Roadmap and production gates](docs/roadmap.md)
- [End-to-end acceptance testing](docs/END-TO-END-TESTING.md)
- [Functional acceptance matrix](docs/FUNCTIONAL-ACCEPTANCE-MATRIX.md)

## Security

Never commit `.env`, `.env.local`, passwords, access tokens, private certificates, `.pfx` files, customer exports, or tenant data. Use certificate credentials or managed identities, least-privilege permissions, trusted HTTPS, Secure cookies, tenant isolation, immutable audit evidence, key rotation, restore drills, and independent approval for privileged remediation.

Report security issues according to [SECURITY.md](SECURITY.md).
