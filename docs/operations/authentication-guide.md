# Authentication guide

## Local protected showcase

Run the following from `apps/web`:

```powershell
npm.cmd run auth:setup
npm.cmd run build
npm.cmd run start -- -p 3008
```

The setup utility generates `.env.local` with a unique 384-bit session secret, random password salt, and scrypt password hash. The clear-text generated password is printed once and is not stored. `.env.local` is excluded from Git and Docker build context.

Local controls include generic authentication errors, a fixed delay after rejection, five attempts per client per 15 minutes, constant-time password hash comparison, signed issuer/audience-bound sessions, eight-hour expiry, HttpOnly/SameSite=Strict cookies, origin checks on login/logout, protected routes, no-store authenticated responses, and logout cookie removal.

Localhost uses HTTP and therefore sets `AEGIS_COOKIE_SECURE=false`. Do not expose this configuration to another device or network.

## Credential rotation

Run `npm.cmd run auth:setup` again and restart the web server. This changes both password material and the signing key, immediately invalidating all existing sessions.

## Production identity

The local adapter is not a replacement for enterprise federation. Before production exposure:

1. Configure Entra ID OIDC authorization code flow with PKCE and validated issuer, audience, nonce, and tenant.
2. Require Conditional Access and phishing-resistant MFA for administrators.
3. Use trusted TLS and `AEGIS_COOKIE_SECURE=true`.
4. Move throttling and session/revocation state into protected Redis or the approved identity/session platform.
5. Map immutable Entra object IDs and group/app-role claims to server-side platform policies.
6. Implement sign-out and continuous-access/risk revocation events.
7. Audit authentication success, failure, step-up, logout, lockout, and administrative identity changes without logging credentials or tokens.

