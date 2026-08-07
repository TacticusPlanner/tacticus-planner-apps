## Context

See proposal.md - Why/What Changes for motivation and scope.

Today, `AuthProvider` (`apps/web/src/fsd/app/providers/auth-provider.tsx`) is
a thin wrapper: it takes a single `IPublicClientApplication` instance
(created once in `main.tsx` via `initializeAuthentication()`) and renders
`<MsalProvider instance={instance}>`. `authentication.ts` already centralizes
all MSAL-specific calls (`acquireAccessToken`, `requestApiAccess`,
`isInteractionRequired`) and already treats a silent-iframe `timedOut` the
same as `InteractionRequiredAuthError`, because a blocked third-party iframe
(Safari ITP, Chrome/Firefox privacy modes) times out rather than throwing the
"real" error. Four separate components each independently call
`instance.loginRedirect(loginRequest)` today; none of them currently know
whether a cached account exists.

## Goals / Non-Goals

**Goals:**

- Attempt a silent session restore exactly once per app load, only when a
  cached account exists.
- Share that attempt's status across all four existing sign-in triggers
  instead of duplicating the check per component.
- Degrade to exactly today's behavior on any failure, with no user-visible
  error and no change to the manual sign-in path.

**Non-Goals:**

- Changing `isAuthenticated`-based routing/redirect logic — unchanged.
- Changing `acquireTokenSilent`/`acquireAccessToken` (post-sign-in token
  refresh) — unchanged, separate concern.
- Tuning MSAL's iframe timeout configuration — accept MSAL's default; see
  Risks.
- A user-facing setting to opt out of automatic restore.
- Any visual redesign of the sign-in controls beyond the in-progress label.

## Decisions

**`ssoSilent` lives in `authentication.ts`, orchestration lives in `AuthProvider`.**
Add an `attemptSilentSignIn(instance)` function to `authentication.ts`
alongside the existing `acquireAccessToken`/`requestApiAccess`, keeping every
direct MSAL API call in one place. It:

1. Returns early (no-op) if `instance.getAllAccounts().length === 0`.
2. Otherwise calls `instance.ssoSilent(loginRequest)`.
3. On success, calls `instance.setActiveAccount(result.account)` (mirroring
   the existing `LOGIN_SUCCESS` event-callback behavior in
   `initializeAuthentication`).
4. On any failure — reusing `isInteractionRequired()` for the
   known/expected cases, but catching unconditionally so an unexpected error
   can't leak into the UI — resolves to a failed outcome rather than
   throwing.

**Correction found during implementation:** the original plan below put the
shared status in a React Context owned by `AuthProvider` (`app/providers`).
That doesn't work — `landing-page.tsx` is a `pages`-layer component, FSD's
dependency direction only lets `pages` depend on layers at or below it
(`shared`, `entities`, `features`), and empirically zero existing pages
import anything from `@/app`. A `pages` component can never read a context
whose provider lives in `app`. The corrected split:

- The status store itself — a plain module-level singleton (current status,
  a "has an attempt already started" guard, a listener set) plus a
  `useSilentSignInStatus()` hook built on `useSyncExternalStore` — lives in
  `shared/auth` (`silent-sign-in.ts`), alongside `attemptSilentSignIn`. Every
  one of the four call sites, `pages` and `app` alike, already depends on
  `shared/auth` today (for `loginRequest`), so this is the layer the shared
  primitive actually belongs in per this project's own rule: "logic reused
  by multiple pages belongs in an appropriate entity or feature and must be
  consumed through that slice's public API."
- `AuthProvider` keeps its role as the single deterministic trigger: a
  `useEffect` (guarded by a plain module-level boolean in the `shared/auth`
  singleton itself, not a component ref, since the guard must hold across
  every consumer, not just across one component's re-renders) calls
  `startSilentSignInOnce(instance)` exactly once per app load, regardless of
  which route/page happens to mount first. `AuthProvider` does not expose
  any context of its own for this — it only triggers the shared singleton
  that `shared/auth` owns and every consumer reads directly.

`"idle"` covers both "no cached account, nothing to do" and "not yet
started"; callers only need to distinguish `"checking"` from everything
else.

**Why a shared singleton instead of a hook that independently calls
`ssoSilent` per component:** a hook that each of the four call sites calls
independently would duplicate the `ssoSilent` call (races, wasted iframe
round-trips) if more than one ever mounts at the same time. In this specific
app, the four triggers turn out to already be close to mutually exclusive by
route/auth-state (`AuthControl` itself is only ever mounted once
`isAuthenticated` is true, and the landing page's own CTA renders on a route
with no sidebar at all) — but the shared singleton keeps that exactly-once
guarantee structurally true rather than incidental, and doesn't depend on
that routing detail staying that way.

**Failure is always silent, never surfaced as an error.** Unlike the
existing `handleSignIn` handlers (which show an error toast on a _rejected
user-initiated_ `loginRedirect`), a failed background silent attempt is an
expected, common outcome (no live IdP session, third-party storage blocked)
and must not alarm a user who never asked for it. The only observable effect
of failure is that the "checking" label reverts to normal.

**Click-through during "checking" is not blocked.** The four call sites keep
their existing `onClick={handleSignIn}` behavior unconditionally; the
in-progress status only changes the rendered label/content, never disables
the control or intercepts the click. This keeps the change additive at each
call site rather than introducing new disabled-state logic to test.

## Risks / Trade-offs

- **[Risk]** MSAL's default silent-iframe timeout could leave a control
  showing "signing you in…" for a few seconds before falling back →
  **Mitigation**: acceptable given clicking remains fully functional
  throughout; not addressed by iframe timeout tuning (Non-Goal) to keep this
  change scoped.
- **[Risk]** Third-party cookie/storage restrictions (Safari ITP, private
  browsing, in-app browsers) make `ssoSilent` fail even when a subsequent
  manual `loginRedirect` would have succeeded instantly (first-party
  navigation isn't subject to the same restriction) → **Mitigation**:
  this is exactly why failure must be silent and fall back to the existing
  manual flow — it's a pure upside attempt, never a regression, since the
  manual path is untouched.
- **[Trade-off]** A `useEffect` + ref guard is a lighter-weight mechanism
  than a request-deduplication library; acceptable because there is exactly
  one call site (`AuthProvider`) and exactly one instance, not a general
  concurrent-request problem.
