# M365 Intelligence

A local-first Microsoft 365 intelligence and security operations platform for reporting, auditing, identity, governance, compliance, licensing, hybrid operations, private AI, and approval-controlled remediation.

The repository includes a production-buildable Next.js client showcase, a NestJS API foundation, Docker deployment assets, security architecture, an extensible tenant/data model, and a synthetic financial-services dataset for client presentations.

## What is working

- Secure local authentication with scrypt password hashing, signed HttpOnly sessions, throttling, protected routes, and security headers.
- Twenty-three product workspaces and hundreds of interactive controls across the complete presentation experience.
- Ten workload-specific admin-center dashboards, a 947-report catalogue, API-backed report jobs with populated rows and KPI summaries, working PDF/Excel downloads, a custom report builder, report scheduling/security, dashboard designer, filtering, drawers, approval-controlled persistent workflows, real-time events, tamper-evident audit history, administration, global search, and persistent browser drafts.
- Production Next.js build, browser smoke suite, control inventory, Docker topology, NestJS API, PostgreSQL/TimescaleDB, Redis, RabbitMQ, optional OpenSearch, optional Ollama, and observability assets.

The bundled dataset and workflow results are synthetic. Live Microsoft Graph collectors and real Microsoft 365 mutations are an integration boundary, not silently simulated production functionality. See [Connect Microsoft 365](#connect-microsoft-365).

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

Open `http://localhost:3008/login`. This starts the production web build plus the persistent API runtime on port `3001`, seeds 7,850 deterministic resources across ten admin centers, and enables report execution, governed workflows, rollback, audit history, and live events. See the [end-to-end testing guide](docs/END-TO-END-TESTING.md) for the automated and manual acceptance checklist.

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
npm.cmd run audit:controls

cd ..\api
npm.cmd run build
npm.cmd test
```

The browser suite authenticates, opens all 23 workspaces, exercises report/dashboard persistence, shell controls, governed workflows, administration, configuration, and search. The control audit inventories every visible button and input on every routed view.

Reporting verification also switches through all ten admin-center dashboards, generates catalogue and custom reports, confirms populated result rows, and validates downloaded PDF and Excel files.

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
- [Security architecture](docs/architecture/security.md)
- [Threat model](docs/architecture/threat-model.md)
- [Roadmap and production gates](docs/roadmap.md)
- [End-to-end acceptance testing](docs/END-TO-END-TESTING.md)

## Security

Never commit `.env`, `.env.local`, passwords, access tokens, private certificates, `.pfx` files, customer exports, or tenant data. Use certificate credentials or managed identities, least-privilege permissions, trusted HTTPS, Secure cookies, tenant isolation, immutable audit evidence, key rotation, restore drills, and independent approval for privileged remediation.

Report security issues according to [SECURITY.md](SECURITY.md).
