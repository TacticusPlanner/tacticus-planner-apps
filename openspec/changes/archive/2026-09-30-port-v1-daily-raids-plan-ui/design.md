## Context

`raids-plan-page.tsx` currently renders `planDays` from `useDailyRaids()` as a wrapping CSS grid of shadcn `Card`s, each passing its entries through `RaidSchedule` (`layout="column"`, optional `compact`) → per-goal groups → `ResourceCard` with `LocationChips`. The engine emits one `RaidBreakdownEntry` per goal × resource × battle per day, and `resourceProgressByDay` holds `{ owned, target }` keyed by `dailyRaidResourceKey(goalId, resourceId)` at the start of each day. `useDailyRaids` already exposes everything the V1 card needs: `goalsById` (unit id/type/label, priority), `resourceLabels`, `resourceVisuals`, `locationsByBattleId` (campaign name, node label, icon), `attemptsLeftByBattle`, `dailyEnergy`.

Today is the only other consumer of `RaidSchedule`/`ResourceCard` and uses neither `compact` nor `layout="column"`.

V1 reference: `tacticusplanner/src/routes/tables/raids-day-strip.tsx`, `raids-day-filter-bar.tsx`, `fsd/3-features/goals/raids-day-view*.tsx`, `lib/use-drag-scroll`.

## Goals / Non-Goals

**Goals:**

- A display-only transform from the existing plan to material cells; no engine or hook contract changes.
- Plan UI stays page-local (only Raids Plan uses it).

**Non-Goals:**

- Reusing the new cell grid on Today.
- Virtualizing the strip beyond V1's lazy grid mounting.

## Decisions

### 1. Merge entries per day in a pure page-model helper

`pages/dailies/model/plan-day-cells.ts` exports `buildPlanDayCells(day, raids)` → `{ actionable: PlanCell[], raided: PlanCell[], unitIds }`, where `PlanCell = { resourceId, owned, target, units: DailyRaidGoalViewModel[] (distinct by unit, priority order), nodes: { battleId, raidsPerformed }[], goalIds }`.

