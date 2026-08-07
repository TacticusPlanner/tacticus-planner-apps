## Why

`@azure/msal-browser` is pinned to `5.18.0`. Starting in v5, Entra ID's default
Cross-Origin-Opener-Policy headers break the legacy trick of reading a
popup/hidden-iframe's auth response directly off `window.opener`/`window.parent`,
so MSAL v5 requires a dedicated static "redirect bridge" page at `redirectUri`
that explicitly re-broadcasts the response back to the main window. This app has
no such page — `redirectUri` points at `/auth/callback`, a full React Router
route that boots the entire SPA. Per MSAL's own migration guidance, without a
correctly configured bridge, `ssoSilent()` and `acquireTokenSilent()`'s
hidden-iframe fallback fail outright. Both are in active use here — `ssoSilent()`
is the mechanism behind the automatic silent sign-in shipped earlier today, and
`acquireTokenSilent()` backs every authenticated API call's token refresh — so
this is very likely broken in real browsers right now, just invisibly, since
both call sites already treat failure as an expected, silent outcome.

## What Changes

- Add a dedicated static bridge page (`apps/web/redirect.html`, a second Vite
  build entry) containing nothing but the documented
  `@azure/msal-browser/redirect-bridge` import and a call to
  `broadcastResponseToMainFrame()` — no React, no router, no app code.
- Point the single global MSAL `redirectUri` at this bridge page for every
  interaction type (`loginRedirect`, `acquireTokenRedirect`, `ssoSilent`,
  `acquireTokenSilent`), replacing `/auth/callback`.
- **BREAKING**: remove the `/auth/callback` route and the `AuthCallbackRoute`
  component (`apps/web/src/fsd/app/routes.tsx`) — the bridge now owns
  post-redirect navigation instead of a custom in-app route. Acceptable per
  this project's greenfield/pre-production status.
- Remove the `navigateToLoginRequestUrl: false` override in
  `initializeAuthentication()` (`apps/web/src/fsd/shared/auth/authentication.ts`)
  so MSAL's documented bridge-driven "return to where the flow was initiated"
  navigation behaves as designed, instead of being suppressed in favor of the
  now-removed custom route. No `redirectStartPage` override is added to force a
  fixed landing route — the existing `LandingRoute` already redirects an
  authenticated user away from `/` to `/home`, which reaches the same end state
  for the landing-page sign-in trigger without inventing app-specific navigation
  logic beyond what MSAL's default already provides.
- Add explicit response headers for the bridge page in
  `apps/web/public/staticwebapp.config.json`: `Cache-Control: no-store`, and
  confirmation that no `Cross-Origin-Opener-Policy` or
  `X-FRAME-OPTIONS: DENY` header applies to it (both would silently break the
  bridge's iframe/popup channel).
- Update the Entra App Registration's redirect URI configuration to the new
  bridge path (deployment/tenant configuration, not application code).

## Capabilities

### New Capabilities

- `redirect-authentication`: the dedicated MSAL redirect bridge page, which
  interaction flow types use it, and the resulting post-redirect navigation
  behavior.

### Modified Capabilities

(none — `silent-sign-in`'s existing requirements describe observable behavior
only, e.g. "a successful silent restore signs the user in with no further
action." That contract is unchanged; this change makes it actually achievable
rather than altering what it promises.)

## Impact

- `apps/web/redirect.html` — new static bridge page.
- `apps/web/vite.config.ts` — new Rollup build input so `redirect.html` is
  emitted as a real, unrouted asset in production builds.
- `apps/web/src/fsd/shared/auth/authentication.ts` — `redirectUri` target,
  removal of `navigateToLoginRequestUrl: false`.
- `apps/web/src/fsd/app/routes.tsx` — removal of the `/auth/callback` route and
  `AuthCallbackRoute`.
- `apps/web/public/staticwebapp.config.json` — headers scoped to the bridge
  route.
- Entra App Registration redirect URI list (external configuration).
- No backend/API changes, no new npm dependencies (the bridge ships as part of
  the already-installed `@azure/msal-browser`).
