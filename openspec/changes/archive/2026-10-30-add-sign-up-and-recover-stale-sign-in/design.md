# Design

## Context

See proposal.md (Why). The current state in `apps/web/src/fsd/shared/auth/authentication.ts`:

- `initializeAuthentication()` calls `completeRedirect()` before React mounts. `completeRedirect()`
  catches every `handleRedirectPromise()` rejection with `console.warn` and returns `null`, so the
  app starts signed out and nothing records that a sign-in failed.
- Interactive flows start from several places:
  - `useSignInRedirect` (`shared/auth`, used by the public top bar, the landing hero, the guest
    account menu and the privacy page);
  - direct `instance.loginRedirect(loginRequest)` calls in `mobile-header.tsx`, `auth-control.tsx`,
    `unit-header.tsx` and `collection-page.tsx`;
  - `startInteraction()`, which uses `acquireTokenRedirect` with the cached account, or
    `loginRedirect` with the account hint as `loginHint`.
    All of them spread or reuse the exported `loginRequest` (whose `scopes` is a getter), except
    `startInteraction`, which builds its own request.
- The device keeps an account hint (`tp.auth.accountHint`) and MSAL's cache in `localStorage`
  (`safeStorage`). Sign-out clears both.
- The identity provider (Entra External ID, `tacticusplannerext.ciamlogin.com`) keeps its own session
  cookie. In the production incident it answered every sign-in from a session whose user had been
  deleted, so `prompt` is the only lever the app has over that cookie.
- MSAL 5.25 provides `PromptValue.LOGIN`, `PromptValue.CREATE` and `clearCache()`, which clears local
  accounts without a logout redirect.

## Goals / Non-Goals

**Goals:**

- One place decides what a failed redirect means and arms the recovery, and every interactive entry
  point picks up the fresh-login prompt without being edited one by one.
- Sign-up reuses the sign-in redirect's return-destination logic (`signInRequest()`).

**Non-Goals:**

- No Sign up in the app shell's signed-out chrome (the desktop guest account menu, the mobile
  header). They gain the recovery but not a new button. The user asked for the public pages only.
- No change to silent restore (`ssoSilent` / `acquireTokenSilent`). A `prompt=login` there would
  break it, and its failures are already handled silently by `silent-sign-in`.
- No identity-provider configuration change, and no logout redirect to end the dead session. We
  can't sign out of a session we can't authenticate to, and `prompt=login` makes it irrelevant.

## Decisions

### D1. Record the outcome of a failed redirect in `shared/auth`, and show the toast from the app layer

`completeRedirect()` keeps catching, but now classifies the error and stores a one-shot,
module-level outcome: `"cancelled"` or `"failed"`.

- **`"cancelled"`:** an MSAL `AuthError` (in practice a `ServerError`) whose `errorCode` is
  `access_denied`. That is what Entra returns when the user cancels or backs out of a step.
- **`"failed"`:** any other error.

A new public function `takeSignInRedirectFailure()` returns the outcome once and clears it. The app
layer's auth provider (`fsd/app/providers`) calls it after i18n is ready and shows `auth.error` with
the existing `toast.error` when the outcome is `"failed"`.

- _Why not toast inside `completeRedirect`?_ It runs before React and i18n mount, so there's nothing
  to render with.
- _Why not `sessionStorage`?_ The value only has to survive until the first render of the same page
  load, so module state is enough. The purge notice needs `sessionStorage` because it crosses a
  sign-out redirect.
- _Alternative considered:_ toast every error, cancels included. Rejected: a toast right after you
  pressed Cancel reads as a bug, and the spec keeps the current no-error behaviour for a deliberate
  cancel.

The classification is the one assumption here. Entra might report the stale-session rejection as
`access_denied` too. That would only lose the toast, not the recovery (D2 runs for both outcomes),
so it's checked during manual verification (tasks) rather than resolved now.

### D2. On any failed or cancelled redirect, clear local sign-in state and arm "fresh login"

In the same catch, for both outcomes:

1. `await instance.clearCache()` — no network call, no identity-provider logout.
2. `forgetAccountHint()`.
3. `safeStorage.set("tp.auth.freshLogin", "1")`.

Because the cache and the hint are both gone, the next app load starts no silent restore, which
matches the spec's "device sign-in state" scenario. The flag lives in `localStorage` like the hint,
so it survives a closed tab. Otherwise a new tab would spend one more failing round trip before
re-arming.

- _Alternative considered:_ keep the cached account and only add the prompt. Rejected: a stale
  cached account makes `useIsAuthenticated` true, so the landing shows "Open planner", and
  `startInteraction` would target the deleted account with `acquireTokenRedirect`.

