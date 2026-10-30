# Tasks

## 1. Record and recover from a failed sign-in redirect (`shared/auth`)

- [x] 1.1 In `apps/web/src/fsd/shared/auth/authentication.ts`, make `completeRedirect()` classify a rejected `handleRedirectPromise()` as `"cancelled"` (an `AuthError` with `errorCode === "access_denied"`) or `"failed"` (anything else). Store the result as a one-shot outcome and export `takeSignInRedirectFailure()` through the `@/shared/auth` public API. Verify with `authentication.test.ts` cases: an `access_denied` `ServerError` gives `"cancelled"`, another server error gives `"failed"`, a second `take…()` call gives `null`, and a resolved redirect gives no outcome.
- [x] 1.2 In the same catch, for both outcomes: `await instance.clearCache()`, `forgetAccountHint()`, and set `tp.auth.freshLogin` via `safeStorage` (design D2). Verify with tests: after a rejected redirect, `clearCache` was called, `readAccountHint()` is `null`, the flag is set, and `initializeAuthentication()` still resolves with the app signed out (no active account).
- [x] 1.3 Add a `prompt` getter to `loginRequest` that returns `PromptValue.LOGIN` while the flag is set and `undefined` otherwise. Make `startInteraction()` add the same prompt to both its `acquireTokenRedirect` and `loginRedirect` requests (design D3). Verify with tests: `{ ...loginRequest }.prompt` follows the flag, and `startInteraction` sends `prompt: "login"` when the flag is armed, with and without a cached account.
- [x] 1.4 Clear the flag after a successful interactive flow: when `redirectResult` is non-null in `initializeAuthentication()`, and in the event callback for `LOGIN_SUCCESS` and for `ACQUIRE_TOKEN_SUCCESS` with `interactionType === InteractionType.Redirect`. Silent successes must not clear it. Verify with tests for each of those paths, plus a silent `ACQUIRE_TOKEN_SUCCESS` that leaves the flag set.
- [x] 1.5 Make `signOut` (`shared/auth/sign-out.ts`) also clear `tp.auth.freshLogin`, so a later account starts clean. Verify with a `sign-out` test assertion.

## 2. Show the failure toast (`app/providers`)

- [x] 2.1 In the app's auth provider (`apps/web/src/fsd/app/providers/auth-control.tsx`, or the provider that already owns MSAL toasts), call `takeSignInRedirectFailure()` once after mount and show `toast.error(t("auth.error"))` for `"failed"` only. Verify with `auth-control.test.tsx` cases (implemented in `auth-provider.tsx` / `auth-provider.test.tsx`: `AuthControl` is mounted only in the app shell, and a failed redirect lands on the public landing page): `"failed"` shows exactly one toast, also under StrictMode double-invoke; `"cancelled"` and `null` show none.

## 3. Sign-up request and hook (`shared/auth`)

- [x] 3.1 In `use-sign-in-redirect.ts`, add `signUpRequest()` = `{ ...signInRequest(), prompt: PromptValue.CREATE }`, and make the hook return `signUp` next to `signIn`, sharing the rejected-start error toast (design D4). Verify with `use-sign-in-redirect.test.ts` cases:
  - `signUp` from a bare `/` sends `prompt: "create"` and `redirectStartPage` ending `/home`;
  - from `/?next=%2Fgoals` it sends `prompt: "create"` and no `/home` start page;
  - `create` wins over an armed fresh-login flag;
  - a rejected start shows `auth.error`.
- [x] 3.2 Add `auth.signUp` to `apps/web/public/locales/{en,de,es,fr}/common.json` with real translations: "Sign up", "Registrieren", "Registrarse", "S'inscrire". Verify that every locale file parses and that the i18n key-parity test (if present) passes.

## 4. Sign up on the public top bar and the landing hero

- [x] 4.1 In `apps/web/src/fsd/app/layout/public-layout.tsx`, for signed-out visitors render Sign in as `variant="ghost"` and add a primary `size="sm"` Sign up button (`data-testid="public-sign-up"`) after it, both disabled while `disabled`. Signed-in visitors keep the single "Open planner". Verify with `public-layout` tests: the signed-out top bar shows both buttons, Sign up calls `signUp`, and the signed-in top bar shows no Sign up.
- [x] 4.2 In `apps/web/src/fsd/pages/landing/ui/landing-page.tsx`, insert an outline Sign up button (`data-testid="landing-sign-up"`) between "Get started, it's free" and "Browse the library", for signed-out visitors only. It's disabled while an interaction is in progress and stays enabled during the silent check. Verify with `landing-page.test.tsx` cases: present when signed out and calls `signUp`; absent when signed in; enabled while `checkingSignIn`; disabled while `disabled`.
- [x] 4.3 Run `pnpm lint:fsd` to confirm the new imports keep FSD direction (app/pages → `@/shared/auth`). Verify: it passes.

## 5. Desktop verification (viewport ≥ 768px, local Aspire stack)

Data states needed:

- (a) a signed-out browser profile;
- (b) a profile whose identity-provider session belongs to a deleted account. To create it, sign up a throwaway account on the local stack, purge it with "Planner data and sign-in account", and keep the same browser profile.

- [ ] 5.1 State (a), at 1280px: the top bar shows Sign in and Sign up; the hero shows Get started, Sign up and Browse the library. Sign up opens the identity provider's create-account page (offering email and Google), and completing it with a throwaway account lands on `/home`. Starting from `/?next=%2Fgoals` lands on `/goals`. Record the screenshots.
- [ ] 5.2 State (a): start Sign in, cancel or back out at the username step, and return. The landing loads with no toast, and the next Sign in shows the login page with no account answered silently. Record the MSAL error code seen for the cancel (console), to confirm the `access_denied` classification.
- [ ] 5.3 State (b): start Sign in. The first attempt returns with an error, the authentication error toast shows once, and the device has no cached account or hint. A second Sign in shows the identity provider's login page (no loop back to `/?next=/home`). Record the error code. If it's `access_denied`, update the D1 classification or note the lost toast in the design.

## 6. Mobile verification (viewport < 768px, same-origin iframe)

Data state (a) as in group 5. Emulate 390px and 360px with a same-origin iframe on the app origin, following `tp-manual-ui-verification`.

- [x] 6.1 At 390px and at 360px: the top bar shows the logo, the truncated name, preferences, Sign in and Sign up on one row with no horizontal scroll. At 390 x 844 the hero's headline, Get started and Sign up are visible without scrolling. Record the screenshots.
- [ ] 6.2 At 390px: Sign up from the top bar and from the hero each start the create-account redirect (the identity provider's create-account page loads in the top-level page).

## 7. Repository gates

- [ ] 7.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check` from the apps repo root. Verify: all pass.
  - 2026-10-30: typecheck, lint, lint:fsd and diff --check pass. test:run has 2 failures in `pages/home/model/events-calendar-calc.test.ts` (`buildEventsAgenda`), which fail identically on `main` (0712d8f2) and are untouched by this change.
- [x] 7.2 Run `openspec validate add-sign-up-and-recover-stale-sign-in --strict`. Verify: it passes.

## Workflow follow-up

- Open the apps PR with this change; after merge, sync specs and archive the change.
- Production check after the next release: on a device with a stale identity-provider session, the first sign-in shows the toast and the second shows the login page.
