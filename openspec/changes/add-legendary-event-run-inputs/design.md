# Design

## Context

- The event page renders the Run status card on the Overview tab from the synced `lre-progress` entry (`currentPoints`, `currentCurrency`, `currentClaimedChestIndex`, `currentShards`, `currentEventRun`, `extraCurrencyPerPayout`) and the next points milestone from `lre-common` via `useLegendaryEventCommon` and `lib/next-points-milestone.ts`.
- Stage 2 put the plan behind TanStack Query: `entities/legendary-event/api/*` (plan DTOs, functions, `legendaryEventPlanQueries`), and `features/legendary-event-teams/model/use-legendary-event-plan.ts`, which serialises writes through a queue ref, adopts the returned plan with `setQueryData`, and on a 409 adopts `details.plan` with a "reloaded" toast.
- V1 `LeProgressService.computeProgress` (tacticusplanner `src/fsd/1-pages/plan-lre/le-progress.service.ts`) is the source. Its synced path: base currency = sum of costs of claimed chests + currency in hand; target chests = `ceil((threshold − ohSoClose) / shardsPerChest)` for the first ascension threshold above current shards; currency left = target chest cost − missions − premium missions − bundle − base; drain points milestones above current points (payout + 15 when premium) until covered. Its spec (`le-progress.service.spec.ts`, Dante ladder, no run inputs) pins 13,000 and 12,500.
- V1 counts mission and bundle currency for every run on top of the synced base. Synced currency already contains whatever missions and bundles paid out, so for runs that have started this double counts.
- Companion API: plan `runs[]` (`run`, `regularMissions`, `premiumMissions`, `bundlePurchased`, `closeShards`, `updatedAt`), `PUT …/runs/{run}` with `expectedRevision`, unchanged values keep the revision; plan `annotations[]` (`laneId`, 0-based `battleIndex`, `objectiveId` 0 defeat-all / 1–5 objective index + 1, `status` `maybeClear` | `stopHere`, `updatedAt`) and `PUT …/annotations` (`{ expectedRevision, laneId, battleIndex, objectiveIds, status | null }`, one battle per call, unchanged keeps the revision); `lres[].rewards` with `pointsMilestones`, `chestsMilestones`, `progression`, `shardsPerChest`; `lre-common` removed.

## Goals / Non-Goals

**Goals:**

- A projection that is explainable in one line per figure, built on synced facts, with V1 parity where V1 is right.
- Inputs that take seconds to enter and never conflict with team edits in another tab.
- One canonical projection result that every surface (card now, Stage 4 forecast later) reads.
- V1's Maybe clear / Stop here reminders, kept on battles not yet cleared and never in conflict with sync.

**Non-Goals:**

- Token plans, run-end forecasts or "what you'll end this run with" (Stage 4).
- Notes UI.
- Using marks in token selection (Stage 4) or showing them outside the progress grid.

## Decisions

