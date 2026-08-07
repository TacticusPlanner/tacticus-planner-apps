## Context

See proposal.md - Why. Current state: a single global `redirectUri` =
`/auth/callback`, a React Router route (`AuthCallbackRoute`) mounted inside
the full SPA bundle. `initializeAuthentication()`
(`apps/web/src/fsd/shared/auth/authentication.ts`) calls
`handleRedirectPromise({ navigateToLoginRequestUrl: false })`. Five call sites
route through this `redirectUri`: `loginRedirect`/`acquireTokenRedirect` from
`landing-page.tsx`, `auth-control.tsx`, `desktop-layout.tsx`,
`mobile-header.tsx`, and `requestApiAccess()`; plus `ssoSilent()` (via
`attemptSilentSignIn`, shipped in the `auto-silent-sign-in` change) and
`acquireTokenSilent()` (via `acquireAccessToken()`). The installed
`@azure/msal-browser@5.18.0` ships a `./redirect-bridge` subpath export
(`broadcastResponseToMainFrame`) implementing the documented v5 bridge
contract; nothing in this repo imports it today.

## Goals / Non-Goals

**Goals:**

- Every MSAL interaction type (redirect, silent, iframe fallback) round-trips
  through a single dedicated bridge page matching the documented v5 contract.
- No app code, router, or React runs on the bridge page.
- Existing call sites keep their current API surface (`loginRedirect`,
  `acquireTokenRedirect`, `ssoSilent`, `acquireTokenSilent`) — only
  configuration changes.

**Non-Goals:**

- Registering a custom `INavigationClient` tied to react-router. The bridge's
  redirect-navigation branch performs a hard cross-document navigation back to
  `ORIGIN_URI`, caching the response itself for `handleRedirectPromise` to pick
  up on load — no in-app router-aware navigation is invoked as part of that
  hand-off, so there's nothing for a custom `NavigationClient` to intercept in
  this flow. Deferred as speculative until a concrete need appears.
- Popup-based flows (`loginPopup`/`acquireTokenPopup`/`logoutPopup`) — not
  used anywhere in this codebase; out of scope.
- Forcing a fixed post-sign-in landing route via `redirectStartPage`. See
  Decisions.
- Changing `acquireAccessToken`'s or `attemptSilentSignIn`'s error
  handling/fallback semantics — unchanged, just made reliably reachable.

## Decisions

**Single shared `redirectUri` for every interaction type, not a per-request
override.** MSAL's `SilentRequest` type does support a per-request
`redirectUri` override (confirmed in the installed types), which would allow
keeping `/auth/callback` for interactive redirect and adding a second bridge
only for `ssoSilent`/`acquireTokenSilent`. Rejected in favor of one URI: the
interactive redirect flow gets no functional benefit from keeping its own
custom route (see next decision), and two registered redirect URIs is
strictly more surface area to keep in sync across this app,
`staticwebapp.config.json`, and the Entra App Registration for no behavioral
gain.

**Delete `/auth/callback` and `AuthCallbackRoute`; let the bridge own
post-redirect navigation.** `navigateToLoginRequestUrl: false` was added when
MSAL support was first wired up specifically so the custom route could decide
the destination itself. The v5 bridge's redirect branch performs that
hand-off on its own (cache the response, navigate to `ORIGIN_URI`)
independent of that setting, and always will while the bridge owns
`redirectUri` — so keeping `navigateToLoginRequestUrl: false` no longer
suppresses anything the bridge does. Removing it and the now-redundant route
also eliminates a full SPA boot cycle (and the associated
`useMsal()`/`useIsAuthenticated()` work) that previously ran inside the
hidden iframe for every `ssoSilent()`/`acquireTokenSilent()` call — pure
waste even before COOP made it non-functional.

**No `redirectStartPage` override; accept the bridge's default `ORIGIN_URI`
navigation.** Two sign-in paths exist: (1) the landing page, where
`ORIGIN_URI` will be `/` and the existing `LandingRoute` guard already
redirects an authenticated user from `/` to `/home` — same end state as
today, one extra client-side hop; (2) the three in-app re-authentication
triggers (`auth-control.tsx`, `desktop-layout.tsx`, `mobile-header.tsx`) and
`requestApiAccess()`, where `ORIGIN_URI` is whatever page the user was
already on — returning them there is more correct than today's unconditional
bounce to `/home`. Forcing `/home` everywhere via `redirectStartPage` would
regress case (2) just to remove a redundant hop in case (1); not worth it.

**Bridge page ships as a second Vite build entry, not a `public/` static
file.** `@azure/msal-browser/redirect-bridge` needs bundler resolution (a
package subpath export, not a browser-loadable URL) per MSAL's own Vite
framework guidance. `apps/web/redirect.html` is added alongside `index.html`
as a second `rollupOptions.input` entry so Vite processes its
`<script type="module">` import through the normal build pipeline and emits
a real, addressable asset.

**`staticwebapp.config.json` gets a route-scoped header rule for the bridge
page only, not `globalHeaders`.** The existing config sets no
`globalHeaders` today, so nothing currently conflicts — but the bridge's
requirements (`Cache-Control: no-store`, no COOP, no
`X-FRAME-OPTIONS: DENY`) should be pinned explicitly so a future unrelated
headers change can't silently break it. Scoping the rule to the bridge path
keeps it from constraining headers for the rest of the app.

## Risks / Trade-offs

- **[Risk]** Azure Static Web Apps' `navigationFallback` rewrites unmatched
  routes to `/index.html`; if the bridge path isn't recognized as a real
  emitted asset in the deployed build, requests to it could be rewritten to
  `index.html` instead of served as-is, silently reintroducing the original
  bug → **Mitigation**: verify in a deployed (or SWA-emulated) environment,
  not just local `vite dev`, as part of this change's manual testing — this
  is exactly the kind of gap that stays invisible in dev.
- **[Risk]** The Entra App Registration's redirect URI list must be updated
  in the tenant to include the new bridge path before this ships, or every
  flow (not just silent ones) breaks at the identity provider with a
  redirect URI mismatch error → **Mitigation**: sequence the Entra config
  change with deployment; called out explicitly in tasks.md as a non-code
  deployment step.
- **[Trade-off]** Removing `/auth/callback` means the app no longer shows a
  dedicated "resolving your sign-in" transitional screen (`AuthResolving`)
  during interactive redirect — the bridge navigates the browser directly
  back to `ORIGIN_URI`, so the brief gap before `handleRedirectPromise`
  resolves is unstyled → **Mitigation**: acceptable; that gap is a
  synchronous cache read (the response is already cached by the bridge), not
  a network round trip, so it should be materially shorter than today's
  flow, not longer.

## Migration Plan

1. Add `apps/web/redirect.html` plus a Vite build entry; verify it builds to
   a standalone emitted asset with no app JS bundled in.
2. Point `redirectUri` at the new bridge path; remove
   `navigateToLoginRequestUrl: false`; remove the `/auth/callback` route and
   `AuthCallbackRoute`.
3. Add the bridge-scoped header rule to `staticwebapp.config.json`.
4. Add the new redirect URI to the Entra App Registration (every environment
   this app is registered against).
5. Deploy and manually verify all flow types end-to-end in a real
   (non-`vite dev`) environment: interactive sign-in from the landing page,
   in-app re-authentication, automatic silent restore on a returning
   session, and silent token refresh on an already-authenticated session.
6. No rollback complexity beyond reverting the code change and Entra config
   together — no persisted data migration is involved.
