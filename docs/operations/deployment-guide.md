# Deployment guide

## Evaluation deployment

1. Install Docker Engine/Compose and allocate at least 8 GB RAM (more for search/AI).
2. Copy `.env.example` to `.env`; replace every `CHANGE_ME` value. Never commit `.env`.
3. Run `docker compose config` and inspect the resolved configuration.
4. Run `docker compose up --build -d` and open `http://localhost:8080`.
5. Verify `http://localhost:8080/health/ready` and review container logs.

Search and AI are opt-in resource-heavy profiles: `docker compose --profile search --profile ai up --build -d`. Pull the configured Ollama model inside the isolated environment before enabling the AI gateway.

Prometheus process/build metrics are available through the `observability` profile. Forward structured container logs to the customer's approved local log platform and alert on readiness, collection lag, queue depth, workflow failure, certificate expiry, storage, and backup age.

The Compose stack deliberately uses development header identity to make the foundation evaluable. It is not an internet-facing production configuration. Production deployment must set `NODE_ENV=production`, remove `AUTH_MODE=development`, configure OIDC, terminate trusted TLS, issue service certificates, enable OpenSearch security, deploy Vault, and pass the release gates in the roadmap.

## Kubernetes

The `infra/kubernetes/base` Kustomize base deploys stateless web/API workloads with restricted pod security, probes, limits, disruption budgets, ingress, and default-deny networking. Replace image registry/host placeholders, create `api-runtime` and `edge-tls` through approved secret and certificate controllers, and add explicit egress policies for selected data services and Microsoft endpoints. Stateful services are intentionally separate; deploy supported HA operators in protected namespaces as described in the deployment architecture.

## Upgrade

Back up and verify restoration, review release notes/schema migrations, stage in a representative environment, scan/sign images, drain workers, apply migration with a rollback decision point, deploy stateless services, validate tenant isolation/ledger chains/connectors, then resume workers.

## Recovery validation

Restore into an isolated network. Verify database checks, audit chain roots, tenant/resource counts, latest delta cursors, current and six-month historical samples, workflow states, and a sample report. Rotate credentials if compromise triggered recovery.
