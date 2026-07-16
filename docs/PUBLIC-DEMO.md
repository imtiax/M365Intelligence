# Isolated Public Demo

Status: deployment and acceptance contract

Last updated: 2026-07-17

The Aegis public demo is a short-lived, read-only product tour backed only by deterministic synthetic data. It is not a trial tenant, customer control plane, or Microsoft 365 connector. A public-demo deployment must never contain Microsoft Graph credentials, customer identities, customer exports, production signing keys, or access to a customer data plane.

## Enablement

The feature is deny-by-default:

```dotenv
AEGIS_PUBLIC_DEMO_ENABLED=false
```

Set the value to `true` only in a dedicated public-demo deployment. The local acceptance launcher enables it automatically:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-acceptance.ps1 -ResetData
```

Open `http://localhost:3008/landing/demo`. The ordinary customer/workforce login remains available at `/login` and uses a separate session type and audience.

Docker Compose passes the same feature flag to both the web BFF and data API. Copy `.env.example` to `.env` and opt in explicitly only after meeting the isolation requirements below. The repository default remains `false`.

## Personas and modes

The launcher offers four bounded personas:

| Persona ID | Demonstration focus |
|---|---|
| `executive` | Enterprise posture, value, assurance, and adoption |
| `security` | Identity risk, incidents, evidence, and control mapping |
| `operations` | Cross-workload health, governed operations, and hybrid assurance |
| `reporting` | Dashboards, report discovery, design, delivery controls, and FinOps |

Each persona can start in `guided` or `free` mode. Both receive the single `read-only` API role and a `public-demo` session type. Persona labels influence the tour narrative; they do not grant workforce privileges.

Public sessions expire after 30 minutes. Progress is stored in the current browser session, while scenario and reset state are namespaced by a cryptographically random demo-session identifier. Starting another persona creates a new identifier rather than reusing state.

## Public route and BFF contract

The browser-facing contract is:

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/landing/demo` | Public launcher and synthetic-data disclosure |
| `POST` | `/api/auth/demo` | Start a persona with `{ persona, mode }` |
| `GET` | `/api/auth/me` | Return bounded identity, persona, mode, session ID, and expiry |
| `GET` | `/demo/workspace` | Authenticated public-demo workspace |
| `GET` | `/api/public-demo/bootstrap` | Tenant, scenario, module, and disclosure manifest |
| `GET` | `/api/public-demo/module/:moduleId` | One allow-listed synthetic module |
| `POST` | `/api/public-demo/report-preview` | Filtered, bounded synthetic report preview |
| `POST` | `/api/public-demo/scenario` | Select an allow-listed scenario for this session |
| `POST` | `/api/public-demo/reset` | Restore this session to its deterministic baseline |
| `POST` | `/api/auth/logout` | Destroy the browser session |

The reverse proxy sends every `/api/*` request through the web BFF. Only `/health/*` reaches the data API directly. The BFF validates the browser session and signs a short-lived internal identity before forwarding an allow-listed request over the private application network.

Public-demo identities are rejected by ordinary runtime mutations. For example, `POST /api/runtime/api/v1/simulation/reset` returns HTTP `403` with code `public_demo_boundary`; the public reset endpoint can only reset the caller's isolated synthetic namespace.

## Required isolation

An internet-facing demo must use a deployment separate from every customer and workforce environment:

- Separate cluster or host, network, runtime state, session-signing secret, internal BFF secret, logs, backups, and observability labels.
- No `M365_TENANT_ID`, `M365_CLIENT_ID`, certificate, managed identity, OAuth token, mail credential, Teams credential, customer API key, or customer export.
- `M365_GRAPH_ENABLED=false`, no route to Microsoft Graph, and default-deny outbound network policy except approved patching/telemetry destinations.
- Synthetic `.example` identities and seeded evidence only. Do not import production-shaped customer samples for realism.
- No outbound email, Teams, SharePoint, webhook, ticketing, or notification delivery. Delivery controls are preview-only.
- No shared Redis, database, queue, object store, encryption key, or volume with a customer/control-plane deployment.
- Per-session state quotas, request/body limits, rate limits, automatic expiry, and deterministic reset.
- Log session IDs and security events, but do not log session cookies, report contents, form values, or browser-supplied personal data.

Treat a failure of session scoping, mutation denial, or synthetic-data provenance as an immediate public-demo rollback condition.

## Edge protections

The supplied Nginx configuration:

- Routes browser APIs through the BFF and keeps the API upstream private.
- Preserves host, real client, forwarding, scheme, port, and correlation headers.
- Applies a dedicated rate limit to `POST /api/auth/demo` in addition to the general API budget.
- Forces `Cache-Control: private, no-store, max-age=0` and `X-Robots-Tag: noindex, nofollow, noarchive` on the launcher and workspace.
- Retains the global content-type, referrer-policy, and frame-denial headers.

Production ingress or WAF policy must preserve these controls and add TLS, request logging, bot protection, distributed rate limits, and alerting. Do not rely on process-local throttling when more than one web instance is deployed.

## Reset and lifecycle behavior

`POST /api/public-demo/reset` restores only the caller's scenario and synthetic mutations. It must not reset the workforce acceptance dataset or another visitor's demo session. Logout deletes the session cookie. Expired, missing, or invalid demo sessions return to the launcher and public-demo APIs return `401`.

If a demo action needs to illustrate a write, present a preview, approval path, expected verification, and rollback evidence. It must end before the ordinary mutation service. Downloaded artifacts should carry a synthetic-data disclosure and must not include server secrets or cross-session data.

## Verification

With the acceptance runtime running:

```powershell
cd apps\web
npm.cmd run test:public-demo
```

The browser smoke test verifies:

- Launcher disclosure, no-cache/noindex headers, and all four persona starts.
- Public-demo identity claims, expiry, unique session identifiers, and read-only role.
- Broad module discovery and the dedicated bootstrap/module/report-preview APIs.
- HTTP `403 public_demo_boundary` on an ordinary runtime mutation.
- Scenario and reset isolation between two browser sessions.
- Logout invalidation and recovery to a public entry route.

The full release gate includes this test:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\release-candidate.ps1 `
  -DemoPassword '<local acceptance password>'
```

Passing the local test is evidence for the synthetic-demo contract only. It does not authorize an internet deployment until ingress, abuse protection, logging, monitoring, legal notice, vulnerability management, and an independent security review are complete.
