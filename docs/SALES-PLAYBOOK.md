# Enterprise sales playbook

## Positioning

Aegis is not positioned as “another Microsoft 365 report pack.” It is a sovereign operations and intelligence plane that connects evidence to decisions and governed action.

Use this one-sentence position:

> Aegis gives regulated organizations a local, historical Microsoft 365 digital twin that detects material risk and waste, proves why it matters, and moves approved remediation through an auditable workflow.

Do not claim the product has completed live integration, production certification, penetration testing, or customer validation until the corresponding evidence exists. In the current showcase, synthetic data is clearly labeled.

## Ideal client profile

- Regulated financial services, government, healthcare, critical infrastructure, and large professional services organizations.
- Multiple Microsoft 365 tenants, regional operations, delegated administration, or hybrid Active Directory.
- Security, compliance, FinOps, and operations teams switching between multiple Microsoft portals and spreadsheets.
- Requirements for local processing, long retention, private AI, strict data residency, or immutable evidence.
- More than 5,000 users, meaningful E5/Power BI/Visio/Project spend, or a dedicated Microsoft 365 operations team.

## Discovery questions

Ask before demonstrating features:

1. How many tenants, identities, privileged accounts, devices, and managed collaboration resources are in scope?
2. Which decisions currently require data from multiple Microsoft portals?
3. How long does an audit evidence request take, and how far back can the team reconstruct tenant state?
4. How are license reclamation decisions validated against leave, service accounts, holds, and actual workload activity?
5. What happens after a security or governance gap is found—ticket, spreadsheet, script, or controlled workflow?
6. Who may view reports, export data, approve actions, and operate on regional resources?
7. Can Microsoft 365 data or prompts leave the customer environment?
8. Which existing reporting, SIEM, ITSM, governance, and automation tools overlap?
9. What measurable result would make a 60-day pilot successful?

Use their answers to configure the Value Center. Never present illustrative ROI as a guaranteed result.

## Proof-led demonstration

For every claim, show product evidence:

| Client concern | Product proof |
|---|---|
| “We already have reports.” | Build a new custom report using semantic sources, fields, filters, formula, preview, schedule, and access policy. |
| “Microsoft already has dashboards.” | Reconstruct tenant state six months ago and traverse local cross-workload relationships. |
| “AI cannot see our data.” | Show local inference configuration, denied egress, RBAC retrieval, filtering, masking, and grounded sources. |
| “Automation is too risky.” | Show preflight, dry run, approval, before-state, idempotency, rollback, verification, and audit stages. |
| “Auditors need evidence.” | Open a unified audit event, correlation context, evidence hash, retention, and report security policy. |
| “Regional teams need access.” | Show delegated roles, resource scope, action/report permissions, access review, and separation of duties. |
| “We need production controls.” | Open Enterprise Configuration and move through identity, collectors, data, AI, integrations, backup, and security. |

## Differentiation without unsupported competitor claims

Do not say another product “cannot” do something unless current verified evidence supports it. Say:

- “Our architectural differentiator is local temporal reconstruction, not only current-state reporting.”
- “Our finding model includes business impact, immutable evidence, confidence, control mappings, owner, and governed remediation.”
- “Our custom analytics apply tenant and role policy before field selection and export.”
- “Our AI boundary is designed for no-egress local inference.”
- “Our management model treats every high-impact action as a controlled change.”
- “We unify security, compliance, FinOps, governance, audit, reporting, hybrid identity, and workflows around one digital twin.”

Then demonstrate the proof. Let the client compare it with their incumbent.

## Objection handling

### “We can build this in Power BI and scripts.”

Power BI and scripts can solve individual views and tasks. Ask who owns schema evolution, tenant isolation, API throttling, temporal state, permission changes, approval, rollback, immutable audit, disaster recovery, and security updates. Position Aegis as the governed operating product around those capabilities.

### “Microsoft already provides these portals.”

Agree. Aegis does not replace Microsoft control planes. It creates a local cross-workload decision and evidence layer, reducing portal switching and preserving historical context while using supported Microsoft APIs for approved actions.

### “We cannot trust AI with enterprise data.”

Agree with the risk. Demonstrate the isolated local endpoint, no-egress control, authorization-filtered retrieval, input/output filtering, masking, grounding, audit, and the rule that AI cannot directly execute an unapproved mutation.

### “Your demo data is not our environment.”

Agree. The showcase proves workflow and UX, not customer results. Offer a scoped pilot using certificate/managed-identity collection with read-only permissions first. Define data, tenant, retention, and success criteria before consent.

### “How do we avoid vendor lock-in?”

Show PostgreSQL normalized storage, standard exports/APIs, container/Kubernetes deployment, local models, documented schemas, and customer-controlled keys. Contractual portability must also be documented.

## Pilot structure

### Weeks 1–2: trust and collection

- Deploy in the customer environment.
- Configure Entra federation and least-privilege read-only collection.
- Validate network paths, certificates, key custody, tenant isolation, and retention.
- Reconcile object counts and source freshness against Microsoft portals.

### Weeks 3–4: decisions

- Implement five agreed findings and three compliance controls.
- Reproduce two existing operational reports in the custom builder.
- Validate one license opportunity using customer contract and exception data.
- Demonstrate a historical configuration change.

### Weeks 5–6: governed action

- Integrate one ITSM destination.
- Run one workflow in dry-run mode and one low-risk approved action.
- Generate an executive report and auditor evidence pack.
- Complete performance, security, backup, and restore checks.

## Pilot success criteria

- Object-count reconciliation within the agreed tolerance.
- Collection SLA achieved for enabled workloads.
- Zero cross-tenant or unauthorized-field disclosure in negative tests.
- Agreed reports reproduced and scheduled without raw SQL.
- Findings accepted as explainable and evidence-backed by named owners.
- Measured analyst time reduction on selected use cases.
- License opportunity validated by Finance, not merely calculated.
- Workflow dry run produces correct before/after and rollback plans.
- Recovery exercise meets agreed RPO/RTO.
- Security and architecture reviewers approve the production remediation plan.

## Close

Do not close with feature count. Close with the client’s desired operating outcome:

> You will have one customer-controlled place to understand Microsoft 365 posture, prove historical and regulatory evidence, identify preventable cost, and move authorized remediation through a safe accountable process.
