# Security policy

Do not create a public issue for a suspected vulnerability and do not include tenant data, tokens, certificates, passwords, private keys, exports, or audit logs in a report.

Use [GitHub private vulnerability reporting](https://github.com/imtiax/M365Intelligence/security/advisories/new) for the repository. Include the affected version or commit, impact, a minimal reproduction, and any mitigations you have already applied. If the GitHub advisory form is unavailable, open a minimal issue asking a maintainer for a private contact method; do not disclose technical details in that issue.

## Scope

Reports are welcome for the source code, first-party Docker deployment materials, authentication and authorization handling, secret exposure, data-isolation failures, and the published GitHub Actions workflows.

The project is an early open-source foundation. It is not a managed security service and it has not completed the production release gates in [docs/roadmap.md](docs/roadmap.md). Operators remain responsible for patching hosts, container images, identity providers, certificates, dependencies, and enabled integrations.

## Handling secrets

Treat any credential exposed in source, logs, an issue, or a build artifact as compromised: revoke or rotate it first, remove it from the affected system, then investigate with the available audit evidence. Removing a secret from Git alone does not make it safe.

## Safe disclosure

Please allow maintainers reasonable time to investigate and coordinate a fix before public disclosure. Maintainers will acknowledge receipt through the private advisory thread and will document fixes in release notes when appropriate.
