# Tasks

## 1. Shell landmarks, skip link and focus

- [ ] 1.1 Wrap `<Outlet />` in `<main id="main" tabIndex={-1}>` in `desktop-layout.tsx` and `mobile-layout.tsx`, keeping nav, header and bottom bar outside it; verify `desktop-layout.test.tsx` / `mobile-layout.test.tsx` assert exactly one `main` landmark with the page content inside and the nav outside.
- [ ] 1.2 Add the skip link (`sr-only focus:not-sr-only`, `href="#main"`) as the first focusable element in both shells, with `common:nav.skipToContent` in en/de/es/fr; verify a test tabs once, sees the link, activates it and finds focus inside `main`.
- [ ] 1.3 Give the shell `h1` (`desktop-section-header.tsx`, `mobile-header.tsx`) `tabIndex={-1}` and add the pathname effect that focuses it after client-side navigation, skipping first render, search-param-only changes, and while a dialog or tour overlay is open; verify tests cover: sidebar navigation focuses the heading, initial render leaves focus on body, query change does not move focus.
- [ ] 1.4 Demote the page-level `h1` to `h2` in `pages/dailies/ui/hre-page.tsx`, `hse-page.tsx`, `shops-page.tsx` and fix their subsections to `h3`; verify a Dailies test asserts one level-1 heading per tab and updated page tests pass.
- [ ] 1.5 Add `role="status"` with a localized name to the shared route fallback (`LoadingFill`) and the shared spinner components under `app/providers`, swap bare spinners to the shared component where it is a one-line change, add `role="alert"` to `app/route-error-boundary.tsx`; verify `grep -rn animate-spin apps/web/src --include=*.tsx | grep -v test` sites each sit inside an element with `role="status"` and the error boundary test finds the alert.

## 2. Accessible input controls

- [ ] 2.1 Add `useId`-based `aria-controls` to the five combobox triggers (`shared/ui/option-select.tsx`, `rarity-combobox.tsx`, `unit-combobox.tsx`, `pages/library/ui/npcs/npcs-filter-bar.tsx`, `pages/library/ui/raid-bosses/mobile/raid-boss-mobile-picker.tsx`) and set the same id on the listbox; verify each component test asserts `aria-controls` resolves to the open listbox.
- [ ] 2.2 Link `Label` to `SelectTrigger` with `htmlFor`/`id` in `shared/ui/rank-select.tsx` and `progression-select.tsx`; verify tests find the trigger by `getByLabelText(label)`.
- [ ] 2.3 Implement roving `tabIndex` and arrow-key movement for the Tier List tile buttons in `pages/legendary-events/ui/tier-list/tier-row.tsx` with a `ponytail:` note deferring a shared hook; verify a test tabs into a row, moves with Right and Down, stays at the row ends on Left/Right, jumps with Home/End, and leaves with one Tab, and the Collection test asserts no tile is focusable.
- [ ] 2.4 Pass localized `accessibility.announcements` and `screenReaderInstructions` to `DndContext` in `shared/ui/sortable-list.tsx` (a required `getLabel(id): string` prop supplied by every consumer with the row's visible name; no id fallback), add `common:reorder.{pickedUp,movedOver,dropped,cancelled,instructions}` keys with real de/es/fr translations (English is the `fallbackLng` already configured, so an unsupported locale resolves to it); verify tests render with `i18n.language = "de"` and assert the German pick-up announcement naming the row, render with an unsupported language and assert the English text, and `pnpm typecheck` passes the i18n resource types.

## 3. Lint and compiler gates

- [ ] 3.1 Add `eslint-plugin-jsx-a11y` to the pnpm catalog and `apps/web/eslint.config.js` (recommended), fix every reported violation; verify `pnpm --filter web lint` is clean.
- [ ] 3.2 Switch `apps/web/eslint.config.js` to `tseslint.configs.recommendedTypeChecked` with `parserOptions.projectService: true`, set `@typescript-eslint/no-floating-promises` and `no-misused-promises` to error, fix or `void` each site (intentional fire-and-forget only); verify `pnpm --filter web lint` is clean and record lint wall time in this task's notes.
- [ ] 3.3 Enable `noUncheckedIndexedAccess` in `apps/web/tsconfig.app.json` and fix the resulting errors with local guards (no blanket `!`); verify `pnpm typecheck` passes and the farming and LRE parity fixture tests are unchanged.
- [ ] 3.4 Add `vitest-axe` (or `axe-core`) dev dependency and one axe test per shell rendering a stub page; verify both tests pass with zero violations.
- [ ] 3.5 Add a short "Query by role first" note to the testing guidance in `apps/web/AGENTS.md` (or the existing testing doc) with the `ByTestId` fallback rule; verify the note is present and lint does not flag the doc.

## 4. Desktop verification (viewport at or above 768px)

Required data: a signed-in account with at least one goal (for reorder) and the Tier List page reachable.

- [ ] 4.1 Tab once on `/home`: skip link visible; Enter moves focus into `main`.
- [ ] 4.2 Navigate Home -> Plan -> Dailies/HSE via the sidebar: focus lands on each page `h1`; exactly one `h1` in the document on each Dailies tab.
- [ ] 4.3 Open the unit combobox in Create Goal: `aria-controls` resolves to the listbox (inspect in devtools); rank select announces its label.
- [ ] 4.4 Reorder a goal row with the keyboard in German: announcements are in German.
- [ ] 4.5 Tier List: one Tab stop per row, arrows move between tiles.
- [ ] 4.6 Run the shell tour (`general.tutorial.tsx`): the skip link never becomes visible between steps.

## 5. Mobile verification (viewport below 768px, same-origin iframe per `tp-manual-ui-verification`)

- [ ] 5.1 Confirm the mobile shell renders (bottom nav present); Tab once shows the skip link; activating it focuses `main`.
- [ ] 5.2 Navigate via the bottom nav and the menu drawer: focus lands on the mobile header `h1`; one `h1` per Dailies tab.
- [ ] 5.3 Raid-boss mobile picker: `aria-controls` resolves to its listbox.
- [ ] 5.4 Mobile reorder mode: announcements are in the active locale.
- [ ] 5.5 Run the mobile shell tour: no skip-link flash between steps.

## 6. Gates

- [ ] 6.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check`; verify all pass.