**D1. Slice ownership.** `entities/legendary-event` owns: `lib/reward-projection.ts` (`projectRewards(input): RewardProjection`, pure), `lib/next-points-milestone.ts` (now takes the event's `rewards`), plan types, the run write function `updateLegendaryEventRunInputs(eventId, run, body)` and the annotation write `updateLegendaryEventAnnotations(eventId, body)`, and a shared `model/use-plan-write-queue.ts` (the queue, adopt-on-success and 409 adoption currently inside the teams feature, moved down unchanged). `features/legendary-event-teams` keeps its mutations on top of the shared queue. New `features/legendary-event-run-inputs` owns `model/use-run-inputs.ts` (draft per run, debounced save, paid-options toggle through the existing `updateLegendaryEventPlan`) and `ui/run-inputs-drawer.tsx`. New `features/legendary-event-annotations` owns `model/use-annotations.ts` (mark a cell or a battle through the shared queue) and `ui/annotation-menu.tsx` / `ui/battle-annotation-menu.tsx`. `entities/legendary-event/lib/applicable-annotations.ts` (pure) maps the plan's annotations and the synced lane to the marks in effect, dropping any on a cleared cell; Stage 4 reads the same function. The page wires the drawer to the Run status card and the menus into the progress grid. Pages import features through their `index.ts`; the three features never import each other.

**D2. Projection algorithm (canonical result).** Input: the event's `rewards`, the synced entry (or none), the plan's `runs`, `showPaidOptions`, and the current run `r` (`currentLegendaryEventRun`: synced `currentEventRun` clamped to 1..3, or 1 with no entry). Steps:
1. Base from sync (zeros with no entry): points `P`, currency in hand `C`, chests claimed `K` (`currentClaimedChestIndex`, −1 read as 0), shards `S`.
2. **Future runs** are runs `> r` when a synced entry exists, and all runs 1–3 when none exists (nothing has been collected yet). Only future runs contribute mission, bundle and close-shard inputs; runs `≤ r` are already reflected in synced currency, chests and shards. When `showPaidOptions` is off, premium missions, bundle and close shards are treated as 0.
3. Per future run: mission currency = (regular + premium) × (25 + 15 if premium > 0); bundle currency = 300 + 15 if premium > 0, when bought; close shards as entered.
4. Ascension thresholds are cumulative sums of `progression` (`unlock`, `fourStars`, `fiveStars`, `blueStar`, `mythic`, `twoBlueStars`). Goal = first threshold above `S + futureCloseShards`; none → `fullyAscended`.
5. Chests to go = max(0, `ceil((goalThreshold − S − futureCloseShards) / shardsPerChest)`); chests required (total) = `K + chestsToGo`. Shards in hand count as held, whatever their source, so claimed chests never cover more than the shards actually held. More than the ladder's chest count → `beyondChestLadder` (the goal cannot be reached this event).
6. Currency required = Σ `engramCost` of chests 1..chestsRequired. Already collected = Σ cost of chests 1..K + `C`. Currency from points = required − collected − future mission currency − future bundle currency.
7. Per-payout bonus = synced `extraCurrencyPerPayout` when > 0; otherwise 15 when the current run's stored `premiumMissions` > 0 and paid options are on; otherwise 0.
8. If currency from points ≤ 0 → `affordableNow` (points to go 0). Otherwise walk `pointsMilestones` with `cumulativePoints > P`, subtracting `engramPayout + bonus`; the first milestone that brings it to ≤ 0 is the target. Ladder exhausted → `beyondPointsLadder` with the currency still missing.
9. Average battles per lane = target `cumulativePoints` ÷ 3 ÷ 500, one decimal (V1's figure: full battles per lane, from zero, at 500 points per battle).

Result shape (the single structure surfaces read):

```
RewardProjection {
  base: { points, currency, chestsClaimed, shards }
  goal: { step: "unlock"|"fourStars"|"fiveStars"|"blueStar"|"mythic"|"twoBlueStars",
          threshold, shardsTowardStep, stepSize } | { step: "fullyAscended" }
  chests: { required, toGo } | { beyondChestLadder: true, required }
  currency: { required, collected, futureMissions, futureBundles, fromPoints }
  points: { state: "affordableNow" } |
          { state: "milestone", milestone, cumulativePoints, pointsToGo, averageBattlesPerLane } |
          { state: "beyondPointsLadder", currencyShort }
}
```

**D3. Deliberate deviations from V1, each pinned by a test.** (a) V1 adds every run's mission and bundle currency on top of the synced base; V2 adds only future runs (D2.2), because synced currency already contains what started runs paid out. (b) V1 subtracts every run's close shards from the threshold and ignores synced `currentShards`; V2 uses synced shards and adds only future close shards. (c) V1 reports a milestone even when the currency is already covered; V2 says `affordableNow`. (d) V1 returns the last milestone when the ladder runs out; V2 says `beyondPointsLadder`. With no run inputs and no synced shards beyond chests, V2 equals V1, so V1's two spec cases are ported as parity fixtures against the Dante ladder copied into the fixture.

**D4. Inputs persistence.** Each run block holds a local draft; a change shows at once and is saved 600 ms after the last change in that run as one `PUT …/runs/{run}` through the shared write queue, sending the cached revision. The server keeps the revision for unchanged values, so blur-saves cost nothing. On a 409 the queue adopts the plan from the body (existing toast) and the drawer re-seeds its drafts from the adopted plan. The paid-options switch writes the plan through `updateLegendaryEventPlan` with the current `notes` unchanged. Inputs are editable for all three runs at any time (a user may plan run 3 ahead); the current run is marked "Now", earlier runs "Done", later runs "Planned".

**D5. Desktop and mobile split.** Desktop: the drawer is a right-side `Sheet` (420px) next to the card, the three runs stacked, number fields with − / + steppers. Mobile: a bottom `Sheet` at 90% height with the same stacked blocks; steppers sized for touch. The Inputs button sits in the Run status card header on both forms (`data-testid="legendary-event-run-inputs"`); the tour step targets that button on both, so no split selectors.

**D6. Display on the Run status card.** Below the synced figures, a "Reward outlook" block: "Next: Unlock · 250 / 400 shards", "6 more chests (3,350 currency in total)", "5,000 points to reach 10,000 · about 6.7 battles per lane", and a disclosure "How this is worked out" listing the base, future mission and bundle currency, and the per-payout bonus in one line each. States: `fullyAscended` → "Every reward step reached"; `beyondChestLadder` → "Not reachable this event (needs N chests, the event has M)"; `affordableNow` → "Enough currency for the chests now"; `beyondPointsLadder` → "Points alone can't cover it: N currency short"; no synced entry → the outlook from zeros with a "No synced progress yet" note; rewards not loaded → skeleton; catalog read failed → the outlook is hidden with the card's existing failure note. The milestone line keeps its Stage 1 copy but reads the event's ladder.

**D7. V1 import copy.** Part description: "Hand-built teams, notes and per-run mission and pack inputs for events the planner knows; not progress." Outcome line for `inputs_imported`: "<event>: inputs imported (N runs)"; `imported` with run inputs adds "· N runs of inputs". Issues get translated reasons: `run_input_clamped` ("Run 2 regular missions reduced from 12 to the event's 10"), `unknown_run`, `existing_run_inputs_kept`. `inputs_imported` buckets as imported. Marks: "· N marks" on the outcome line; issues `unknown_battle` ("A mark on Alpha battle 19 was skipped: the lane has 18 battles"), `existing_annotations_kept` ("N marks already in the planner were kept"), and `unknown_objective` / `unknown_lane` without a team name ("A mark on an unrecognised objective 'Psyker' in Alpha was skipped").

**D8. Analytics.** `legendary_event_run_inputs_saved` (eventId, run, regularMissions, premiumMissions, bundlePurchased, closeShards) once per saved write; `legendary_event_paid_options_toggled` (eventId, on); `legendary_event_annotation_set` (eventId, laneId, battleIndex, cellCount, status or null, scope `cell` | `battle`).

**D9. Maybe clear / Stop here marks (Severyn, 2026-10-10: keep them, only for uncleared battles).**
- Granularity is V1's: one mark per objective cell of a battle, plus a battle-row action for the common "stop at battle 12" case, which marks every not-cleared cell of that battle in one write.
- "Only uncleared": `applicableAnnotations(annotations, syncedLane)` keeps an annotation only when its cell is not in that battle's `objectivesCleared`. Everything (grid, legend counts, later the token plan) reads that result, so a mark disappears the moment sync clears its cell, and a complete battle has no marks and no row action. Nothing is written when that happens; the stale row stays on the plan, ignored (API design D6), so syncs never bump the plan revision.
- Controls: a not-cleared cell is a button opening a three-item menu (Not marked, Maybe clear, Stop here) with the current choice checked; desktop uses a popover anchored to the cell, mobile the same menu with 40px rows. The row action is a "⋯" button at the end of a desktop row and the battle-number button on a mobile row; its menu has Maybe clear, Stop here and Clear marks. Cleared cells stay plain indicators.
- Icons and colours follow V1 (`CircleQuestionMark` with `text-(--warning)`, `CircleMinus` with `text-(--danger)`), always with accessible text.
- Writes: optimistic, one `PUT …/annotations` per action through the shared queue; 409 adopts the plan; other errors roll back with a toast.
- Where the grid shows its empty body (no synced entry for the event, or a null lane) there are no cells, so no marks; a lane not started yet cannot be marked in this change.



## Risks / Trade-offs

- [The current run's remaining missions are not in the projection] → by D2.2 a mission still to do this run is invisible until it pays out and syncs; the outlook says "Counts what you've already earned this run plus your plans for later runs" in its disclosure. A future "remaining this run" input is cheap to add if users ask.
- [Synced `currentShards` semantics] → if it turns out to exclude close shards already awarded, `N` undercounts slightly; the parity fixture plus a manual check against the in-game shard count on a live account catch it.
- [Removing `lre-common` touches the shipped card] → regression test on the card's milestone line with event-specific ladders.
- [Marks on lanes with no synced progress are not possible] → the grid has no cells there today; adding an empty grid for a not-started lane is a small follow-up if users ask.
- [Moving the write queue out of the teams feature] → teams hook tests run unchanged as regression; FSD validator checks the new import.

## Migration Plan

Client-only after the API change. The catalog package drops `lre-common` from its dataset list and IndexedDB storage; the next manifest sync removes the stored record. No data migration.

## Open Questions

- None. `MaybeClear` / `StopHere` are kept, limited to cells not yet cleared (D9).
