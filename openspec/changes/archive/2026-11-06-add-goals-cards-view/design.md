## Context

See proposal.md for motivation. Current state:

- `GoalsList` (`pages/goals/ui/goals-board/goals-list.tsx`) picks `GoalsTable` or `GoalsMobileCards` from `useIsMobile()` alone.
- `GoalsMobileCards` holds two card forms: the full card (`<li data-testid="goal-row">` inside `<ul data-testid="goals-list-cards">`) and the collapsed reorder-mode card.
- Reorder uses `SortableList` (`shared/ui/sortable-list.tsx`), which hard-codes `verticalListSortingStrategy`.
- The drag handle is inline markup inside `goal-table-row.tsx`.

V1 reference: `tacticusplanner/src/fsd/1-pages/goals/goal-card/goal-card.tsx` (card) and `src/routes/goals/goal-section.tsx` (grid with `rectSortingStrategy`). Only the arrangement is reused; no V1 code or styling is ported.

## Goals / Non-Goals

**Goals:**

- One goal card used on every platform.
- A Table/Cards switch at every width with Cards as the default.
- The preference stored per device, with no flash on load.
- Full parity of table interactions in Cards view (select, menu, status toggle, reorder, Reached, season fit).

**Non-Goals:**

- V1's per-kind card bodies and V1 color coding (`PLAN-020`).
- A "Go to Raids" deep link (Today has no goal or unit filter).
- V1's up/down arrows.
- List virtualization.
- A density toggle (removed earlier; not reintroduced).
- Any change to the desktop table's columns.
- Any change to the mobile reorder-mode card.

## Decisions

### D1. The card is page-local and composed only from existing V2 parts

`GoalCard` (`goals-board/goal-card.tsx`) is a presentational shell with four regions (header, body, notes, footer) that renders the components the mobile card and the table already use:

- header: `Checkbox`, `GoalPriorityNumber`, the new `GoalDragHandle`, `GoalUnitIcon`, `GoalNameLink`, `EstimateCell`, `SeasonFitLabel`, `GoalProjectBadges`, `GoalRowActions`;
- body, in V1's row positions (figures at each row's right end, no separators): `GoalTargetDisplay` with the energy/token chips at the right end of its row, `CoveredByNote`, `GoalProgressDisplay`, `LevelRequirementLine` with the gold chip at the right end of its row, then the remaining `GoalResourceChips`. `GoalResourceChips` gains an `include` key filter so the card splits one chip set across these rows without duplicating per-kind chip rules;
- footer: `StatusBadge` with `onToggle` and `BlockedIndicator`.

The per-goal derivations the mobile card computes today (progress, remaining, energy, tokens, shop spend, XP-book figure, remaining text) move unchanged into a small `.ts` helper. The card is then a pure function of `row` plus precomputed props, and is memoized like `GoalRowCells`.

- Why page-local: only the Goals page renders goal rows, and the pieces it composes are already page-local (`goals-board/`, `shared/`). Promoting it to an entity or feature would drag page-level wiring (`actions`, `cascadeContext`, `projectRemoval`) with it.
- Alternative: keep `GoalsMobileCards`' card body and only add a grid wrapper, as the `PLAN-026` triage suggested. Rejected by maintainer decision: the V1 arrangement (status in the footer, projects in the meta line, ruled notes) is the point of the change.

V1 to V2 slot mapping:

```
V1 GoalCard                         V2 GoalCard
-----------------------------       -------------------------------------------------
grip + #priority                    Checkbox* + GoalPriorityNumber + GoalDragHandle*
40px portrait                       GoalUnitIcon (size-10)
title                               GoalNameLink
meta line (calendar date)           EstimateCell + SeasonFitLabel + GoalProjectBadges
GoalCardActions (edit/delete/up/dn) GoalRowActions (edit, pause/resume, project, delete)
per-kind body rows (figures right)  target row + energy/tokens right; progress bar;
                                    level row + gold right; remaining chips below
  Ascension body (orbs, shard bars) orb row; Shards / Mythic shards bars
                                    (owned/needed); no progress bar
  Ability body (costs + estimate,   cost row (badges, gold) + energy right;
  Active/Passive blocks, XP row)    full-width track blocks; level row; no
                                    progress bar
notes (left rule, 2-line clamp)     same arrangement, V2 tokens
status pill + pause/play            StatusBadge(onToggle) + BlockedIndicator
GoToRaidsButton                     dropped
bgColor color coding                REACHED_ROW_CLASS + seasonFitAccent
grid minmax(min(310px,100%),1fr)    minmax(min(380px,100%),1fr): wider rows
                                    * desktop only, or mobile select/reorder modes
```

