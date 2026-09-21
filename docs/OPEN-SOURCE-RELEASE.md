# Open-source release checklist

Use this checklist for every public release and for every fork that will be shared externally.

## Data and privacy

- [ ] Confirm the repository contains only generic synthetic sample data using reserved identities such as `*.invalid`.
- [ ] Verify no customer tenant IDs, UPNs, device names, IP addresses, audit records, exports, screenshots, recordings, or incident details are staged.
- [ ] Verify `.env`, `.env.local`, certificates, keys, browser artifacts, runtime state, logs, and database volumes are ignored and unstaged.
- [ ] Review documentation, examples, test fixtures, and screenshots for tenant-specific references.

## Supply chain and security

- [ ] Run dependency, secret, static-analysis, and container scans.
- [ ] Verify the build and tests from a clean clone.
- [ ] Review direct dependencies and license obligations.
- [ ] Tag the release, publish a release note, and disclose known limitations.

## Repository settings to configure in GitHub

- [ ] Make the repository public only after this checklist passes.
- [ ] Enable Issues, Discussions, private vulnerability reporting, Dependabot alerts, Dependabot security updates, and code scanning.
- [ ] Protect `main`: require pull requests, passing checks, resolved conversations, and linear history where the maintainer workflow supports it.
- [ ] Restrict force pushes and deletion on `main`.
- [ ] Require signed commits if the organization policy supports it.
- [ ] Add `CODEOWNERS` after maintainers and code areas are agreed.

## Operational boundary

This repository provides a local deployment foundation and a synthetic evaluation workspace. It does not include a hosted service, a Microsoft tenant, live collector credentials, or authorization to act in a tenant. Every production operator must independently assess their Microsoft 365 permissions, data handling, compliance obligations, identity configuration, backups, monitoring, and incident response.
