## 1. Per-device preference

- [x] 1.1 Add `use-goals-view.ts` (`goals-board/`): a `useSyncExternalStore` store over `safeStorage` under `goals.overview.view`, anything but `"Table"` reading as `"Cards"`, a refused write kept in memory for the visit. Test the reads, that a change reaches every reader at once, and the refused write.
- [x] 1.2 Remove the account-stored version from this branch: restore `entities/planning-setting`, `schema.d.ts`, `api.json` and `api.ref` to `main`, and drop `goals.view.saveError`.

## 2. Shared plumbing

- [x] 2.1 Add `strategy?: "vertical" | "grid"` to `SortableList` (`"grid"` uses `rectSortingStrategy`, the default stays vertical). Add a test that grid mode reorders across rows with the same `onReorder(orderedIds, movedId)` output, and confirm existing callers are unchanged.
- [x] 2.2 Extract `GoalDragHandle` (`goals-board/goal-drag-handle.tsx`) from `goal-table-row.tsx`, keeping the `goal-row-drag-handle` test id, its aria-label and focus ring. Switch the table row to it and confirm the existing table and reorder tests still pass.

## 3. Goal card and grid

- [x] 3.1 Move the per-goal derivations from `goals-mobile-cards.tsx` (progress, remaining, energy, tokens, shop spend, XP-book figure, remaining text) into a `.ts` helper with unit tests that reproduce today's outputs for a Rank goal, an Ability goal, an Unlock goal and a Reached goal.
- [x] 3.2 Build a memoized `GoalCard` (`goals-board/goal-card.tsx`) with the V1 arrangement from design D1:
  - header: checkbox, priority, handle, avatar, name, meta line (estimate, season-fit label, project badges), "⋯" menu;
  - body: goal target, progress, level line, covered-by note, chips;
  - a ruled notes section clamped to 2 lines with a tooltip;
  - a ruled footer pinned with `mt-auto`, holding `StatusBadge` with `onToggle` and `BlockedIndicator`.

  Apply the Reached class and `seasonFitAccent`, and use only V2 tokens. Component tests should cover:
  - the slot order for an Active Rank goal with notes, projects and an estimate;
  - no notes section without notes;
  - no meta-line items without an estimate or projects;
  - a Reached goal (tint, check, "-" content, no handle);
  - the footer chip pausing the goal through the cascade;
  - checkbox and handle visibility controlled by props.

- [x] 3.3 Build `GoalsCards` (`goals-board/goals-cards.tsx`):
  - `<ul data-testid="goals-list-cards">` as a CSS grid (`repeat(auto-fill,minmax(min(380px,100%),1fr))`, equal-height rows), rendered through `SortableList strategy="grid"` when reorder is enabled;
  - the Actual/Potential legend once above the grid;
  - the season cut-off as a `col-span-full` `<li>`;
  - on desktop only, a select-all bar (`data-testid="goals-select-all"`, indeterminate state, selects all visible goals across groups).

  Tests: grid markup and test ids, the legend shown once, divider placement, select-all states.

- [x] 3.4 Reduce `goals-mobile-cards.tsx` to its reorder-mode branch and render `GoalsCards` for the normal mobile list, with checkboxes only in select mode and no inline handle. Update `goals-list.test.tsx` and the mobile tests so every card scenario that used to pass still passes, with the status chip now in the footer and project badges in the meta line.
- [x] 3.5 Extend `goals-list.drag-perf.test.tsx` with a 150-goal Cards-view case: starting and moving a drag doesn't re-render untouched cards.

## 4. View switch and page wiring

- [x] 4.1 Add `GoalsViewToggle` (`ToggleGroup`, outline variant, LayoutGrid/Rows3 icons with tooltips and accessible names, `data-testid="goals-view-toggle"`). Add a `viewToggle` slot to `GoalsToolbar`: at the end of the desktop filters row, and before the mode toggles in the mobile control row. Update `goals-layout`/toolbar tests.
- [x] 4.2 In `goals-page.tsx`/`goals-list.tsx`, render `GoalsCards` or `GoalsTable` from the stored view at every width. Keep the selection, filters, Group, scope and season-fit mode across a switch. Page tests:
  - a device with no stored view renders cards;
  - a stored `Table` renders the table;
  - toggling switches immediately and stores the choice;
  - the selection survives a switch;
  - at <768px: the toggle is in the control row, the table restores from this device, checkboxes appear only in select mode, there is no drag handle, and reorder mode shows the collapsed cards.
