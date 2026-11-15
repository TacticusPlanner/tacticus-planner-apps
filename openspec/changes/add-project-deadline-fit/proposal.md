# Proposal

## Why

Once a project has a deadline, players want to see right away which of its goals will be done in time and which won't (UserJot [Plan goals against an event or deadline](https://tacticusplanner.userjot.com/board/p/plan-goals-against-an-event-or-deadline)). Season fit (`goal-season-fit`) answers a similar question for a whole season type, but not for a project's own target, and it can't name a Legendary Event run or a date.

Agreed with Severyn on 3 Nov (decisions 14 to 19 in the planning notes):

- Paused, blocked and unestimated goals count in neither number of "5 of 7 fit", and the header adds "· N not estimated".
- Reached and completed goals count as fitting.
- An ended target shows no per-goal labels.
- The unscoped Goals page shows no project fits.
- Accents reuse Season fit's colours.
- Cards on the Projects page and the home widget show the fit count from the full-plan run.

## What Changes

- **Deadline header.** On Goals scoped to a project with a target: "Deadline: LE · Uthar starts Nov 27 · 2 of 4 fit · 1 not estimated", or "All 7 done", or "Ended Nov 15".
- **Per-goal fit.** Beside Done By: "Fits" or "Misses by N d", with an accent. On track for fits, caution for a miss of 1 to 7 days, urgent for more.
- **Divider** before the first goal that misses, with Group None.
- **Season fit override.** In a targeted scope the Season fit select is replaced by a read-only "Using project deadline" chip. Unscoped Goals and untargeted projects keep the select.
- **Cards.** Targeted project cards on the Projects page and the home widget show "2 of 4 fit" next to their chip.
- When `add-move-project-goals` has landed, the header shows its **Move goals to top** button while any goal misses.
- **Legendary Event deadline first.** Today's targets are Legendary Events with no run. This change resolves them to the next run's start (the earliest estimate when unannounced), so the whole fit view ships with no API change. `add-project-deadline-targets` later adds season, date and run targets to the same resolver, and the fit view picks them up unchanged.

## Capabilities

### New Capabilities

- `project-deadline-fit`: header, per-goal fit, divider, ended state, card count.
- `project-deadline`: a Legendary Event target resolves to a run start (season and date kinds follow in `add-project-deadline-targets`).

### Modified Capabilities

- `goal-season-fit`: the select gives way to the project deadline in a targeted scope.
- `project-management`: targeted project cards show the fit count.
- `home-projects-widget`: targeted project cards show the fit count.

## Impact

- `entities/legendary-event` (`legendaryEventRunDates` moved from `pages/legendary-events/lib/run-dates.ts`), `entities/project` (`model/deadline/`, `useProjectDeadline`), `features/goal-planning` (new `model/deadline-fit/`, reusing Season fit's eligibility and completion instant), `pages/goals` (header, labels, divider, select override), `features/project-management` (card fit slot), `pages/home` (widget composes the fit count).
- `common` `goals.deadlineFit.*` i18n in en/de/es/fr; the Goals page tour.
- No API change and no dependency: it works on the Legendary Event targets that exist today. It ships before `add-project-deadline-targets`.
