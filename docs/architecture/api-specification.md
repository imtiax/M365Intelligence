# API specification

The API is JSON over HTTPS under `/api/v1`; OpenAPI is served at `/api/docs`. Errors use RFC 9457 Problem Details. Writes accept `Idempotency-Key`; all responses include `x-correlation-id`. Collection and report jobs return `202 Accepted` with an operation resource.

Initial endpoints:

| Method | Route | Policy | Purpose |
|---|---|---|---|
| GET | `/health/live` | Anonymous | Process liveness |
| GET | `/health/ready` | Anonymous/internal | Dependency readiness |
| GET | `/api/v1/dashboard/overview` | Dashboard.Read | Tenant command-center summary |
| GET | `/api/v1/findings` | Finding.Read | Filtered, paged findings |
| GET | `/api/v1/findings/{id}` | Finding.Read | Finding and evidence |
| POST | `/api/v1/findings/{id}/workflow` | Workflow.Create | Draft remediation workflow |
| GET | `/api/v1/tenants` | Tenant.Read | Authorized tenants |
| POST | `/api/v1/tenants` | Tenant.Create | Begin tenant onboarding |
| POST | `/api/v1/ai/query` | AI.Query | Policy-filtered local analysis |

Planned resource families are `/resources`, `/history`, `/signals`, `/controls`, `/reports`, `/exports`, `/workflows`, `/connectors`, and `/audit`. Cursor pagination is mandatory for high-cardinality sets. Filters are allow-listed; arbitrary SQL or provider query fragments are rejected.

Example finding:

```json
{
  "id": "fnd_mfa_coverage",
  "title": "45 users do not have MFA registration",
  "severity": "critical",
  "riskScore": 96,
  "impact": "High identity compromise risk",
  "affectedCount": 45,
  "recommendation": "Require registration and enforce a phishing-resistant authentication policy.",
  "automation": { "available": true, "approvalRequired": true },
  "evidenceAsOf": "2026-07-15T08:00:00Z"
}
```

