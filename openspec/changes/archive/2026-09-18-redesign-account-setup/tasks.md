## 1. Prepare

- [x] 1.1 Grep the repo for every reference to the `OnboardingDialog` export and to the
      `onboarding-dialog`, `onboarding-sign-up-section`, `onboarding-import-section`,
      `onboarding-sign-up-*`, `onboarding-import-*`, `onboarding-api-key-input`,
      `onboarding-user-id-input`, and `onboarding-v1-*` test ids; record the list so every consumer is
      updated in step 2. Verify by confirming the grep output is empty for those names once step 2 is
      complete.
- [x] 1.2 Extract `SignUpForm` and `ImportProfileForm` out of
      `features/account-onboarding/ui/onboarding-dialog.tsx` into their own modules as `ApiKeyForm`
      and `V1ImportForm`, unchanged in behavior and still taking only `{ onCompleted }`. Verify
      `pnpm test:run` and `pnpm typecheck` pass with the dialog still rendering them.

## 2. Setup screen

- [x] 2.1 Add `AccountSetupScreen` to `features/account-onboarding`, rendering as in-flow page
      content (no `Dialog`, no overlay) with a header and a shared footer slot; export it from the
      slice's public API. Verify it renders standalone in a unit test with no `role="dialog"` present.
- [x] 2.2 Establish the viewport-test harness for this feature's suites before writing 2.3-2.5:
      `vi.hoisted` + `vi.mock("@workspace/ui/hooks/use-mobile")` with a settable return, following
      `entities/project/ui/project-select.test.tsx`. Do **not** drive these tests by setting
      `window.innerWidth` — `apps/web/src/test/setup.ts` stubs `matchMedia` to `matches: false` for
      every query, so `useIsMobile()` would stay `false` and the test would assert the desktop tree
      under a mobile name. Verify by flipping the mock in one throwaway assertion and seeing the
      rendered tree change.
- [x] 2.3 Add the desktop presentation: both forms side by side in a two-column grid at ≥768px,
      each in its own panel with its own submit control, no choice step and no Back control. Verify
      with a unit test with `useIsMobile` mocked to `false`, asserting the API key field and the V1
      username field are both present and no Back control is.
- [x] 2.4 Add the mobile presentation: a choice step showing only the two paths, and a form step
      showing one form plus a Back control and a two-step position indicator. The current step comes
      from the route (group 3), not from component state — render it from a `step` prop so this group's
      tests can drive it without a router. Verify with unit tests (`useIsMobile` mocked to `true`) that
      the choice step renders no fields and each form step renders only its own.
- [x] 2.5 Select the presentation with `useIsMobile()`. Verify with unit tests that the mock set to
      `true` renders the choice step and never the two-panel grid, and set to `false` renders the grid
      and never the choice step. The 768px value itself and first-render behavior belong to
      `useIsMobile` and are covered at real viewports in group 8, not asserted in jsdom.
- [x] 2.6 Delete `onboarding-dialog.tsx` once nothing imports it. Verify `pnpm typecheck` and
      `pnpm lint` pass and the grep from 1.1 returns nothing.

## 3. Routing and guards

- [x] 3.1 Add a `resolveNextPath` helper that accepts only a same-origin relative path: it must
      begin with a single `/`, must not begin with `//` or `/\`, must contain no backslash or scheme,
      and must not itself be a setup address (`/setup` or a child of it, which would make the reverse
      guard navigate from setup to setup); anything else resolves to `/home`. Verify with a unit test
      table covering the valid case, a path with a query string, `//evil.example`, `/\evil.example`,
      `https://evil.example`, a backslash-containing path, `/setup`, `/setup/key`, an empty value, and
      a missing value.
- [x] 3.2 Split `ProtectedRoute` in `app/routes.tsx` into an authentication-only guard (MSAL
      `inProgress` wait plus the redirect to `/`) and the existing authentication-plus-onboarding
      guard composed from it. Verify `pnpm test:run` passes with every existing protected route
      behaving as before.
- [x] 3.3 Register `/setup`, `/setup/key`, and `/setup/import` under `AppShell` using the
      authentication-only guard, rendering `AccountSetupScreen` with the step derived from the path.
      Verify with a router test that each path renders its step at mobile width.
