## Why

Testers could not infer what Projects add beyond the goals list, why more than
one project would be useful (`GP-27`), or that a project holds a _selection_ of
goals rather than all of them (`GP-28`). Two things cause it.

First, a project used to silently _do_ something: goals created into a project
that was not the Current plan were born Paused. That was the only place a project
visibly changed anything, and it contradicted the product decision recorded in
`fix-project-membership-safety-and-assembly`'s `design.md` — **a project is a
filter, not a switch.** The companion API change removes that rule; this change
exposes its replacement, an explicit "start paused" choice at creation.

Second, nothing on the Projects surfaces says what a project is for. The
dashboard renders a "Current plan" heading with no explanation (`project-management`
already requires one and it was never implemented), and project detail shows a
goal count with nothing to compare it against, so a project reads as "the goals
list, again."

## What Changes

- Goal creation offers an explicit, visible "start paused" option, defaulting to
  off. With the companion API change, a created goal is Active whatever projects
  it is filed into unless the user chooses otherwise.
- The Projects dashboard states what a project is, why a user would keep more
  than one, and what Current plan actually changes — implementing the
  explanation `project-management` already requires and extending it to the
  purpose question `GP-27` raises.
- Project detail states that the project holds a selection of the account's
  goals, by expressing its goal count against the account total rather than as a
  bare number. Both sides of that ratio count non-archived goals, which changes
  the existing summary count from "every member" to "every non-archived member".
- Membership surfaces state that adding or removing a project changes only which
  projects contain the goal — not whether it is active. This is `GP-25`'s
  constraint, made a requirement so the rationale survives outside the backlog
  document.
- Projects list and project detail tour copy is reworded to match; no new tour
  steps are introduced anywhere, the goal-creation tour included — the
  start-paused control carries its own visible helper text, and
  `create-goal-sheet.tutorial.tsx` holds a single step about acquisition sources
  that this change has no reason to touch.
- **No new route, sheet, or data surface.** Every change is copy, one creation
  control, and one count already available from `goalQueries`.

## Capabilities

### New Capabilities

<!-- None. Every behavior here belongs to a capability that already exists. -->

### Modified Capabilities

- `project-management`: the dashboard's explanation requirement grows from
  "explain that Current plan supplies the default context for Dailies and
  Insights" to also stating what a project is and why several are useful; a new
  requirement makes project detail express its goal count as a selection of the
  account's goals.
- `goal-project-membership`: a new requirement that project membership never
  changes a goal's activation, and that membership surfaces say so.
- `goal-creation`: a new requirement for the start-paused option on the creation
  sheet.

## Impact

- **Code:** `pages/goals/ui/projects/projects-list-page.tsx` and its tutorial,
  `pages/goals/ui/projects/project-detail-page.tsx` and its tutorial,
  `pages/goals/ui/projects/goal-projects-field.tsx`, the goal-creation form
  (`pages/goals/model/goal-creation-form/use-goal-submit.ts` and the creation
  sheet), and `entities/goal`'s create request types.
- **i18n:** new and reworded keys under `goals.project.*`, `goals.create.*`,
  `tour.projectsList.*`, and `tour.projectDetail.*` in all four supported
  locales.
- **Companion API change:** `clarify-project-purpose` in `tacticus-planner-api`,
  which applies first. The shared contract surface is the `startPaused` field on
  `POST /me/goals` and `POST /me/goals/combined`.
- **Not touched:** project membership endpoints, Dailies and Insights project
  selection, the Overview project filter, and unit priority.
- **Sequencing:** `fix-project-detail-grouping` is mid-apply in this repo (19 of
  33 tasks done, with an untracked `project-detail-goals.tsx` in the working
  tree) and its delta replaces the project-detail header — the same region this
  change's summary and empty-state work edits. It must land first.
