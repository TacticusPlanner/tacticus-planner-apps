## 1. Core silent sign-in mechanism

- [x] 1.1 In `apps/web/src/fsd/shared/auth/authentication.ts`, add
      `attemptSilentSignIn(instance)`: no-op (resolve to a "no cached
      account" outcome) when `instance.getAllAccounts().length === 0`;
      otherwise call `instance.ssoSilent(loginRequest)`, call
      `instance.setActiveAccount(result.account)` on success, and resolve to
      a failed outcome (never throw) on any error, reusing
      `isInteractionRequired()` for the known `InteractionRequiredAuthError`
      / silent-timeout cases but catching unconditionally so unexpected
      errors can't escape.
- [x] 1.2 In `apps/web/src/fsd/shared/auth/silent-sign-in.ts`, add a
      module-level status singleton (`"idle" | "checking" | "failed"`), a
      `startSilentSignInOnce(instance)` function guarded so it runs at most
      once per app load, and a `useSilentSignInStatus()` hook
      (`useSyncExternalStore`-based) for consumers to read the shared
      status. Export both from `shared/auth`'s public API. In
      `apps/web/src/fsd/app/providers/auth-provider.tsx`, call
      `startSilentSignInOnce(instance)` from a `useEffect` on mount — see
      design.md's "Correction found during implementation" for why the
      status store itself cannot live in `app/providers` (pages can't
      depend on `app`).
- [x] 1.3 Add unit tests for `attemptSilentSignIn` (no cached account,
      success, `InteractionRequiredAuthError`, silent-timeout, unexpected
      error) and for `AuthProvider`'s status transitions (including that a
      second effect invocation does not trigger a second `ssoSilent` call).

## 2. Wire up sign-in triggers

- [x] 2.1 Update `apps/web/src/fsd/pages/landing/ui/landing-page.tsx` to
      read `useSilentSignInStatus()` and show the "checking" label on the
      "Get started" control while `"checking"`; `onClick` behavior
      (`loginRedirect`) unchanged.
- [x] 2.2 Update `apps/web/src/fsd/app/providers/auth-control.tsx`
      similarly for its desktop sign-in state.
- [x] 2.3 Update `apps/web/src/fsd/app/layout/desktop-layout.tsx`
      similarly for its sidebar sign-in button.
- [x] 2.4 Update `apps/web/src/fsd/app/layout/mobile-header.tsx` similarly
      for its mobile sign-in button.
- [x] 2.5 Update/extend `auth-control.test.tsx`,
      `landing-page.test.tsx`, `desktop-layout.test.tsx`, and
      `mobile-layout.test.tsx` (or the appropriate mobile-header test) to
      cover the "checking" label and that clicking during "checking" still
      calls `loginRedirect` immediately.

## 3. Copy and localization

- [x] 3.1 Add the "Account detected — signing you in…" copy as a new key
      (or keys, if the landing page and the other three triggers don't
      share a loaded i18n namespace) following this repo's react-i18next
      conventions, alongside the existing `common.json` `signIn` key and
      `landing.json` `getStarted` key. Resolution: `common.json`'s `auth`
      namespace is preloaded app-wide (`defaultNS: "common"`), so all four
      call sites share one key, `auth.checkingSignIn`; the landing page
      (which otherwise only loads the `landing` namespace) reads it via
      `useTranslation(["landing", "common"])` and `t("common:auth.checkingSignIn")`.
- [x] 3.2 Add the new key(s) to every supported locale
      (`apps/web/public/locales/{en,de,es,fr}`), matching existing
      translation quality/tone for each locale file.

## 4. Verification

- [x] 4.1 Run the repository-wide gates: `pnpm test:run`, `pnpm typecheck`,
      `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`.
- [x] 4.2 Confirm `general.tutorial.tsx`'s existing shell tour (which
      references `auth-account-trigger` and related selectors) still
      passes unchanged, since this change only conditionally alters label
      content, not element structure/`data-testid`s.
- [ ] 4.3 Manually verify via the full local stack (Aspire AppHost, not a
      standalone Vite server) using a real Entra test account: (a) sign
      out, reload with an expired-but-cached local session and confirm
      silent restore lands on `/home` with no click; (b) clear all site
      data / use a fresh profile with no cached account and confirm the
      landing page renders immediately with the normal "Sign in" label
      and no delay; (c) while a silent attempt is deliberately slowed or
      blocked (e.g. throttled network, or third-party cookies disabled),
      confirm all four sign-in controls show the "checking" label and
      then fall back to the normal label with no visible error, and that
      clicking during "checking" still signs in manually.