- [x] 3.4 Change `OnboardingGate` to redirect to `/setup?next=<current pathname + search>`
      (`replace`) when the current-user request has succeeded and reports onboarding incomplete, and to
      navigate in neither the loading nor the error branch. Update `app/onboarding-gate.test.tsx`
      accordingly. Verify with tests that the unconfigured case navigates, and that the loading and
      error cases render as before and perform no navigation.
- [x] 3.5 Add the reverse guard on the setup routes: navigate away only once the current-user
      request has succeeded and reports onboarding complete, to the resolved `next` or `/home`. Verify
      with tests that a configured user is redirected and that neither the loading nor the error state
      navigates — the pairing with 3.4 is what prevents a redirect loop.
- [x] 3.6 Carry `next` across step navigation (choice → form, Back, and the mobile jump action from
      group 5). Verify with a router test that moves between steps and asserts the parameter survives.
- [x] 3.7 Make successful submission of either form trigger the current-user refetch and **not**
      navigate — the reverse guard from 3.5 performs the navigation once the refreshed state confirms
      a configured key. `useCurrentUser`'s `refetch` is fire-and-forget (`use-current-user.ts:33`) and
      react-query keeps `isPending: false` during a refetch, so navigating on submission would land on
      a protected route whose gate still reads the stale `hasCompletedOnboarding: false` and bounce the
      user straight back to an emptied setup form. Keep the submit control in its in-progress state
      while waiting. Verify with a router test that a successful submit performs no immediate
      navigation, and that the user arrives at the remembered destination only once the refreshed
      account state reports onboarding complete.
- [x] 3.8 Handle the refetch failing after an otherwise successful submission: surface a retry
      rather than an indefinite spinner (the loop-safety rule keeps the reverse guard from navigating
      on an error state, so nothing else will resolve it). Verify with a test that a successful submit
      followed by a failing account-state refresh renders a retry affordance.
- [x] 3.9 Render the full desktop screen at every setup address when `useIsMobile()` is false, with
      no redirect. Do not normalize `/setup/key` to `/setup`: the redirect would be a client-render
      decision, so the step route commits and fires its `page_view` effect before `<Navigate>` is
      processed, emitting two events for one navigation and breaking
      `openspec/specs/product-analytics/spec.md`'s single-page-view requirement. Desktop views of a
      step address are separated in analysis by the `viewMode` property the event already carries.
      Verify with tests that a desktop render of a step path shows the two-panel screen and performs no
      navigation.
- [x] 3.10 Confirm leaving a form step discards its field values, including via browser Back.
      Verify with a router test that types a value, navigates back, re-enters the step, and asserts the
      field is empty.
- [x] 3.11 Give setup its own layout (`app/layout/account-setup-layout.tsx`) registered as a sibling
      of `AppShell`, so the shell's navigation, create-goal, search and Tacticus sync controls — and the
      game-catalog init overlay and player-data auto-sync behind them — are not present during setup.
      Mount `PostHogProvider` there with a literal `/setup` route group: it otherwise lives inside
      `AppShell`, so setup would emit no page-views at all. Verify the setup routes render outside the
      shell and that group 8 sees a `page_view` per step.

## 4. API key path outcome handling

- [x] 4.1 Add unit coverage for `ApiKeyForm`, which has none today (no `onboarding-dialog.test.tsx`
      exists): an accepted key calls the completion callback; a rejected key (mutation rejects with an
      `ApiError`) shows the error on the form, does not call the completion callback, and leaves the
      entered API key and user ID values present in their inputs. Verify both tests pass under
      `pnpm test:run`.
- [x] 4.2 Confirm submitting with the user ID field empty sends no user ID rather than an empty
      string, so a stored one is not cleared. Verify with a unit test asserting the mutation payload
      omits `tacticusUserId`.

## 5. V1 import outcome handling

- [x] 5.1 In `V1ImportForm`, replace the unconditional completion call with a branch on
      `personalTacticusApiKey.status`: complete only on `Imported`; otherwise stay on the form and show
      a message resolved from `code` (`missing_personal_api_key`, `personal_api_key_invalid`,
      `personal_api_key_not_saved`, generic fallback for anything else or null). Reset the form's
      submission state on every non-completing branch — today the only exits from `"submitting"` are
      the `catch` block and unmounting on success, so a minimal edit that just skips `onCompleted()`
      would leave the button disabled behind a spinner forever and the `status === "error"` render
      guard would never show the new message. Verify with unit tests driving a mocked `importV1Profile`
      through each of the four outcomes plus the success case, asserting completion fires only on
      `Imported` and that after each non-completing outcome the submit control is enabled and the
      message is visible.
