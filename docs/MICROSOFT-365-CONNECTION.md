# Microsoft 365 connection boundary

M365Intelligence starts with no tenant records. Setting `M365_*` configuration values does not create a data connection or generate records.

Before enabling a collector, the deploying organization must:

1. Register a dedicated single-tenant Entra application or use managed identity.
2. Use certificate or workload authentication; never commit a client secret or certificate.
3. Request only the read-only Microsoft Graph permissions required for the selected workload.
4. Obtain documented administrator consent and record the approved data classification, retention, and access model.
5. Validate tenant isolation, throttling, audit logging, error handling, restore behavior, and revocation.
6. Keep write/remediation permissions in a separately governed identity with approval, evidence, and rollback controls.

The production starter intentionally exposes no fake collector state and no bundled records. A workload should remain unavailable until its collector, mapping, persistence, and security tests are implemented and approved.
