## Why

The plan wizard asks "What should Fabius Bile reach by the end of the event?", and the end of the event is run 3, often more than half a year away (Bile: about September 2027). Priorities change a lot over that time, so a target and an upgrade list for the whole event are hard to trust and confusing to read. Players also have no idea when the later runs of an event will be: only announced runs have a date anywhere in the app.

## What Changes

- The Target step plans to the end of one run, the **horizon**. A run picker (one option per run the plan still plays, each with its announced or guessed dates) sits under the heading, which reads "What should Fabius Bile reach by the end of run 1?". The default is the run in progress or the next run.
- Points targets count only the missions, bundles and close shards of the runs through the horizon; the ceiling is the forecast's ending points for the horizon run. Verdicts, recommended upgrades (which then only count if ready before a run up to the horizon), team swap offers, the potential maps, the Assumptions summary and the Review verdict ("By the end of run N") all follow the horizon.
- Each unannounced run gets a **guessed** start from the usual gap between runs (175 days: recent run-1-to-run-3 cycles took 350 days), never before the earliest estimate the planner uses. The guess is shown as "maybe ~May 2027"; the earliest estimate still decides when a recommended upgrade is ready for a run.
- The Target step names the horizon's end ("Run 1 ends Nov 15, 2026", or "Run 2 ends maybe around May 9, 2027 (guessed from past runs)") in place of the event deadline.
- Each hub row of an unfinished event lists its three runs with their dates, guessed ones marked "maybe".
- New and changed strings in `legendaryEvents` (`planWizard.target.*`, `runDates.*`, `hub.runs`, `hub.run`) in en, de, es and fr; the `planWizard.target.deadline*` strings are removed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `legendary-event-plan-wizard`: the Target step leads with the run picker and the horizon's end.
- `legendary-event-plan-generation`: points targets and the ceiling are computed to the end of the horizon run.
- `legendary-event-run-date-estimate`: unannounced runs also get a guessed start for display.
- `legendary-events-hub`: a row of an unfinished event lists every run's date.

## Impact

`entities/legendary-event/lib/reward-projection.ts` (optional `throughRun`), `pages/legendary-events/lib/run-dates.ts`, the plan wizard (`use-plan-draft.ts`, `plan-ceiling.ts`, `plan-evaluator.ts`, `target-step.tsx`, `teams-step.tsx`, `review-step.tsx`), the hub view model and card, locale files and tests. No API or data change; the horizon is not stored.
