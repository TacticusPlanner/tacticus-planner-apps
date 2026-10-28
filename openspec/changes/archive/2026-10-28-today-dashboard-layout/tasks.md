## 1. Building blocks

- [x] 1.1 In `pages/dailies/ui/dailies-layout.tsx`, pass `className="max-w-[150rem]"` to `PageContainer` when `useMatch("/dailies/raids")` matches; verify with a `dailies-layout.test.tsx` case: `/dailies/raids` has `max-w-[150rem]`, `/dailies/hse` does not.
- [x] 1.2 Add `--energy-over` (light `#9a6a00`, dark `#d9a032`) to `packages/ui/src/styles/globals.css` and `--color-energy-over` to `@theme inline`; verify both values reach at least 4.5:1 against `--card` in their theme with a contrast tool (adjust the hex if not) and that `bg-energy-over` / `text-energy-over` compile in `pnpm --filter web build`.
- [x] 1.3 Add `cardLayout?: "stacked" | "grid"` (default `"stacked"`) to `features/daily-raids/ui/raid-schedule.tsx` as in design decision 3; verify with `raid-schedule.test.tsx`: the default keeps `md:columns-[20rem]` and has no `grid-cols` class on `raid-resource-grid-<goalId>`, and `"grid"` drops the columns class and adds `md:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]`.
- [x] 1.4 Give `RaidState` a `variant?: "card" | "inline"` (default `"card"`; inline drops the outer `Card`); verify with a `raid-state` test that inline renders the same text and button without the card wrapper.
- [x] 1.5 Give `TodayQuickFilterChips` `layout?: "stacked" | "inline"` (default `"stacked"`; inline puts the caption on the chips' line, notes `basis-full`, keeps `today-quick-filters` and the chip/note test ids); verify with a `today-quick-filter-chips.test.tsx` case for the inline layout with one chip on.
- [x] 1.6 Export `isLocationVisible` from `features/daily-raids/index.ts`; verify `pnpm lint:fsd` passes.

## 2. View model

- [x] 2.1 Create `pages/dailies/ui/today/today-view-model.ts` with `buildTodayView(raids, { showAllBonus })` and `BONUS_LIMIT`, moving `TodaySchedule`'s derivations verbatim (design decision 1), with `scheduleProps` carrying `cardLayout: "grid"`, `overLimit = selection.energyLimitReached`, and every bonus entry at the limit; verify with `today-view-model.test.ts`: bonus slicing and `bonusHasMore`, every entry at the limit, node counts excluding an exhausted node, `planResourceByBattle` precedence, tokens 1.2 + 0.5 → 2, percent 663 / 638 → 103.9 uncapped, `overLimit` false when `dailyEnergy = 0`, and attempts 6+6+10+5+2 → 5 rows / 29.

## 3. Cards and dashboard

- [x] 3.1 Create `today/today-card.tsx` (`Card size="sm"`, `role="region"`, `aria-labelledby` via `useId`, header with h2 / meta / action); verify through the dashboard test's region queries (3.7).
- [x] 3.2 Create `today/today-plan-card.tsx`: `FilteredOutNotice`, then `RaidSchedule` (`today-raid-list`) with inset card background, meta "{n} nodes · goal priority order", and `RaidState variant="inline"` for loading, error, no goals and no-farmable; verify with dashboard tests for ready and loading.
- [x] 3.3 Create `today/today-bonus-card.tsx` with the below-limit mode (top 3, Show more / Show less, meta "if energy is left", hidden when empty) and the at-limit mode (`data-limit="reached"`, caption first, every entry); verify with dashboard tests for 5 entries (3 → 5 → 3), no entries, and the limit with and without entries.
- [x] 3.4 Create `today/today-onslaught-card.tsx` (`today-onslaught`, token badge, `sr-only` summary, `OnslaughtRunList`); verify it is absent with no runs and lists runs in priority order.
- [x] 3.5 Create `today/todays-attempts-card.tsx` with the compact rows (material icon, campaign icon, campaign + node on one wrapping line, "N attempts", row `aria-label` naming the material), header "{rows} nodes · {attempts}" and the empty line, moving `TodaysAttemptsList` out of `today-page.tsx`; verify with tests for the 5-node / 29-attempt header, a row's accessible name, and the empty state.
- [x] 3.6 Turn `today-shops.tsx` into the card form (always `ShopsMobile`, subtitle as meta) and add `compact` to `ShopsState` for the one-line nothing state; delete `shops/desktop/shops-desktop.tsx`; verify with `today-shops.test.tsx` (mobile layout rendered with `useIsMobile` mocked to false, the one-line nothing state, loading and error unchanged) and `pnpm --filter web exec knip` (or the repo's knip script) reporting no unused export.
- [x] 3.7 Create `today/today-dashboard.tsx`: an `@container` grid with the plan area (`today-plan-area`, `@[42rem]:col-span-2`), side 1 (Bonus raids, Shops) and side 2 (Onslaught, Today's attempts), with `showAllBonus` state; verify with `today-dashboard.test.tsx`: regions in DOM order Plan, Bonus, Shops, Onslaught, Attempts; the limit case puts the bonus card in the plan area with no plan card; no-bonus and no-Onslaught cases close up; loading shows only the plan spinner and Shops; container and span classes present.

## 4. Glance tiles

- [x] 4.1 Split `campaign-event-status.tsx` into `useCampaignEventDetail()` (string building unchanged) and `CampaignEventTile` (wrapping value, icon, `campaign-event-status` test id); update `campaign-event-status.test.tsx` to the tile and the two `vi.mock("./campaign-event-status")` blocks; verify the campaign event tests pass with the same strings.
- [x] 4.2 Create `today/today-glance.tsx` (`today-glance`, `<section aria-label>` → `<dl>`, `GlanceTile`) with Daily energy used (`energy-usage`, `energy-usage-bar`, over-limit label and colours), Planned today, Onslaught and Campaign event, and the hiding and over-limit swap rules; verify with `today-glance.test.tsx`: order, 104% with `aria-valuenow` 100 and value text "104%…", Planned hidden with an empty plan, the over-limit swap (tile 2 = Onslaught, no tile 3), only the Campaign event tile while loading, and no reset tile.

## 5. Page and tour

- [x] 5.1 Create `today/today-controls.tsx` (inline chips, then project, Raids Filters, Planning settings; `today-controls`) and rewrite `today-page.tsx` to data hooks + `TodayControls` + `TodayGlance` + `TodayDashboard` + the settings dialog, deleting `TodaySchedule` and `BadgeStat`; verify `dailies-pages.test.tsx` and both `today-page.*.test.tsx` files pass after updating removed ids (`today-schedule`, `today-lanes`, `today-lane`, `bonus-lane`) and the removed "Today's raids" heading.
- [x] 5.2 Retarget `today.tutorial.tsx` per design decision 9 (`today-plan-area` for schedule; tiles for campaign event and energy), keeping one list for desktop and mobile; verify `dailies-tutorial.test.tsx` covers both step sets with the new targets in the same order.
- [x] 5.3 Add the new `dailies` keys in en, de, es and fr with real translations (`today.glance.label`, `today.glance.energyOver`, `today.glance.planned`, `today.glance.tokens_one/_other`, `today.planMeta_one/_other`, `bonus.meta`, `bonus.showLess`, `todaysAttempts.meta_one/_other`, `todaysAttempts.count_one/_other`, `todaysAttempts.rowLabel`) and remove `today.title` from all four; if a tour step's copy names the lanes or the header, update it in all four too; verify with the locale/translation tests and a grep for `today.title` returning nothing.

## 6. Checks

- [x] 6.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm --filter web build` and `git diff --check`; all pass.

## 7. Desktop verification (≥768px)

Data states: a synced account with Active goals and attempts today (populated), daily energy set below today's real spend in Planning settings for the limit case (restored afterwards), and a project with no Active goals. Use the Aspire stack and the signed-in browser session.

- [x] 7.1 At 2560×1255 (populated): four tracks, content capped at 2400px, the plan card's single goal group in 3 card columns, every card fully visible without scrolling (handoff §12); screenshot.
- [x] 7.2 At 1920×1080 (populated): the plan's first row, Bonus raids, Onslaught and Shops visible without scrolling, 2 card columns in the plan; screenshot.
- [x] 7.3 At 1440×900 with the section menu open and collapsed, and at 1024×768: two tracks where the content is between 42 and 84rem, controls wrap without truncation in German; screenshots.
- [x] 7.4 Limit case: the energy tile reads "Energy limit reached" in the over-limit colour, tile 2 shows Onslaught, Bonus raids fills the plan area with its caption and every entry; restore daily energy afterwards.
- [x] 7.5 Dailies › HSE on the same 2560 window still caps at 1600px; Plan › Schedule lays out as before.
- [x] 7.6 Tour end to end on desktop: every step highlights its target, including the schedule step at the limit.
- [x] 7.7 Light and dark theme at 1920: tiles, cards and the over-limit state are legible.

## 8. Mobile verification (<768px)

Same data states, emulated with a 390px and a 360px same-origin iframe in the signed-in tab (see `tp-manual-ui-verification`); confirm the mobile shell (bottom nav, section tabs) renders first.

- [x] 8.1 At 390×844 (populated): tiles stacked, then Plan, Bonus raids, Shops, Onslaught, Today's attempts in one column; controls in their mobile form; quick filter notes under the controls.
- [x] 8.2 At 360×780: no horizontal scroll anywhere on the page, the campaign event status wraps.
- [x] 8.3 Limit case on mobile: Bonus raids replaces the plan with its caption and every entry.
- [x] 8.4 Tour end to end on mobile: every step has a target.

## 9. Shared states

- [x] 9.1 With the project that has no Active goals: the plan card shows the no-goals state, Shops shows its no-goals state, and only the Campaign event tile is shown with tiles 1–3 following the readiness rules.
- [x] 9.2 With Raids Filters removing some materials: the filtered-out notice sits at the top of the plan card with Reset filters working.
- [x] 9.3 With nothing to buy today (or a project scoped so no offer matches): Shops shows the one-line state.
