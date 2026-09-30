## Why

Raids Plan ported V1's Daily Raids data but not its layout: each day is a tall, goal-grouped list of resource cards with inline location chips, so a multi-week plan is slow to scan and hard to compare across days. V1's day strip — dense material-first day cards in a horizontal scroller with a character filter — is the layout players already use to read a plan at a glance, and it should be the Raids Plan presentation.

## What Changes

- Replace the wrapping grid of goal-grouped day columns with V1's horizontal, drag-scrollable **day strip** on both desktop and mobile. Grids mount lazily as cards approach the viewport.
- Rebuild each **day card** after V1: title ("Today" / "Day N") with its calendar date, energy and raid-attempt pills, a daily-energy fill bar, a row of the characters farmed that day, and a fixed height with an internally scrolling body.
- Replace per-goal groups and resource cards with a **3-column material grid**: one cell per material per day (merged across goals), a combined `owned/target` badge, and up to two unit portraits plus a `+N` overflow.
- Move each cell's location detail into a **tooltip** (material, related units, up to four nodes with raid counts, `+N more`). Plan no longer renders inline location chips.
- Replace the Day-1-only "Raided" split with V1's rule applied to every day: a cell is Raided when its combined need is already met at the start of that day, or (Day 1 only) every node it is scheduled on has zero real attempts left.
- Add V1's **character filter bar** above the strip: selecting a unit dims unrelated cells on every day and offers jumps to that unit's first and last scheduled day.
- Move "Show all days" from the summary area to the end of the strip (V1 placement).
- **BREAKING (V2 UI only):** remove the Collapse/Expand raid details density toggle; day cards are always expanded.
- Keep V2's five whole-plan stat tiles unchanged; V1's accordion title line is not ported.

Out of scope: the planning engine (remains goal-priority only — V1's "By total materials" order is not ported), V1's click-to-open material dialog, V1's "No goal" section (every V2 schedule entry belongs to a goal), and the Today tab.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `daily-raids-plan`: day columns become a V1-style horizontal strip of fixed-height material-grid day cards; per-goal grouping and inline location chips are replaced by merged material cells with tooltips; the Raided split applies to every day with V1's rule; "Show all days" moves to the end of the strip; the density toggle is removed; a character filter bar with day jumps is added.

## Impact

- `apps/web/src/fsd/pages/dailies/ui/raids-plan-page.tsx` — rewritten around the strip; density state removed.
- New Plan-only UI under `apps/web/src/fsd/pages/dailies/ui/` (day strip, day card, material grid, filter bar) and a small per-day merge helper.
- `raid-schedule.tsx` / `resource-card.tsx` — Plan-only props (`compact`, `layout="column"`) become unused and are removed; Today is unaffected.
- `raids-plan.tutorial.tsx` and `tour.raidsPlan.*` strings — steps updated for the strip and filter bar.
- `apps/web/public/locales/{en,de,es,fr}/dailies.json` — `plan.collapse`/`plan.expand` removed; new tooltip/filter/date strings added.
- Tests: `dailies-pages.test.tsx` Plan cases and `raid-schedule.test.tsx` compact/column cases.
- No API, persistence, or engine changes; no companion `tacticus-planner-api` change.
