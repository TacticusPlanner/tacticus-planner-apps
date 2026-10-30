# Proposal

## Why

A sign-in redirect that comes back from the identity provider with an error is swallowed today:
`completeRedirect()` logs it and the app starts signed out with no message. When the error comes
from a stale identity-provider session, every later sign-in fails the same way. This happened in
production on 2026-10-30: after the account was purged on desktop and a sign-in was cancelled on a
phone, each tap returned instantly from the dead `tacticusplannerext.ciamlogin.com` session and
bounced to `/?next=/home`. The only way out was clearing that domain's cookies. The current spec
promises that "signing in again starts a fresh interactive sign-in", and this breaks that promise.

There is also no way to go straight to account creation. "Sign in" and "Get started" both open the
combined sign-in page, and new visitors have to find the sign-up link there.

## What Changes

- **A failed sign-in redirect is visible:** when the identity provider returns an error, show the
  existing authentication error toast, unless the user deliberately cancelled.
- **A failed sign-in redirect recovers on its own:** clear the cached accounts and the account hint,
  and make the next interactive sign-in or re-authentication ask the identity provider for a fresh
  login (`prompt=login`) instead of letting it answer from a stale session. A successful sign-in
  clears that state again.
- **New "Sign up" entry point** in the public top bar (desktop and mobile, next to Sign in) and as an
  additional hero action next to "Get started, it's free". It opens the identity provider's
  create-account page directly (`prompt=create`), and email and Google are both offered there. The
  hero's "Get started" and the top bar's "Sign in" keep their current combined behaviour.
- Sign-up started from a bare `/` ends on Home, and from `/?next=…` it ends on that destination, as
  sign-in does today.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `redirect-authentication`: an abandoned or failed interactive sign-in shows the error (except a
  deliberate cancel) and leaves the device signed out, and the next interactive sign-in always shows
  a fresh identity-provider login instead of reusing a stale session. Adds sign-up as an interactive
  flow with the same return-destination rules.
- `landing-page`: the public top bar gains a Sign up action next to Sign in on desktop and mobile,
  and the hero gains a Sign up action next to "Get started, it's free", both starting the
  create-account flow.

## Impact

- **Code (`apps/web`):**
  - `src/fsd/shared/auth/authentication.ts`: `completeRedirect`, `loginRequest`, `startInteraction`,
    and a new sign-up request.
  - `src/fsd/shared/auth/use-sign-in-redirect.ts`: plus a sign-up counterpart.
  - `src/fsd/app/layout/public-layout.tsx` and `src/fsd/pages/landing/ui/landing-page.tsx`.
  - Every other interactive sign-in entry point (`mobile-header.tsx`, `auth-control.tsx`,
    `unit-header.tsx`, `collection-page.tsx`) gains the fresh-login behaviour through the shared
    request, with no per-caller changes.
- **i18n:** a new `auth.signUp` string in `en`, `de`, `es` and `fr` `common.json`.
- **Identity provider:** none. `prompt=create` and `prompt=login` are standard Entra External ID
  parameters, and the existing `Default_Login_Flow` already allows sign-up.
- **API:** none. This is a frontend-only change with no companion `tacticus-planner-api` change.