- [x] 5.2 Confirm the failure path does not refetch the current user and does not clear the entered
      username. Verify with a unit test asserting the refetch mock is not called on a `Skipped`
      outcome.
- [x] 5.3 Confirm an invalid-credentials rejection (HTTP 400) still surfaces the server's field
      message on the import form. Verify with a unit test rejecting the mutation with an `ApiError`.
- [x] 5.4 Add the mobile-only action inside the failure message that navigates to the API key step
      (preserving `next`), and confirm nothing advances until it is activated. Verify with unit tests with
      `useIsMobile` mocked to `true` (action present, form still shown after the failure, key step
      shown only after activation) and to `false` (action absent).
- [x] 5.5 Confirm no non-key part outcome is rendered on this screen. Verify with a unit test whose
      mocked response has `personalTacticusApiKey: Imported` and `tacticusUserId: Failed`, asserting
      completion fires and no user-ID message appears.

## 6. Sign out

- [x] 6.1 Add a sign-out control to the screen's shared footer using `signOut` and
      `useActiveAccountId` from `shared/auth`, following `app/game-catalog-init-gate.tsx` (disabled
      when there is no active account id, sign-out failures logged not thrown). Verify with unit tests
      that it renders on the desktop layout and on all three mobile steps, and that activating it calls
      `signOut` with the active account id.

## 7. Copy and translations

- [x] 7.1 Rewrite the `onboarding.*` keys in `apps/web/public/locales/en/common.json` for the new
      flow: screen title and "pick either one" line, the two path names and their choice-step
      descriptions, the step position indicator, the Back control, the four import outcome messages,
      the mobile jump action, and reuse the existing `auth.signOut` key for the sign-out label rather
      than adding a new one. Remove keys the new flow no longer uses (including `onboarding.or`).
      Verify with `pnpm typecheck`: `shared/config/i18n/i18next.d.ts` types `CustomTypeOptions`
      against `public/locales/en/common.json`, so a `t()` call naming a key that does not exist there
      is a type error. The unit tests cannot catch this — they mock `react-i18next` wholesale and
      never load `public/locales`.
- [x] 7.2 Translate every added or changed key into `de`, `es`, and `fr`, at the quality of the
      sibling namespaces already in `apps/web/public/locales`. Verify each locale's `common.json`
      parses, carries the same `onboarding.*` key set as `en`, and contains no English text left in
      place of a translation.

Note: no Joyride tutorial is added for this screen — see design.md, "No Joyride tour for this
screen". `shared/tour/general.tutorial.tsx` is unchanged by this change, and no
`<page>.tutorial.tsx` is created.

## 8. Manual verification

Required states — arrange these before starting this group, and report the exact missing state
rather than marking a task complete without it:

- (a) a signed-in account with no Tacticus API key configured;
- (b) V1 credentials for an account with no Tacticus API key saved;
- (c) V1 credentials for an account whose saved Tacticus API key is no longer valid;
- (d) V1 credentials for an account with a valid Tacticus API key;
- (e) a valid Tacticus API key to paste.

Session note: 8.1 and 8.5 were verified against the already-running local stack (the setup screen
only renders after `GET /api/v1/me` resolves, so the API was healthy). Also confirmed live at
desktop width: the app shell is absent (no navigation, create-goal, search, sync badge or catalog
overlay), and `/setup/key?next=…` renders the whole two-panel screen at that address with no
redirect. The remaining items are blocked on test data this session does not have — states (b),
(c), (d) need V1 planner accounts in three specific configurations, and (e) needs a valid Tacticus
API key — and on a real sub-768px viewport: `resize_window` is clamped by the OS here, the reported
viewport stays 2560px wide, so no mobile-width check could be performed in-browser. Mobile
presentation and step routing are covered by unit tests (32 cases across the screen and route
suites) but have not been seen at a real viewport.

