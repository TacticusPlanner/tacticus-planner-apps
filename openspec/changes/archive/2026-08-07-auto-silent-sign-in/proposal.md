## Why

A user who was previously signed in on a device, but whose access token has
expired from inactivity (e.g. after ~a day), lands on the unauthenticated
landing page and must click "Sign in" before anything happens — even though
the identity provider (Entra) still has a live session for them and resolves
the resulting redirect instantly, with no credential or account-selection
prompt. That click is pure friction: the app already has enough information
(a cached MSAL account in local storage) to attempt a silent restore itself,
without waiting for the user to ask.

## What Changes

- Add a one-time-per-app-load silent sign-in attempt: when a cached MSAL
  account exists (`instance.getAllAccounts().length > 0`), call
  `instance.ssoSilent(loginRequest)` from `AuthProvider` before/while the
  unauthenticated UI is shown.
- On success, activate the returned account and let the existing
  `isAuthenticated`-driven route redirect (already in place today) take the
  user to `/home` — no new redirect logic.
- On failure (`InteractionRequiredAuthError`, or the silent-iframe
  `timedOut` case that `authentication.ts`'s `isInteractionRequired()`
  already treats as equivalent), fail silently and fall back to today's
  landing page / manual "Sign in" flow. No error is surfaced to the user for
  this background attempt.
- Expose the attempt's status (no cached account / checking / failed) from
  `AuthProvider` so it is computed exactly once per app load rather than
  once per button.
- Update all four existing sign-in triggers to read that shared status and
  show an "Account detected — signing you in…" label while the attempt is
  in flight: `pages/landing/ui/landing-page.tsx`, `app/providers/auth-control.tsx`,
  `app/layout/desktop-layout.tsx`, `app/layout/mobile-header.tsx`. Clicking
  any of them while checking is not blocked — it falls through to today's
  `loginRedirect` immediately.

## Capabilities

### New Capabilities

- `silent-sign-in`: automatic, non-blocking silent session restore attempt on
  app load for devices with a previously cached account, plus the shared
  in-flight status surfaced to every sign-in trigger in the app.

### Modified Capabilities

(none — no existing capability spec covers authentication/sign-in today)

## Impact

- `apps/web/src/fsd/app/providers/auth-provider.tsx` — gains the silent
  sign-in attempt and a context exposing its status.
- `apps/web/src/fsd/shared/auth/authentication.ts` — no functional change
  expected; `isInteractionRequired()`'s existing timeout-handling logic is
  reused, not duplicated.
- `apps/web/src/fsd/pages/landing/ui/landing-page.tsx`,
  `apps/web/src/fsd/app/providers/auth-control.tsx`,
  `apps/web/src/fsd/app/layout/desktop-layout.tsx`,
  `apps/web/src/fsd/app/layout/mobile-header.tsx` — read the shared status
  to swap their sign-in button's label while checking.
- New i18n string(s) for the "checking" label, added through the existing
  react-i18next locale resources.
- No backend/API changes. No new dependencies (uses `ssoSilent`, already
  part of `@azure/msal-browser`).
