# M365Intelligence

M365Intelligence is a customer-controlled Microsoft 365 operations workspace for reporting, security operations, administrator audit, governance workflows, and export-ready evidence.

## Clean deployment by default

This repository contains **no customer data, credentials, tokens, certificates, tenant exports, or bundled demonstration records**. A fresh deployment starts empty. Report definitions and workspace capabilities are available immediately; records appear only after an organization implements and authorizes an approved collector.

The public-demo API and its synthetic data have been removed from the production build. Do not use this repository as an internet-facing service until its identity, integration, operational, and release gates have been completed for your environment.

## Fast local or Docker setup

### Prerequisites

- Node.js 22 LTS or newer
- npm and Git
- Docker Desktop for the container deployment

Clone the repository, install the web dependencies, and create the first local platform administrator. This command generates all local secrets, creates `.env` for Docker, creates `apps/web/.env.local` for local runs, and displays the username and password clearly in the terminal.

```powershell
git clone https://github.com/imtiax/M365Intelligence.git
cd M365Intelligence\apps\web
npm.cmd ci
npm.cmd run auth:setup -- --compose --username=admin@your-organization.example
```

The terminal displays a block like this:

```text
M365Intelligence local administrator created
Username: admin@your-organization.example
Password: <generated once>
Credentials file: <repository>\.runtime\initial-admin-credentials.txt
```

Save the password in an approved password manager. The credentials file is local, permission-restricted where supported, and git-ignored; delete it after saving the password. The password cannot be recovered from the application. To intentionally rotate the local administrator and all generated Compose secrets, re-run the command with `--force`.

Start the clean container stack:

```powershell
cd ..\..
docker compose up --build -d
docker compose ps
```

Open [http://localhost:8080/login](http://localhost:8080/login) and use the generated username and password. For local HTTP only, bootstrap sets `AEGIS_COOKIE_SECURE=false`. Before exposing any deployment, terminate trusted TLS and set `AEGIS_COOKIE_SECURE=true`.

## Local non-Docker run

```powershell
cd apps\web
npm.cmd ci
npm.cmd run auth:setup -- --username=admin@your-organization.example
npm.cmd run build
npm.cmd start
```

Open [http://localhost:3008/login](http://localhost:3008/login). The web-only mode is suitable for interface evaluation; API-backed operations require the API service and approved connection configuration.

## Credentials and account lifecycle

- Bootstrap creates **one** local `platform-admin` identity; it does not create sample people or shared passwords.
- Use `--username=admin@your-organization.example` to choose the initial administrator.
- Use `--password=<approved-temporary-password>` only when an operator must control the initial secret; otherwise a high-entropy password is generated.
- Bootstrap refuses to overwrite existing credentials. Use `--force` only for a deliberate credential rotation and restart the services afterwards.
- For enterprise production, replace the local adapter with validated Entra ID OIDC claims, MFA/Conditional Access, server-side role mapping, centralized throttling/session controls, and audited identity lifecycle management.

## Microsoft 365 connection boundary

The application intentionally does not invent live tenant data. Microsoft Graph collection and tenant write/remediation actions must be implemented and released for each enabled workload under least privilege, change approval, audit, and tenant-isolation controls.

Start with a single-tenant Entra application or managed identity, certificate/workload authentication, approved read-only Graph permissions, and a documented data-retention model. Keep collection disabled until the organization completes the connection and security validation in [docs/MICROSOFT-365-CONNECTION.md](docs/MICROSOFT-365-CONNECTION.md).

## Verification

```powershell
cd apps\api
npm.cmd ci
npm.cmd run build
npm.cmd test

cd ..\web
npm.cmd run build
```

## Security and contribution

Read [SECURITY.md](SECURITY.md), [CONTRIBUTING.md](CONTRIBUTING.md), [SUPPORT.md](SUPPORT.md), and the [open-source release checklist](docs/OPEN-SOURCE-RELEASE.md). Never commit `.env`, `.env.local`, certificates, tokens, tenant data, exports, runtime data, or screenshots containing customer information.

## License

Copyright 2026 M365Intelligence contributors. Licensed under the [Apache License 2.0](LICENSE).
