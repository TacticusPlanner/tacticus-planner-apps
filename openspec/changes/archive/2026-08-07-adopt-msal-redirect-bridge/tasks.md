## 1. Redirect bridge page

- [x] 1.1 Create `apps/web/redirect.html`: a minimal HTML document (static
      `<title>`, e.g. "Signing in") whose only script is
      `import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge"; broadcastResponseToMainFrame();`
      — no React, no router, no other app code.
- [x] 1.2 Update `apps/web/vite.config.ts` to add `redirect.html` as a second
      `rollupOptions.input` entry alongside `index.html`, so it's emitted as
      a standalone asset in production builds.
- [x] 1.3 Verify with `pnpm build` that `dist/redirect.html` is emitted and
      contains no bundled app JS beyond the bridge import.

## 2. Wire MSAL configuration to the bridge

- [x] 2.1 In `apps/web/src/fsd/shared/auth/authentication.ts`, change
      `redirectUri` from `/auth/callback` to the new bridge path
      (`/redirect.html`).
- [x] 2.2 Remove the `navigateToLoginRequestUrl: false` option from the
      `handleRedirectPromise()` call in `initializeAuthentication()`.
- [x] 2.3 Update the code comment on `redirectUri` (and the one in
      `routes.tsx` referencing `/auth/callback`, removed in task 3.1) to
      describe the new bridge-owned flow.

## 3. Remove the now-redundant SPA callback route

- [x] 3.1 In `apps/web/src/fsd/app/routes.tsx`, remove the `/auth/callback`
      route entry and the `AuthCallbackRoute` component.
- [x] 3.2 Remove the `AuthResolving` component/import if it has no other
      caller after 3.1. (Kept — still used by `ProtectedRoute` and
      `LandingRoute`.)
- [x] 3.3 Search the codebase for any remaining reference to `/auth/callback`
      or `auth/callback` (docs, comments, env samples) and update or remove
      it. (Updated `README.md`'s Entra redirect URI examples to
      `/redirect.html`.)

## 4. Static Web Apps routing and headers

- [x] 4.1 Add a route-scoped rule in `apps/web/public/staticwebapp.config.json`
      for the bridge path setting `Cache-Control: no-store`, and confirm no
      `Cross-Origin-Opener-Policy` or `X-FRAME-OPTIONS: DENY` header applies
      to it. (Also added `.html` to `navigationFallback.exclude` so the
      bridge path is never rewritten to `index.html`.)
- [ ] 4.2 Confirm (locally via `swa-cli` or in a deployed preview
      environment — not `vite dev`) that a request to the bridge path serves
      the built `redirect.html` directly rather than being rewritten to
      `index.html` by `navigationFallback`.

## 5. Tenant configuration

- [ ] 5.1 Add the new bridge redirect URI to the Entra App Registration for
      every environment this app authenticates against (local/dev/staging/
      production, as applicable), alongside the existing entry until this
      change is fully deployed, then remove the old `/auth/callback` entry
      once confirmed unused. (Local registration fixed and confirmed live —
      see 6.1. Staging and production App Registrations are still
      unverified — reopened per review feedback; do not remove the old
      `/auth/callback` entry from any environment until its `/redirect.html`
      entry is confirmed there too.)

## 6. Verification

- [x] 6.1 Manually verify interactive sign-in from the unauthenticated
      landing page: completing sign-in lands the user on the authenticated
      home experience. (Verified live end-to-end after 5.1 was fixed: with
      local storage cleared, clicking "Sign in / Get started" on `/` sent
      the browser to Entra's `/authorize` endpoint with
      `redirect_uri=http://localhost:5173/redirect.html`, Entra accepted it
      with no redirect URI mismatch, and the browser landed authenticated on
      `/home` with no console errors — the bridge processed the response and
      handed off navigation correctly.)
- [ ] 6.2 Manually verify in-app re-authentication (trigger from
      `auth-control.tsx`, `desktop-layout.tsx`, `mobile-header.tsx`, or the
      `requestApiAccess()` path): completing it returns the user to the same
      page they were on. (Not directly reproduced — no interaction-required
      condition was naturally reachable against the freshly-authenticated
      session without forcing invalid state into the real auth cache. Lower
      risk than before 6.1: the bridge's post-redirect navigation is driven
      generically by the cached `ORIGIN_URI`, which 6.1 already confirmed
      works correctly, not by which page/component triggered `loginRedirect`
      — so this exercises the same mechanism from a different starting page,
      not new code.)
- [ ] 6.3 Manually verify automatic silent sign-in (`ssoSilent`, the
      `auto-silent-sign-in` feature) succeeds on a returning session with a
      live identity-provider session, in a real browser (not just
      `vite dev`) where Entra's default COOP headers apply. (Inconclusive:
      reloading `/` with a cached account landed authenticated with no
      console errors and normal API calls, but the account's tokens were
      already valid, so `ssoSilent()` may have resolved from cache without
      needing the bridge's hidden-iframe round trip — the outer tab's network
      listener also may not surface cross-origin iframe traffic either way.
      Needs a session whose cached tokens have actually gone stale to force
      the iframe path.)
- [ ] 6.4 Manually verify silent token refresh (`acquireTokenSilent`'s hidden
      iframe fallback) succeeds for an already-authenticated session whose
      access token has expired but whose identity-provider session is still
      live. (Same blocker as 6.3 — this session's access token was still
      valid, so the iframe fallback specifically was never exercised.)
- [x] 6.5 Update or add tests covering the removed `/auth/callback` route
      (any existing routing tests referencing it) and the updated
      `redirectUri`/`navigateToLoginRequestUrl` configuration in
      `authentication.ts`. (No route-level test referenced
      `AuthCallbackRoute`/`/auth/callback`; updated
      `authentication.test.ts`'s `handleRedirectPromise` assertion for the
      removed option.)
- [x] 6.6 Run the repository-wide gates: `pnpm test:run`, `pnpm typecheck`,
      `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`. (All green: 680
      tests, typecheck, lint incl. `knip` unused-export check, FSD boundary
      lint, and `git diff --check` all pass.)