The Ascension shard bars need owned/needed counts V2 did not keep: `ResourceNeed` only held the shards still to farm. `ascensionResourceNeed` now also returns `shardProgress` (the goal's own steps' gross shard cost and the owned shards applied to it), and `plan-net-resources.ts` overrides it with the plan's priority-ordered allocation, so the bar agrees with the plan's shortfall.

### D2. One grid component for every platform; the platform split lives in props

`GoalsCards` (`goals-board/goals-cards.tsx`) renders `<ul data-testid="goals-list-cards">` as a CSS grid with `[grid-template-columns:repeat(auto-fill,minmax(min(380px,100%),1fr))]` and `items-stretch`. Each card is `flex h-full flex-col` with its footer `mt-auto`, so footers line up across a grid row.

|             | Desktop (Cards view)                                                        | Mobile (<768px)                                                         |
| ----------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Columns     | auto-fill, 380px min                                                        | 1 (the min clamps to 100%)                                              |
| Checkbox    | always                                                                      | only in select mode                                                     |
| Drag handle | inline in the card header                                                   | none; reorder mode swaps in the collapsed reorder card list (unchanged) |
| Select-all  | `GoalsCardsSelectAll` bar above the grid (`data-testid="goals-select-all"`) | none; the select-mode bottom bar is unchanged                           |
| View toggle | in the filters row                                                          | in the control row, before the mode toggles                             |

The season cut-off renders as an `<li className="col-span-full">` with the existing `SeasonCutoffItem` content. The Actual/Potential legend renders once above the grid, in the same place on both platforms. `GoalsMobileCards` keeps only its reorder-mode branch; its full-card branch is deleted in favor of `GoalsCards`.

### D3. Grid reorder through a `strategy` option on `SortableList`

`SortableList` gains `strategy?: "vertical" | "grid"`, defaulting to `"vertical"` so existing callers don't change. `"grid"` maps to dnd-kit's `rectSortingStrategy` and keeps `closestCenter` collision detection and the keyboard sensor. Reorder semantics, the screen-reader announcements and `onReorder(orderedIds, movedId)` are unchanged, so `spliceGoalOrder` and the optimistic priority numbers work as they do for the table. This is the same combination V1 ships.

- Alternative: pass dnd-kit's strategy function straight through. Rejected, because it leaks `@dnd-kit` types into callers that don't otherwise import it.

### D4. Extract the drag handle

`GoalDragHandle` (`goals-board/goal-drag-handle.tsx`) takes the current table markup: a `button` with `GripVertical`, `aria-label` from `goals.columns.reorderHandle`, `data-testid="goal-row-drag-handle"`, the focus ring and `touch-none`. The table row and the card both render it, so the tour's desktop `reprioritize` step and the `goal-visual-accessibility` handle contrast apply to both views.

### D5. The view preference is per device and page-local

`pages/goals/ui/goals-board/use-goals-view.ts` holds the view under `goals.overview.view`, the same family as the Group and Season fit keys, through `safeStorage`. `useGoalsView()` returns `{ view, setView }`.

- It is a small `useSyncExternalStore` store rather than `usePersistedSelection`, because `GoalsLayout` (the width cap) and `GoalsPage` both read it, and two `usePersistedSelection` instances would not see each other's change.
- Anything but `"Table"` reads as `"Cards"`. A refused write keeps the choice in memory for the visit.
- The key has no `tp.session.` prefix: it is a browser preference, so sign-out keeps it, as it does Group.
- The read is synchronous, so the list needs no loading gate.

`GoalsList` renders the stored view at every width. Below the breakpoint, `GoalsTable` shows checkboxes only in select mode, because the bulk bar only exists there; passes no drag handle, because mobile reorders in its own mode; and yields to the collapsed reorder cards in that mode. Without a `view` prop (no toggle), it stays cards on mobile and table on desktop.

- The table is not redesigned for phones. Its columns stay and scroll sideways inside the shared `Table` wrapper. A compact phone table is a possible follow-up.
- Alternative: store the view on the account, the first version of this change. Dropped in review of the companion API PR: with the table on phones, one account-wide value would force one view on both, and the per-device store needs no API change.
- Alternative: a URL parameter like the other list controls (`goals-navigation`, "Goals list controls are URL state"). Rejected, because the view is a lasting personal preference, not a shareable filter. The spec says explicitly that it isn't URL state.

