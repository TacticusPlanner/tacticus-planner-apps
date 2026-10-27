# Proposal

## Why

The audit of 2026-10-20 found that neither app shell exposes a `main` landmark, a skip link or any focus handling on route change, several shared controls are wired incorrectly for assistive technology, and the lint and compiler settings let the defects that cause those gaps (unlinked labels, floating promises, unchecked index access) land unnoticed. Pre-launch is the cheapest moment to set the baseline: the fixes are small, and the gates stop the next 100 components from repeating them.

Evidence: `apps/web/src/fsd/app/layout/desktop-layout.tsx` and `mobile-layout.tsx` render `<Outlet />` inside plain `div`s (only `account-setup-layout.tsx` has `<main>`); no shell code moves focus on navigation (the only `.focus()` calls are the section-toggle and search-dialog return focus); `hre-page.tsx`, `hse-page.tsx` and `shops-page.tsx` render their own `<h1>` under the shell's `<h1>` while `today-page.tsx` uses `<h2>`; five `role="combobox"` triggers (`shared/ui/option-select.tsx`, `rarity-combobox.tsx`, `unit-combobox.tsx`, `pages/library/ui/npcs/npcs-filter-bar.tsx`, `pages/library/ui/raid-bosses/mobile/raid-boss-mobile-picker.tsx`) set `aria-expanded` but never `aria-controls`; `shared/ui/rank-select.tsx` and `progression-select.tsx` render a `Label` with no `htmlFor`/`id` pair; `shared/ui/sortable-list.tsx` uses dnd-kit's default English announcements in a four-locale app; 45 non-test files render a spinner but only 8 use `role="status"` and 19 `role="alert"`; `eslint.config.js` uses the non-type-aware preset and `tsconfig.app.json` lacks `noUncheckedIndexedAccess`; tests query `ByTestId` 4,471 times against `ByRole` 630 (1,082 vs 86 in the Legendary Events slice).

## What Changes

- Both shells wrap the routed page in a `main` landmark, render a visually hidden skip link as the first focusable element, and move focus to the page heading after client-side navigation.
- The shell owns the page's single `h1`; Dailies tabs (HRE, HSE, Shops) stop rendering a second `h1` and start their own hierarchy at `h2`, matching Today.
- Loading indicators expose `role="status"` through the shared loading components; error blocks expose `role="alert"`.
- Combobox triggers reference their popup with `aria-controls`; `RankSelect` and `ProgressionSelect` link their label to the trigger; operable tile grids (Tier List) become one tab stop with arrow-key movement; reorder (drag) announcements are localized in all four locales.
- Tooling (no spec-level behavior): `eslint-plugin-jsx-a11y` (recommended), type-aware `typescript-eslint` via `projectService` with `no-floating-promises` and `no-misused-promises`, `noUncheckedIndexedAccess` in `tsconfig.app.json`, and the code fixes those settings surface. `exactOptionalPropertyTypes` stays off (see design).
- Tests: an axe check over both shells; the testing guide prefers role-based queries for new tests. No bulk rewrite of existing `ByTestId` queries.

## Capabilities

### New Capabilities

- `shell-landmarks-and-focus`: the landmark structure, skip link, heading hierarchy, focus management on navigation, and live-region roles that every routed page inherits from the app shells.
- `accessible-input-controls`: assistive-technology wiring of the shared selection controls — combobox popups, labeled selects, operable tile grids, and localized reorder announcements.

### Modified Capabilities

- none. `app-navigation` already covers search focus hand-off and keyboard shortcuts; `goal-visual-accessibility` covers contrast and color independence. Neither requirement changes.

## Impact

- `apps/web/src/fsd/app/layout/desktop-layout.tsx`, `mobile-layout.tsx`, `mobile-header.tsx`, `desktop-section-header.tsx`; `shared/tour/general.tutorial.tsx` only if the skip link needs a tour note (it does not).
- `apps/web/src/fsd/pages/dailies/ui/{hre-page,hse-page,shops-page}.tsx` headings.
- `shared/ui/{option-select,rarity-combobox,unit-combobox,rank-select,progression-select,sortable-list}.tsx`, `pages/library/ui/npcs/npcs-filter-bar.tsx`, `pages/library/ui/raid-bosses/mobile/raid-boss-mobile-picker.tsx`, `pages/legendary-events/ui/tier-list/tier-row.tsx`.
- Shared loading/error components and the ~37 spinner sites that lack `role="status"`.
- `apps/web/eslint.config.js`, `tsconfig.app.json`, `pnpm-workspace.yaml` catalog (new dev dependencies `eslint-plugin-jsx-a11y`, `vitest-axe` or `axe-core` for the shell test), and whatever code the stricter settings flag.
- `apps/web/public/locales/{en,de,es,fr}/common.json`: skip-link label and reorder announcement strings.
- Sibling changes: independent of all; the stricter lint and compiler settings touch fewer files if they land after `rehome-feature-logic`, so that is the preferred (soft) order. `knip`, `max-lines` and the test harness are out of scope (`rehome-feature-logic`, `test-harness-render-app`). No companion `tacticus-planner-api` change.
