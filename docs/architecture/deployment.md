# Deployment architecture

## Docker Compose

Compose is intended for evaluation and small single-node installations. Nginx exposes one origin; API, databases, queue, cache, search, and Ollama remain on private networks. Persistent volumes must reside on encrypted storage and be included in backup policy.

## Kubernetes production topology

Use separate namespaces for edge, application, data, AI, and observability. Deploy the web/API statelessly across zones; collectors and processors use queue-based horizontal scaling. PostgreSQL, OpenSearch, RabbitMQ, Redis, Vault, and object backup storage should use supported HA operators or managed on-prem equivalents. Apply default-deny network policies, Pod Security restricted profile, read-only root filesystems, non-root users, resource quotas, disruption budgets, anti-affinity, and signed-image admission.

Ingress permits TLS 1.3 and federated identity. East-west traffic uses a service mesh or issued workload certificates. The AI namespace has no internet egress. Connector egress is allow-listed to the exact Microsoft endpoints required by enabled workloads.

## Backup and recovery

- PostgreSQL: daily full plus continuous WAL archive; quarterly point-in-time recovery test.
- OpenSearch: signed snapshots, but it remains rebuildable from PostgreSQL/events.
- RabbitMQ definitions/configuration and durable workflow state are backed up; transient messages are not the sole system of record.
- Vault/key material: protected quorum snapshots stored separately; recovery requires split custody.
- Configuration: GitOps repository plus sealed/encrypted secrets.

Default objectives are RPO 15 minutes and RTO 4 hours. Restore validation checks ledger chains, tenant counts, connector cursors, and sample historical queries before traffic is enabled.

