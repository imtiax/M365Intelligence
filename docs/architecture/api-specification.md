# API specification

The executable local API uses JSON under `/api/v1`; health probes are under `/health`, and OpenAPI is served at `/api/docs`. The browser calls the API through the authenticated same-origin web proxy. That proxy signs a short-lived tenant, actor, role, timestamp, and nonce envelope; the API rejects unsigned, stale, tampered, and replayed envelopes.

The table below describes the currently implemented local runtime rather than a future contract.

| Method | Route | Authorized local roles | Purpose |
|---|---|---|---|
| GET | `/health/live` | Anonymous | Process liveness |
| GET | `/health/ready` | Anonymous/internal | Runtime readiness |
| GET | `/api/v1/findings` | Authenticated | Tenant-scoped findings |
| GET | `/api/v1/findings/{id}` | Authenticated | Finding and evidence |
| GET | `/api/v1/findings/{id}/case` | Platform, Security, M365 admin, Auditor | Assignment, linked workflow, status, and activity |
| POST | `/api/v1/findings/{id}/assignments` | Platform, Security, M365 admin | Persist owner, team, priority, due date, and note |
| POST | `/api/v1/findings/{id}/remediation` | Platform, Security, M365 admin | Create a linked draft or pending-approval workflow |
| GET/POST | `/api/v1/report-jobs` | Read: authenticated; create: Platform or Report admin | List and run populated local report jobs |
| GET/POST | `/api/v1/workflows` | Read: Platform, Security, M365 admin, Auditor; create: Platform, Security, M365 admin | Governed workflow queue |
| POST | `/api/v1/workflows/{id}/submit` | Platform, Security, M365 admin | Submit a draft for independent review |
| POST | `/api/v1/workflows/{id}/approve` | Platform or Security admin | Record approval and comment; requester cannot self-approve |
| POST | `/api/v1/workflows/{id}/reject` | Platform or Security admin | Record rejection and comment; requester cannot self-reject |
| POST | `/api/v1/workflows/{id}/execute` | Platform or M365 admin | Execute the accepted local simulation and record per-target outcomes |
| POST | `/api/v1/workflows/{id}/rollback` | Platform or M365 admin | Restore the captured local before-state |
| GET | `/api/v1/audit` | Platform, Security admin, Auditor | Tenant audit history and full-chain integrity result |
| GET | `/api/v1/events/stream` | Authenticated | Tenant-filtered server-sent events plus heartbeat |
| POST | `/api/v1/simulation/reset` | Platform admin | Reset the deterministic local dataset |

The dormant-E5 acceptance path uses finding `FND-1029`. Its remediation payload must explicitly review leave, service-account, and legal-hold exceptions. The deterministic executor evaluates all 87 candidate assignments, reclaims 67, excludes 20 with reasons, records audit/activity events, and supports rollback. Those numbers are acceptance-fixture results, not claims about a connected customer tenant.

Common DTO validation rejects malformed values, invalid workflow transitions, past due dates, missing mandatory exception reviews, duplicate active remediation, and role violations. Correlation IDs are propagated into local audit and event records.

## Production contract boundary

Universal RFC 9457 error responses, write idempotency keys, cursor pagination across every high-cardinality collection, transactional PostgreSQL/outbox persistence, connector job resources, and customer Microsoft Graph mutations remain production contract work. They must not be inferred from the working local runtime. Live collectors and remediation also require customer-owned Entra identities, least-privilege consent, certificate or managed-identity authentication, throttling controls, delta cursors, and tenant-specific validation.
