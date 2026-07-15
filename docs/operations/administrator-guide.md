# Administrator guide

Platform Administrators manage identity federation, tenants, connector permission grants, encryption/key providers, retention, backup, and platform roles. Security Administrators own findings and approved security workflows. Microsoft 365 Administrators execute workload remediations. Auditors receive read-only evidence/audit access. Report Administrators manage semantic reports and schedules. Read Only Users cannot export restricted data unless separately authorized.

Daily checks: readiness and collection lag, queue depth/dead letters, failed rules/workflows, certificate expiry, storage capacity, backup completion, and critical findings. Weekly checks: permission drift, privileged membership, export review, unresolved connector errors, and AI safety events. Quarterly checks: restore exercise, access recertification, key rotation readiness, audit chain validation, adversarial AI evaluation, and Microsoft API permission review.

Tenant onboarding requires a named owner, data classification/retention decision, approved workload scope, least-privilege permission review, certificate or managed identity, initial sync window, baseline period, and acceptance of automation separation-of-duties rules.

Never paste credentials into AI, reports, tickets, or support bundles. Suspend a suspected connector identity, preserve audit/evidence, rotate its certificate, validate scope, and replay from the last trusted cursor.