- Group `day.entries` by `resourceId`; sum `owned`/`target` across the distinct goal ids found in that group using `resourceProgressByDay.get(day.day)`. Summing is valid because `allocatePlanInventory` partitions held inventory by priority (spec assumption).
- Order: first by the minimum goal priority the cell serves, then by the position the existing `groupEntries` resource ordering gives within that goal (stable sort over the entries' current order is enough, since the engine already emits in goal-priority order).
- Raided: `owned >= target`, or `day.day === 1 && nodes.every(n => attemptsLeftByBattle.get(n.battleId) === 0)` — reusing `isLocationVisible` semantics (unknown ≠ exhausted).
- Pure function → unit-tested with the Calgar/Tigurius Purity Seal example from the spec.

Alternative: extend `RaidSchedule` with a "grid" mode. Rejected — its goal-grouping, bonus-entry and emphasis logic is all Today-specific; a second presentation there would keep dead branches alive on both sides.

### 2. Page-local UI components

Under `pages/dailies/ui/plan/`: `plan-day-strip.tsx` (scroll container, lazy mount, Show-all tail, jump handling), `plan-day-card.tsx` (header + stats pills + energy bar + unit row + grid), `plan-material-cell.tsx` (cell + tooltip), `plan-unit-filter.tsx`. No new slice: nothing else consumes them (FSD: stays in `pages/dailies`). Reuse `ResourceIcon`, `UnitIcon`, `EntityIcon`, `energyIconUrl`, and `@workspace/ui` `Tooltip` (already supports tap-to-open on touch) and `Button`.

### 3. Drag scrolling

A small `useDragScroll` hook inside `pages/dailies/ui/plan/` handling mouse drag only (pointer type `mouse`); touch uses native overflow scrolling, which already provides momentum and doesn't fight vertical scrolling inside cards. A drag of more than a few pixels suppresses the following click so dragging over a cell or portrait doesn't activate it.

Alternative: port V1's hook as-is (it re-implements touch). Rejected — native touch scrolling is better on mobile and less code.

### 4. Lazy grid mounting

One `IntersectionObserver` on the strip (`root` = strip, `rootMargin` ≈ one card width horizontally) adds day indexes to a `Set` that only grows; days 1–3 are seeded. Headers always render so the strip width and jump targets are stable.

### 5. Fixed card height

A single CSS height token on the card (`h-[…]` in rem, tuned to show ~5 cell rows on desktop; on mobile capped against the viewport height with `max-h-[calc(100dvh-…)]` so the header and at least a couple of rows fit). The grid area is `min-h-0 flex-1 overflow-y-auto`.

### 6. Desktop vs mobile

Same structure on both forms (strip, same card). Differences: card width (desktop `min-w-[16rem] max-w-[21rem]`-ish, mobile `w-[85vw]` so the next card peeks), touch vs mouse drag (Decision 3), and tooltip trigger (hover/focus vs tap — handled by the shared `Tooltip`). Tutorial targets are identical on both forms, so one step list serves both.

### 7. Filter and jumps

Filter state (`selectedUnitId`) lives in `RaidsPlanPage` and is not persisted across navigation (V1 parity; defaults to none). Units and their first/last day are derived from all `planDays` via `buildPlanDayCells` actionable cells, so they cover unrevealed days. A jump to an unrevealed day sets `showAllDays` and stores a pending target, scrolled into view (`scrollIntoView({ inline, block: "nearest" })`) in an effect once that card exists.

### 8. Calendar date

`Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "long" })` on `today + (day - 1)`, the same local-date basis as `planSummary.completionDate`. No new translation strings for the date itself.

### 9. Removal

Delete `compact` state and the toggle, `plan.collapse`/`plan.expand` in all four locales, `compact`/`layout` props from `RaidSchedule`/`ResourceCard` (now unused), and the Plan-only test cases for them.

## V1 parity checklist

| V1 element                                                                         | Decision                                                                          |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Accordion title line (days, energy, raids, unused, date, Collapse cards)           | **Drop** — V2 stat tiles kept                                                     |
| Collapse/Expand cards                                                              | **Drop** — always expanded                                                        |
| Horizontal drag-scroll strip, `pr-2.5` gap                                         | **Keep** (mouse drag + native touch)                                              |
| Lazy grid mounting (`IntersectionObserver`, seed 3, ±340px)                        | **Keep**                                                                          |
| "Show All" at strip end                                                            | **Keep**                                                                          |
| Day card 260–340px, fixed 700px height                                             | **Keep** (rem equivalents, mobile viewport cap)                                   |
| Title "Today"/"Day N" + calendar date                                              | **Keep** (localized date instead of "1st of October")                             |
| Energy / raid-ticket pills, energy bar (≥95% success, else warning)                | **Keep**; icons: `energyIconUrl`, existing raid-attempt icon language             |
| Per-day character row                                                              | **Keep** (actionable cells only)                                                  |
| 3-column material grid, `owned/target` badge, 2 portraits + `+N`, `—` for no units | **Keep**; `—` never occurs in V2                                                  |
| "No goal" divider                                                                  | **Drop** — every V2 entry has a goal                                              |
| "Raided" divider and dimmed done cells                                             | **Keep**, rule per spec                                                           |
| Cell tooltip (label, units, 4 nodes, `+N more`)                                    | **Keep**, localized                                                               |
| Click cell → RaidMaterialDialog                                                    | **Drop** (follow-up)                                                              |
| Filter bar (40px portraits, pressed ring, dim others, ← Day X / Day Y → jumps)     | **Keep**                                                                          |
| Empty state (no raids)                                                             | **Keep V2's** existing `RaidState`                                                |
| Asset ids                                                                          | V2 catalog icons via `resourceVisuals`/`characterIcon`/`mowIcon`; no V1 asset ids |

## Risks / Trade-offs

- [Merged progress misreads if a goal's allocation isn't a partition] → covered by the helper unit test using the engine's real `allocatePlanInventory` output.
- [Fixed card height on short mobile viewports hides most of the grid] → viewport-based cap; manual check at 375×667.
- [Drag-to-scroll swallowing clicks on filter/jump controls] → drag listeners only on the strip, not the filter bar; click suppression only after movement threshold.
- [Many revealed days (40+) with large grids] → lazy mounting; grids never unmount, same as V1.

## Migration Plan

UI-only, V2 pre-production: ship directly; rollback is a revert.
