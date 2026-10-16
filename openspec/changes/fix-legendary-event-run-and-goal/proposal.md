# Proposal

Apps half of the paired change `fix-legendary-event-run-and-goal` (companion API change in `tacticus-planner-api`, same name; the API half applies first). This change also carries an apps-only fix for the reward goal of an owned unit (F6). It is authored to be applied after `fix-legendary-event-kill-score` is archived: two of its delta requirements (`legendary-event-run-forecast`) are written on top of that change's text.

## Why

**Which run is next is wrong between runs.** The game sends `currentEventRun` as `null` between runs (all three events with synced progress on 2026-10-16), and the existing specs assume the opposite ("between runs, the synced `currentEventRun` is the run that last ended"). The code falls back to run 1, so on Uthar (runs 1 and 2 over) the Next token card says "for when run 1 starts", the forecast marks run 1 as Next with a full token supply and counts run 2's missions again in the reward outlook; team depths are stored under run 1. The API half now serves the announced run starts by run (index = run − 1), so the apps can derive current, ended and next runs without the game's run number.

**The reward goal ignores the unit.** The outlook picks the first ascension threshold above the event's shards counted from zero, so an unlocked unit is told to "Unlock" (Uthar: 15 chests, 17,500 points) where V1 and the game aim at its next step (Uthar already unlocked: Red 4★ at 120 shards, 4 chests, 14,750 points). The ladder data and arithmetic are the same in both apps; only the goal differs.

## What Changes

- A new capability, `legendary-event-run-resolution`, defines how the apps derive the current run, ended runs and next run from the run schedule, the current instant and the synced run (synced wins while the event is active), and what is shown when the run cannot be known (no number, one conservative "next run" block).
- The token supply, the Next token card's "for when run N starts", the reward projection's future runs, the clear-depth run and the hub's run assumptions read the resolved run instead of the synced run alone.
- The ascension goal in the reward projection, the Run status card and the run forecast starts from the event unit's current step (read from the synced roster) and counts the event's shards from there; an unowned unit still starts at Unlock.
- Worked examples gain the missing state (unit not owned) or a new owned-unit case (Uthar: 25 / 120 shards, 4 chests, 14,750 points).
- Not changed: lifecycle (active / upcoming / archived) derivation, run inputs storage, the ladder data, token supply figures per run (61 + 7), clear estimates.

## Capabilities

### New Capabilities

- `legendary-event-run-resolution`: derivation of an event's current, ended and next run from the run schedule, the clock and the synced run, with an explicit unknown state and the copy shown for it.

### Modified Capabilities

- `legendary-events-hub`: lifecycle assumptions about the run schedule and where the run number comes from.
- `legendary-event-run-forecast`: token supply run states between runs; the forecast's next step starts from the unit's current step.
- `legendary-event-reward-projection`: future runs follow the resolved run; the goal starts from the unit's current step; worked examples state the unit's ownership; a new owned-unit case.
- `legendary-event-teams`: the run a clear depth is read from and written to is the resolved run.

## Impact

- Code (`tacticus-planner-apps`, `apps/web/src/fsd`): `entities/legendary-event/lib/current-run.ts` (replaced by a resolver over lifecycle, schedule and synced run), `lifecycle.ts`, `reward-projection.ts` (`nextAscensionStep` gains the unit's current step), `features/legendary-event-tokens/lib/token-supply.ts`, `token-plan-view.ts`, `run-forecast.ts`, the Next token card, depth reads and writes in `features/legendary-event-teams`, `master-table.ts` and the event page view-model; `packages/game-catalog` schema doc comment for `eventStageStartDatesUtc` (shape unchanged).
- Copy: the Next token card's upcoming line and the forecast header for the unknown state in `public/locales/{en,de,es,fr}/legendaryEvents.json`.
- Tests and fixtures: lifecycle, token supply, forecast, reward projection, Next token card, teams depth, master table and the event page tests.
- Depends on the API half (served schedule) and on the product owner supplying the run dates of the four events; until then the schedule is empty and the unknown state shows. The owner supplied them on 2026-10-16 (Farsight 2025-12-28 and 2026-06-21, Uthar 2026-03-08 and 2026-10-04, Lysander 2026-08-30, Fabius Bile 2026-11-08), so after the API half ships Uthar and Farsight resolve to run 3 next and Lysander to run 2 next.
- The Home events widget and the hub row show the run from the synced entry only while active, as today; they are not changed.