- [x] 4.3 Check reorder and bulk actions in Cards view with page-level tests:
  - dragging a card across grid rows saves the expected global order (A, B, C / D, E, F: F onto B gives A, F, B, C, D, E);
  - a keyboard move commits and is announced;
  - a drop across group boundaries isn't offered;
  - bulk Pause, Resume, Add to project and Delete act on the selection made from cards.
- [x] 4.4 In `goals-layout.tsx`, drop `PageContainer`'s 1600px cap (`max-w-none`) on the Goals tab in Cards view only; the Table view and the Projects/Insights tabs keep it. Test both cases in `goals-layout.test.tsx`.
- [x] 4.5 Match V1's Ascension and Ability card bodies: expose each Ascension goal's owned/needed shards (`shardProgress`, standalone in `ascensionResourceNeed` and plan-netted in `plan-net-resources.ts`) and render them as labelled shard bars under the orb row; give Ability cards a cost row (badges, forge badges, components, gold, energy at the end), full-width track blocks and a level row without gold; neither shows the general progress bar. Truncate long project names in the card meta line. Test each in `goals-cards.test.tsx`, `progression-cost-calc.test.ts` and `plan-insights-calc.test.ts`.
- [x] 4.6 Show ascension orbs and Character ability badges as available/needed chips (V1's "x/y"): the plan keeps each Character Ability goal's gross need beside the badge stock at its turn (`plan-ability-materials.ts`, paused goals via `withStandaloneAvailable`) and records each Ascension goal's `orbPool` (`plan-net-resources.ts`); `GoalResourceChips` renders both as pools. Test in `plan-insights-calc.test.ts` (including unchanged Insights shortfall) and `goal-resource-chips.test.tsx`.
- [x] 4.7 Carry the row menu priority moves and the just-moved highlight into the card: forward `menuMoves`, `onMenuMove` and `highlightedGoalId` through `GoalsCards`, compare `moves` in `sameRowSlice`, and cover both in `goals-cards.test.tsx`.

## 5. Tour and copy

- [x] 5.1 Add a `viewToggle` step after `seasonFit` on both platforms in `goals-page.tutorial.tsx`, and update `goals-page.tutorial.test.tsx` so every desktop step target resolves in both Cards and Table view.
- [x] 5.2 Add the i18n keys to `apps/web/public/locales/{en,de,es,fr}/common.json`: the toggle group and option labels (`goals.view.label`, `goals.view.cards`, `goals.view.table`), the cards select-all label if it differs from `goals.bulk.selectAll`, and `tour.overview.steps.viewToggle.{title,content}`. Write real de/es/fr translations at the quality of the sibling keys, and verify that the i18n key tests and type checks pass.

## 6. Gates

- [x] 6.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`, and verify that all pass.

## 7. Desktop verification (viewport at or above 768px)

Required data: a signed-in account on the Aspire stack with at least 7 Active goals across 2 projects (one Paused, one Reached, one Blocked or Restricted, one with notes, one Rank goal below its required level), a project with no goals, and a Battle Pass season-fit mode that produces a cut-off.

- [x] 7.3 In Cards view: per-card select, select-all (including indeterminate), a bulk action, the "⋯" menu items, the footer chip Pause/Resume, a drag across grid rows, a keyboard reorder, and 200% zoom without horizontal scrolling.
- [x] 7.4 The desktop tour runs through every step in both views, including the new view-toggle step.

## 8. Mobile verification (viewport below 768px)

Run this in a 420px same-origin iframe on the app origin (per the `tp-manual-ui-verification` skill), with the same data as section 7.

- [x] 8.1 In Cards view the list renders as single-column cards with the same slots, and the toggle is in the control row. In Table view the table scrolls sideways inside the list and the page itself does not.
- [x] 8.2 In both views: select mode (checkboxes and bottom bar), reorder mode (collapsed cards unchanged, the move saves, then back to the chosen view), the Pause/Resume chip, and the "⋯" menu all work.
- [x] 8.3 The mobile tour runs through every step, including the new view-toggle step.

## Deferred / out-of-session

Not run by hand before merge, by maintainer decision and without a tracking issue. The local data had no Reached goal, Blocked goal or notes, and a second browser needs its own sign-in. Automated tests cover the card states.

- 7.1 With no stored view in this browser, Goals opens in Cards view. Check the card slots against design D1, equal-height rows, footer alignment, the legend once above the grid, the Reached tint, the Blocked indicator tooltip, and the season divider spanning the grid.
- 7.2 Toggle to Table and back: the switch is immediate, the selection is kept, and a reload restores the choice. A second browser keeps its own view.
