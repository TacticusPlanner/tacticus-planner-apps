# Proposal

## Why

Players plan a project toward something specific: the end of the Battle Pass, the next Guild Raid or Guild War season, a particular Legendary Event run, or a date they pick. UserJot [Plan goals against an event or deadline](https://tacticusplanner.userjot.com/board/p/plan-goals-against-an-event-or-deadline) (In Progress, merged with [Enhancements for Project Organization and Goal Management](https://tacticusplanner.userjot.com/board/p/enhancements-for-project-organization-and-goal-management)) asks for exactly that. Today a project can only relate to a Legendary Event (`project-event-target`), with no run and no other kind. This change lets a project carry any of those targets and resolves each to one deadline instant. `add-project-deadline-fit` then uses that instant to show which goals make it.

Agreed with Severyn on 3 Nov (decisions 1 to 13 in the planning notes):

- Season targets can be rolling (the current or next season, which moves on by itself) or pinned to a season number.
- A Guild War target's deadline is the start of the chosen season. Battle Pass and Guild Raid deadlines are the end of the season.
- A Legendary Event target names a run (1, 2 or 3) or "next run". Its deadline is the start of that run.
- A custom date is a whole day, with no time.
- A rolling chip shows the season number it currently resolves to.
- A pinned target that has passed shows Ended with a "Move to next season" action. It never rolls forward on its own.
- The season picker offers the next 5 seasons.

## What Changes

- **Target kinds.** A non-Default project's target can be a Legendary Event (`eventId` plus `run` 1/2/3 or null for "next run"), a Battle Pass, Guild Raid or Guild War season (`season` number, or null for rolling), or a custom `date`. Companion: `tacticus-planner-api` `add-project-deadline-targets`, which applies first.
- **Related to picker.** The project form's Related to field becomes two steps: the kind (None, Legendary Event, Battle Pass, Guild Raid, Guild War, Date), then the detail (event and run, season, or date).
- **Deadline resolver.** A pure `resolveProjectDeadline(target, catalog, nowMs)` gives `{ deadlineMs, seasonNumber, estimated, ended }`. Season windows are reused from Season fit, and Legendary Event run dates from the LE pages. Both move to entity slices so this resolver and Season fit share them.
- **Chips.** Project cards show the target as "LE · Uthar R2", "LE · Uthar (next run)", "BP · S42 (rolling)", "GW · S29" or "Due · Nov 20". The tooltip gives the resolved date, and a passed pinned target reads "Ended".
- **Ended targets.** A passed pinned season or run target offers **Move to next season** (or **Move to next run**) in the project's row menu.
- **Plan wizard.** The Legendary Event plan wizard stores the run it plans for, instead of no run.

No **BREAKING** changes: existing Legendary Event targets read as "next run", and projects without a target are unchanged.

## Capabilities

### New Capabilities

- `project-deadline`: season and date targets, deadline resolution, chips for every kind, and the ended state.

### Modified Capabilities

- `project-event-target`: the Related to field has kinds and a run, and the LE chip names the run.

## Impact

- `entities/project` (target types, mapper, chip, `model/deadline/`), new `entities/game-event` (season windows moved from `features/goal-planning/model/season-fit/`), `entities/legendary-event` (`legendaryEventRunDates` moved from `pages/legendary-events/lib/run-dates.ts`), `features/project-management` (Related to field, row-menu action), `features/goal-planning` (Season fit imports the moved resolver), `pages/legendary-events` (plan wizard sends `run`).
- `common` `goals.project.*` i18n in en/de/es/fr; the Projects page tour.
- Companion API change `add-project-deadline-targets` (`POST/PUT me/projects`, `target` on project responses).