### D3. Apply the prompt centrally through the shared request objects

- `loginRequest` gains a `prompt` getter: `PromptValue.LOGIN` while the flag is set, otherwise
  `undefined`. Every caller that spreads `loginRequest` picks it up when the spread runs, at click
  time, so `mobile-header.tsx`, `auth-control.tsx`, `unit-header.tsx` and `collection-page.tsx` need
  no edits.
- `startInteraction()`, the only caller that builds its own request, adds `...freshLoginPrompt()`.
- The flag is cleared on the first successful interactive flow:
  - in `initializeAuthentication()` when `redirectResult` is non-null;
  - in the existing event callback, for `LOGIN_SUCCESS` and `ACQUIRE_TOKEN_SUCCESS` with
    `interactionType === Redirect`. (MSAL also emits `LOGIN_SUCCESS` from `ssoSilent` with
    `interactionType === Silent`, so the interaction type is checked for both events.)
    Silent successes don't clear it, but with the cache cleared none can happen before an interactive
    one.
- The silent restore (`acquireTokenSilent`, `ssoSilent`) passes `scopes: loginRequest.scopes` instead
  of spreading `loginRequest`, so the `prompt` getter never reaches a silent request.
- _Alternative considered:_ a `prompt` parameter on each call site. Rejected: six call sites, and
  the next new sign-in button would forget it. That's how this class of bug starts.

### D4. Sign-up is a sibling request in the same hook

`use-sign-in-redirect.ts` builds `signUpRequest()` as `{ ...signInRequest(), prompt: PromptValue.CREATE }`,
which keeps the bare-`/` → `/home` start page and the `?next=` behaviour. The hook returns
`{ signIn, signUp, disabled, checkingSignIn }`, with one shared error handler (toast `auth.error`
on a rejected start).

`prompt=create` takes precedence over an armed `prompt=login`, since there's only one `prompt`
parameter. Create-account always shows a fresh page anyway, so the stale session can't answer it.

The public API stays `useSignInRedirect` from `@/shared/auth`, so there's no new slice. Pages and
`app/layout` already import it, and FSD direction is unchanged (app/pages → shared).

### D5. Placement and styling

- **Public top bar** (`app/layout/public-layout.tsx`): for signed-out visitors, Sign in becomes
  `variant="ghost"` (icon plus label) and a new **Sign up** button with the default primary variant
  follows it. Both are `size="sm"`.
- **Hero** (`pages/landing/ui/landing-page.tsx`): "Get started, it's free" is unchanged. **Sign up**
  is inserted after it with `variant="outline"`, matching "Browse the library", and the action row
  already wraps.
- **Desktop vs mobile:** the same markup with no `useIsMobile()` branch. On mobile the top bar keeps
  both buttons and the app name truncates, which `min-w-0`/`truncate` already allow. Both are
  checked at 390px and 360px. In the hero the three actions wrap, and the Sign up button has to stay
  above the fold at 390 x 844, as the spec requires.
- **Joyride:** the landing page has no tour (public pages aren't registered with `useTourPageSteps`),
  so no tour steps change. The new buttons still get `data-testid`s (`public-sign-up`,
  `landing-sign-up`) for tests.
- **i18n:** a new key `common:auth.signUp` ("Sign up") in en, de, es and fr.

## Risks / Trade-offs

- **The cancel classification may be wrong.** If the stale-session rejection also arrives as
  `access_denied`, that case gets no toast. → The recovery still works, and manual verification
  records the real error codes for both paths (cancel at the username step, and a stale session) on
  staging. Adjust the classification if needed.
- **`prompt=login` costs one more login screen.** After a failure, the next sign-in always asks for
  credentials even if the provider session was actually fine. → It happens once per failure and
  disappears after the next success.
- **`clearCache()` signs the device out after a failed re-authentication.** A user who cancels a
  re-authentication from inside the app ends up signed out instead of keeping cached data access. →
  That's the spec's existing "shown as signed out" outcome. Their tokens already needed interaction,
  so nothing usable is lost.
- **Getters on `loginRequest` only apply when the object is read.** A caller that captured
  `{ ...loginRequest }` at module load would miss the prompt. → All current callers spread it inside
  click handlers. A unit test asserts that `loginRequest.prompt` reflects the flag.

## Migration Plan

Frontend-only and backward compatible. It ships with the next apps release, with no data migration.
Devices that are already stuck recover on their first failed attempt after the update. Rollback is
reverting the release; the stray `tp.auth.freshLogin` key is harmless.
