# Tasks

## 1. Foundations

- [x] 1.1 Add the eight sprites (design decision 7) to `apps/web/datamine/sprites.txt` in sorted order and copy them byte for byte into `public/game_catalog/datamines/`; verify each file's git blob hash equals data-mines `b694130:sprites-webp/<path>`.
- [x] 1.2 Add `shared/config/external-links.ts` (`DISCORD_INVITE_URL`, `GITHUB_ORG_URL`) exported from `@/shared/config`, and export `USERJOT_BOARD_URL` from `@/widgets/account-menu`; verify the account-menu and shell tests still pass.
- [x] 1.3 Add `useSignInRedirect()` to `shared/auth` with a colocated test covering the redirect call, the disabled state during an interaction, the checking state and the error toast.
- [x] 1.4 Make `GuestPreferencesCard`'s `onChangelog` optional and omit the Changelog row without it; verify a test renders it without `onChangelog` and finds no Changelog row.

## 2. Public layout

- [x] 2.1 Add `app/layout/public-layout.tsx`: top bar (logo + name link, Library link `hidden md:`, preferences popover, Sign in or Open planner), `main#main`, footer (disclaimer, Discord, GitHub, Feedback board, Privacy, UI Kit outside production); with a colocated test for signed-out and signed-in account actions, footer links and their targets, and the UI Kit flag.
- [x] 2.2 Wrap the signed-out branch of `LandingRoute` in `PublicLayout` and add the lazy `/privacy` route outside `AppShell`; verify `auth-route-guards.test.tsx` still passes and `routes.test.tsx` asserts `/privacy` is a top-level route outside the shell (no guard, no onboarding gate).

## 3. Landing page

- [x] 3.1 Rewrite `pages/landing/ui/landing-page.tsx` into hero, example plan card, features and Library sections per the `landing-page` spec, with presentational data (feature list, Library cards, sprite paths) in `pages/landing/model/landing-content.ts`.
- [x] 3.2 Update `landing-page.test.tsx`: hero sign-in starts the redirect, checking-state label, disabled during interaction, four features in order, Library card hrefs, MoW and NPC links, one `h1`, decorative images have empty alt.
- [x] 3.3 Update `landing.json` in en/de/es/fr with real translations for all new and changed keys and remove keys no longer read (`appName`, `title`, `subtitle`, `getStarted`, `uiKitLink`), keeping `authError` (still read by Collection); add `common:publicSite.*` for the top bar and footer.
- [x] 3.4 Add meta description, Open Graph and Twitter title/description tags to `apps/web/index.html`.

## 4. Privacy page

- [x] 4.1 Add `pages/privacy` (lazy page, public API `PrivacyPage`) rendering the notice from the `privacy` namespace with a last-updated date, plus a colocated test for the sections and the contact links.
- [x] 4.2 Add `privacy.json` in en/de/es/fr with real translations and register the namespace in `shared/config/i18n/i18next.d.ts`.

## 5. Tutorials

- [x] 5.1 No Joyride tour: public pages render outside the app shell and the tour runner is a signed-in shell feature (design, Non-Goals). Verify no tour target or `useTourPageSteps` call is added and `general.tutorial.tsx` is unchanged.

## 6. Desktop verification (viewport at or above 768px)

Required data: none; signed-out state, local Vite server.

- [x] 6.1 At 1440 x 900, dark and light: top bar with Library link, hero with art, example plan card, four feature columns, three Library columns, footer links; screenshot.
- [x] 6.2 Preferences popover switches theme and language (Deutsch) on the landing page; the Changelog row is absent.
- [x] 6.3 `/privacy` renders inside the public layout with the same top bar and footer.

## 7. Mobile verification (viewport below 768px)

Required data: none; signed-out state, local Vite server.

- [x] 7.1 At 390 x 844: no example card, top-bar Library link hidden, headline and primary button above the fold with top padding, two feature columns, one Library column; screenshot.
- [x] 7.2 `/privacy` at 390 x 844 reads without horizontal scroll.

## 8. Gates

- [x] 8.1 Targeted tests for changed files, `pnpm typecheck`, `pnpm lint` on changed files, `pnpm lint:fsd`, `git diff --check`; full suite left to CI per project instructions.
  - Note: `vitest run` over `src/fsd/app`, `pages/landing`, `pages/privacy`, `widgets/account-menu`, `shared/auth`, `shared/config` and the Collection page: 61 files, 592 tests passed. Typecheck, ESLint on changed files, steiger and knip clean.
