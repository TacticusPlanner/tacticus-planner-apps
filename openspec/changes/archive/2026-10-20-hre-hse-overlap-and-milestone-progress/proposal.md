## Why

Severyn's feedback on the HRE and HSE tabs:

- An HSE can run during an HRE. The HRE suggestions should take it into account so the player progresses in both.
- HSE progress in the game restarts at 0 after each milestone (0/20, 0/20, 0/25 and so on). The HSE projection asked for a cumulative total, which the game never shows.
- The project selector, Raids Filters and Planning Settings controls should go from the HRE and HSE tabs.

## What Changes

- While a rule-bearing HSE runs, HRE suggestions of equal energy cost are ordered by that event's points per raid first. Rows show the event points their raids earn, and the note names the event.
- The HSE projection's "points so far" input becomes two inputs: milestones done (repeats count past the last) and points in the current milestone, shown against its points. Points so far are derived and shown as a total.
- The progress is stored under a new key (`tp.dailies.hse.progress.v2`). The old cumulative totals are not migrated; V2 is pre-production.
- The HRE and HSE tabs drop the project selector, Raids Filters and Planning Settings controls. Their lists still use the settings chosen on Today.

## Capabilities

### Modified Capabilities

- `hre-campaign-raids`: the running HSE's tie-break and no raid header controls.
- `hse-points-projection`: milestone-based progress inputs.
- `daily-raids-home-screen-event`: no header controls.

## Impact

- `features/daily-raids`: `mission-raids.ts`, `plan-hook-mission-raids.ts`, `use-daily-raids.ts`, the HRE raids UI and the `hre` locales.
- `features/home-screen-event-points`: `hse-milestones.ts`, `hse-event-points.ts`, `use-hse-projection-inputs.ts`, the projection UI and the `dailies` locales.
- `pages/dailies`: `hre-page.tsx` and `hse-page.tsx` lose the header controls.
