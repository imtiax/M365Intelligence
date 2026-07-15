# Security policy

Do not open a public issue for a suspected vulnerability. Send a minimal report to the security contact configured by the deploying organization, including affected version, impact, reproduction, and whether exploitation may have occurred. Do not include customer data, tokens, certificates, or secrets.

The current `0.x` foundation is for controlled evaluation and development. It has not completed the production release gates in `docs/roadmap.md`. Production operators own timely patching of host, orchestrator, images, identity provider, certificates, local models, and dependencies.

Secrets detected in source or logs must be treated as compromised: revoke/rotate first, then remove and investigate using immutable audit evidence.