- [x] 8.1 Start the full local stack from the workspace root through the Aspire AppHost and wait
      for `web` and `api` to report healthy. Verify both resources are healthy before proceeding.
- [x] 8.5 With state (a) at a viewport at or above 768px (1280×800), confirm both panels render
      side by side, each submits independently, and no choice step or Back control appears.

## Deferred / out-of-session

These are live-verification items, not implementation. They are blocked on inputs this session did
not have, and are listed here rather than checked off so the gap stays visible after archive.

**Blocked on test data** — V1 planner accounts in three configurations (no Tacticus key saved; a
saved key that Tacticus now rejects; a valid key), plus one valid Tacticus API key to paste.

**Blocked on a real mobile viewport** — `resize_window` is clamped in this environment; the reported
viewport stayed 2560px wide, so nothing below 768px could be exercised in a browser. The mobile
choice step, Back, per-step addresses, reload-keeps-the-step and the API-key shortcut are covered by
32 unit cases across the screen and route suites, but have **not** been seen at a real viewport —
including the Firefox-for-Android case that prompted this change.

Tracking issue: _not yet filed_ — see the handover note in the final session summary.

- [ ] D.1 With state (a) at a viewport below 768px (390×640), confirm the choice step, the two form
      steps, Back, and the step indicator all behave as specified, that the page scrolls, and that the
      submit control is fully visible and tappable above the fixed bottom nav. Verify by activating the
      submit control at the bottom of the scrolled page.
- [ ] D.2 At 390×640, confirm the addressing behaves: each step has its own URL, the browser Back
      control moves from a form step to the choice step, and reloading on a form step returns to that
      same step with empty fields. Widening the window past 768px keeps the address as it is (no
      redirect — see design.md) and shows the two-panel screen there.
- [ ] D.3 Reproduce the reported case specifically: an Android-sized viewport with a bottom browser
      toolbar (Firefox for Android, or an emulation of a bottom-docked toolbar), and confirm the submit
      control is reachable and not underneath it. Verify by activating it without first dismissing the
      toolbar.
- [ ] D.4 Walk each import outcome against the live API: (b) reports "no API key saved", (c)
      reports "no longer valid", (d) completes setup and reveals the originally requested route, and
      wrong credentials report the credential failure. Verify each message and that only (d) completes.
- [ ] D.5 From a protected deep link (for example `/guild/members`) with state (a), confirm the
      redirect carries it (`/setup?next=%2Fguild%2Fmembers`), then complete setup with (e) and confirm
      that deep link's own content renders immediately afterwards, with no full page reload. Repeat
      once after moving between steps and reloading, to confirm the destination survives both.
- [ ] D.6 Confirm the guards cannot loop: with a configured account, open `/setup` directly and
      confirm a single redirect away with no flicker; then block the current-user request (offline or
      a forced failure) while on `/setup` and confirm the page stays put rather than bouncing.
- [ ] D.7 Confirm a crafted destination is refused: open `/setup?next=https://example.com` with
      state (a), complete setup with (e), and confirm the browser stays on this origin and lands on
      the default signed-in destination.
- [ ] D.8 Confirm analytics: with the PostHog debug/network view open, walk the mobile flow and
      confirm a distinct `page_view` fires for each setup step with its own route pattern and a setup
      route group rather than `unknown`. Then open a step address at 1280px and confirm exactly one
      `page_view` is reported for it, carrying `viewMode: "desktop"` — no redirect, no second event.
- [ ] D.9 Confirm the completion handover: submit a valid key with the network throttled and
      confirm the screen stays in its in-progress state and then moves to the remembered destination
      once, with no bounce back to an emptied setup form.
- [ ] D.10 With state (a), confirm the shell is genuinely absent at both viewports: no navigation,
      no create-goal control, no navigation search, no Tacticus sync badge (in particular no red
      "sync failed" state, which `player-data-provider.tsx`'s mount auto-sync produced when setup
      rendered inside the shell), and no game-catalog init overlay over the form. Then complete setup
      and confirm the full shell returns intact on the destination route.
- [ ] D.11 Confirm the sign-out control signs the user out from the desktop layout and from each
      mobile step.

## 9. Gates

- [x] 9.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and
      `git diff --check`, and verify all pass with no new warnings.
