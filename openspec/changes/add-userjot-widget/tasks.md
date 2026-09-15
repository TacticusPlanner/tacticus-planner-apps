## 1. Widget install

- [x] 1.1 Add the UserJot v3 two-`<script>` install snippet to `apps/web/index.html` (`launcher: false`, project id via Vite's `%VITE_USERJOT_PROJECT_ID%` HTML env replacement) and the corresponding env var; verify the widget SDK loads with no console errors on the dev server.

## 2. Shared integration hook

- [x] 2.1 Implement `useUserJot()` in `app/providers` wrapping `uj.open()`, `uj.getState()`, and `uj.on('unread', ...)`; verify a unit test with a mocked `window.uj` covers the open passthrough and unread-count updates.
- [x] 2.2 Wire identify/logout lifecycle: fetch a signed token from the companion API endpoint (TanStack Query) when `useCurrentUser()`/MSAL report a signed-in session and again on each `uj.on('open', ...)`; call `uj.logout()` on sign-out; on fetch failure, do nothing further (no unsigned fallback). Verify unit tests cover sign-in, sign-out, and the fetch-failure path per spec ("Widget stays usable if identification fails").
- [x] 2.3 Wire theme sync (`uj.setTheme()` on the app's theme changes) and locale sync (`uj.setLocale()` on `i18n.language` changes); verify unit tests for both, per spec ("Widget theme follows the app's theme" / "Widget language follows the app's active language").

Implemented as a `UserJotProvider` (context + hook), not a bare hook re-running its own effects per caller — mounted once in `app-shell.tsx`, so identify/theme/locale effects run exactly once regardless of how many entry points consume `useUserJot()`. This matches the codebase's existing pattern for this exact problem shape (see `PlayerDataProvider`/`GameCatalogProvider`) and still satisfies "one integration point, consumed by both entry points."

## 3. Desktop entry point

- [x] 3.1 Add a feedback icon button with an unread indicator to `desktop-layout.tsx`'s section-header icon row (alongside `ThemeSwitcher`/`LanguageSwitcher`), styled like `CatalogSyncStatusBadge`'s compact icon treatment, using `useUserJot()`; verify a component test asserts it opens the widget and reflects unread state.

## 4. Mobile entry point

- [x] 4.1 Add a "Feedback" row to `auth-control.tsx`'s mobile account `Drawer` (alongside theme/language/account actions), using `useUserJot()`; verify a component test asserts it opens the widget.

## 5. i18n

- [x] 5.1 Add i18n keys for the desktop button's accessible label and the mobile drawer row's text to the appropriate namespace, with real (not placeholder) translations in every supported locale (en/de/es/fr); verify the namespace's TypeScript resource type includes the new keys.

## 6. Guided tour

- [x] 6.1 Update the shared `general.tutorial.tsx` to include a step introducing the new feedback entry point, with new `tour.steps.feedback.*` i18n keys (matching the existing `tour.steps.*` convention, not the `tour.general.steps.*` guessed above) translated in every supported locale; verify existing tutorial tests still pass and cover the new step.

Desktop only, deliberately: mobile's tutorial already walks the entire account drawer as one collapsed step (`accountDrawer`, see `general.tutorial.tsx`) rather than each action inside it individually — the same treatment theme/language/tour-button already get. The new Feedback row is covered by that existing step; adding a second, item-level mobile step would contradict the established "one surface" mobile pattern. `general.tutorial.test.tsx` asserts both: the desktop step is present, and no mobile step targets the feedback button.

## 7. Manual verification

- [ ] 7.1 Using the local stack started via the Aspire AppHost, verify end-to-end: signed-in user opens the widget and the identity appears verified in the UserJot dashboard; signing out and reopening the widget shows anonymous state; check both a viewport below 768px and one at or above 768px. Data states needed: one signed-in account, one signed-out (anonymous) state.

Verified live against the real UserJot workspace (project id `cmu2umq2y00h90kp8f71ar4aa`, real `UserJot:ProjectSecret` set via `dotnet user-secrets` on the API, real signed-in local account, desktop viewport ~2560px, via the Aspire-run stack):

- The header shows a "Feedback" button next to the theme/language controls; clicking it opens the widget panel.
- `window.uj.getState().session` reports `status: "identified"` with a real UserJot member id — confirming the signed JWT round-trip (API mints it, UserJot validates the signature and matches/creates the member) works end-to-end, not just in mocks.
- The opened widget shows Feedback, Roadmap, and What's new sections (Submit a request / Feedback / Roadmap / What's new) and no Messages/Conversations entry — matches the "Conversations out of scope" requirement.
- Widget theme rendered dark, matching the app's own theme — confirms the theme-sync effect.
- Along the way, found the running `api` resource predated this change's endpoint entirely (stale Debug build from before this session); a plain `aspire resource api restart` reused the same stale binary (still file-locked), so a real fix required stopping the resource, rebuilding, then starting it — worth knowing for next time.
- Not verified in this session:
  - **Signed-out (anonymous) reopen** — not exercised against the live session, since it's the operator's real authenticated account and re-establishing an MSAL session requires interactive credentials this session doesn't have. Covered instead by `userjot-provider.test.tsx`'s sign-out test (asserts `uj.logout()` is called and no identify happens once signed out).
  - **Mobile drawer row at a <768px viewport** — blocked by a tool limitation in this session: the available browser-control surface's window resize did not change the actual rendered viewport (confirmed via `window.innerWidth` staying at the physical monitor's resolution across two different tabs/windows), so the responsive breakpoint could not be forced. The mobile row is covered instead by an automated component test (`auth-control.test.tsx`) that renders the mobile branch directly and asserts the row appears and opens the widget — real-device or working-emulation confirmation is still owed.

## 8. Gates

- [x] 8.1 Run `pnpm test:run`.
- [x] 8.2 Run `pnpm typecheck`.
- [x] 8.3 Run `pnpm lint`.
- [x] 8.4 Run `pnpm lint:fsd`.
- [x] 8.5 Run `git diff --check`.
