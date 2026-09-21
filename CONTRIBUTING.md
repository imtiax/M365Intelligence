# Contributing to M365Intelligence

Thanks for helping make M365Intelligence more useful and trustworthy. Contributions can include bug fixes, tests, documentation, accessibility work, module designs, deployment improvements, and integrations.

## Before you start

1. Read the [Code of Conduct](CODE_OF_CONDUCT.md), [security policy](SECURITY.md), and [roadmap](docs/roadmap.md).
2. Search existing issues and discussions before opening a new item.
3. Open an issue for a substantial design change before investing in implementation.
4. Never include tenant data, secrets, real identities, customer screenshots, exported reports, or private infrastructure details in an issue or pull request.

## Development workflow

1. Fork the repository and create a focused branch from `main`.
2. Follow the [local evaluation setup](README.md#quick-start-local-evaluation).
3. Keep a change small, documented, accessible, and covered by appropriate tests.
4. Run the relevant checks before opening a pull request:

   ```powershell
   cd apps\api
   npm.cmd run build
   npm.cmd test

   cd ..\web
   npm.cmd run build
   npm.cmd run test:portal
   ```

5. Use clear conventional-style commit subjects, for example `feat(reports): add inactive-device filter` or `docs: clarify Docker secret setup`.
6. Sign off every commit to accept the [Developer Certificate of Origin](DCO.md):

   ```powershell
   git commit -s -m "docs: improve local setup"
   ```

## Pull-request expectations

- Explain the problem, approach, validation, and any security/privacy impact.
- Include before/after screenshots only with the bundled generic sample data.
- Update user documentation, configuration examples, and tests with behavior changes.
- Do not broaden Microsoft Graph permissions or add a write action without a design, least-privilege justification, approval model, audit trail, and negative tests.
- Maintainers may request changes, split a large change, or defer work that does not fit the public roadmap.

## Reporting concerns

Use public issues for normal bugs and feature requests. Report vulnerabilities only through the process in [SECURITY.md](SECURITY.md).