### D6. The view toggle

`GoalsViewToggle` (`goals-board/goals-view-toggle.tsx`) is a single-select `ToggleGroup` (`variant="outline"`, icon items `LayoutGrid` for Cards and `Rows3` for Table, tooltips, `aria-label`s), modeled on `widgets/account-menu/ui/theme-switcher.tsx`. It has `data-testid="goals-view-toggle"`. `GoalsToolbar` gains a `viewToggle` slot, placed at the end of the desktop filters row and before the mode toggles in the mobile control row.

### D7. Desktop and mobile tour targets

The desktop steps keep their targets in both views, because Cards view reuses `goal-row-drag-handle` and `goals-select-all`. A new `viewToggle` step (`tour.overview.steps.viewToggle`) targets `goals-view-toggle` on both platforms and comes right after the season-fit step. The other mobile steps are unchanged.

### D8. A spec mismatch resolved in passing

The shipped mobile card and the desktop table both already render `StatusBadge` with `onToggle` (a one-click Pause/Resume chip). The removed mobile-card requirement had a scenario forbidding "an inline pause control outside the menu". This change states the chip toggle explicitly, in the new card requirement and in the desktop table requirement, so code and spec match again. `goal-status-actions` (the menu item) is unchanged.

### D9. Performance

There's no virtualization. `GoalCard` is `memo`-wrapped and receives stable callbacks and per-goal props from maps keyed by goal id, the same pattern `goal-table-row.tsx` uses. `goals-list.drag-perf.test.tsx` gains a Cards-view case with 150 goals that asserts drag start and move don't re-render untouched cards.

## V1 parity checklist

| V1 element                                                                                                                                     | Decision                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Card arrangement (header / body / notes / footer, 380px auto-fill grid (V1: 310px; widened so each card has room for its rows), equal heights) | keep                                                                                                 |
| 40px portrait                                                                                                                                  | keep, using `GoalUnitIcon`                                                                           |
| `#priority` beside the grip                                                                                                                    | keep (`GoalPriorityNumber`, global priority)                                                         |
| Done-by calendar meta line with detailed tooltip                                                                                               | keep, as V2 `EstimateCell` with its own tooltip content                                              |
| Per-kind bodies (Ascend, Rank, Abilities, Unlock, Material, PreFarm)                                                                           | redesign: V2 body components, which already vary by goal kind; V2 has no Material or PreFarm goal    |
| Notes, ruled, 2-line clamp                                                                                                                     | keep                                                                                                 |
| Status pill with inline pause/play; Reached and Locked states                                                                                  | keep the behavior, with V2 `StatusBadge` and `BlockedIndicator` (Blocked or Restricted with reasons) |
| Reached green tint                                                                                                                             | keep (`REACHED_ROW_CLASS`)                                                                           |
| Color-coded background                                                                                                                         | drop (`PLAN-020`); season-fit accents take that role                                                 |
| "Go to Raids" button                                                                                                                           | drop                                                                                                 |
| Up/down priority arrows in the menu                                                                                                            | drop                                                                                                 |
| Table/Cards switch, Cards default                                                                                                              | keep; preference stored per device; V1 kept it in `viewPreferences.goalsTableView`                   |
| Type-cluster accordions around the grid                                                                                                        | not reintroduced; V2 Group (None/Type/Unit) covers it                                                |

## Risks / Trade-offs

- [`rectSortingStrategy` with a full-width divider `<li>` in the grid can preview oddly next to the divider] → The divider isn't a sortable item, and dnd-kit measures real rects. Cover it in `goals-season-fit.test.tsx` (the drop result) and in the manual desktop check, and accept the cosmetic preview as long as the committed order is right.
- [Without virtualization, a 150+ goal grid has more DOM than the table] → Memoized cards plus the perf test. Virtualizing a sortable grid is a known future step, not in scope.
- [Equal-height rows make a short card as tall as its tallest neighbour] → This is the V1 behavior and gives the footer alignment the layout depends on. Accepted.
- [The table is wide on a phone] → It scrolls sideways inside the list, the page itself doesn't, and Cards stays the default. Accepted for now.
- [The choice doesn't follow the account] → A player sets it once per browser. Accepted: it's what lets a phone and a desktop differ.

## Migration Plan

1. No API change and no data migration: every browser reads `Cards` until the player chooses.
2. Rollback: revert this PR. The stored key is then simply unused.
