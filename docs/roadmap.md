# Development roadmap

## Phase 0 — foundation (this repository)

Architecture decisions, threat model, local stack, tenant-aware API boundaries, command center UX, representative findings, audit primitives, CI security gates, and operating guidance.

## Phase 1 — trusted identity and digital twin

Entra federation, local break-glass lifecycle, tenant onboarding, certificate/managed-identity connector, Graph delta synchronization, PostgreSQL RLS, temporal users/groups/roles/licenses/devices, collection health, and audited data access.

Exit gate: cross-tenant penetration suite passes; Graph permission review is approved; restore drill meets objectives.

## Phase 2 — deterministic intelligence

Versioned rules for MFA, legacy auth, dormant privileged accounts, external sharing, device compliance, role changes, license inactivity, and configuration drift. Add evidence lifecycle, baselines, false-positive feedback, control mappings (CIS/NIST/ISO/SOC 2/GDPR), and case ownership.

## Phase 3 — reporting and workflows

Semantic report builder, schedules, signed exports, ServiceNow adapters, typed playbooks, approvals/separation of duties, dry runs, rollback, notification channels, and full immutable audit validation.

## Phase 4 — private intelligence

Ollama-backed RAG over authorized normalized data, prompt/output defenses, grounded citations, natural-language report compilation, adversarial evaluation, and no-egress verification. AI remains advisory until workflow policy approves a typed action.

## Phase 5 — workload breadth and scale

Defender, Purview, Exchange, Teams, SharePoint, OneDrive, and Intune adapters; OpenSearch projections; Timescale signals; HA Kubernetes reference; performance certification; compliance evidence packs; upgrade and disaster-recovery automation.

Production release requires independent threat modeling and penetration test, accessibility audit, Microsoft API permission/legal review, signed SBOM/provenance, load/chaos testing, recovery exercise, operator training, and documented support/SLA ownership.

