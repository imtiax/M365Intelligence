# Open-source release checklist

Use this checklist before every public release.

- [ ] Confirm no customer tenant data, credentials, certificates, tokens, exports, recordings, or screenshots are staged.
- [ ] Confirm `.env`, `.env.local`, `.runtime`, data volumes, logs, and browser artifacts are ignored.
- [ ] Verify a fresh checkout can create its first administrator with `npm run auth:setup -- --compose`.
- [ ] Verify the API and web builds, dependency scan, secret scan, static analysis, and container scan.
- [ ] Publish known limitations honestly; do not represent an unimplemented collector or remediation adapter as live functionality.
- [ ] Enable GitHub branch protection, code scanning, Dependabot, private vulnerability reporting, and protected release tags.

The repository is a customer-controlled deployment foundation. Each operator is responsible for identity, permissions, Microsoft 365 integration, data retention, patching, backup/restore, monitoring, and incident response in their environment.
