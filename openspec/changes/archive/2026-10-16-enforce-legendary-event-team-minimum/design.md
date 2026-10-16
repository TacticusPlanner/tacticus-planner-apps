# Design

## Context

The editor saves when `canSaveDraft` finds at least one member and a valid name (`features/legendary-event-teams/model/team-editor-draft.ts`); the picker shows "n/5". Calculations read a lane's teams through several paths: `laneTeams(plan, laneId)` in the teams feature (used by the teams section and upgrade impact), `impactTeams` / `teamReaches` in `entities/legendary-event/lib/lane-teams.ts`, the token plan view, the master table and the suggestion state. Suggestions (`entities/legendary-event/lib/team-suggestions.ts`) build proposals of up to five candidates per one- or two-objective subset with no minimum. The API half enforces 3 to 5 on writes and leaves stored short teams readable and deletable. See proposal.md.

## Goals / Non-Goals

**Goals:**

- Make a team below three characters impossible to create or save, and unusable if it already exists.
- Keep one definition of "complete" for every consumer.
- Tell the user what to do with an existing short team.

**Non-Goals:**

- Deleting or auto-completing stored short teams.
- Changing the maximum, the reserve slot or the clear-estimate maths.
- Hiding the legacy team entirely (it stays visible so it can be fixed or deleted).

## Decisions

**D1. One predicate, applied at each consumer's team input.** `entities/legendary-event/lib/team-size.ts` exports `MIN_TEAM_MEMBERS = 3` and `isCompleteTeam(team)` (non-reserve member count at least 3). Each calculation filters its team list through it at the point it reads the plan: `impactTeams` (reachable points, upgrade impact, suggestion gains), the token plan view's team list, the master table's team set and estimates, the clear-estimate callers and the suggestion state's existing teams. Alternative: filter once in a `laneTeams` selector. Rejected: several consumers (token plan view, master table) read `plan.teams` directly, and the Teams section itself must still list the incomplete team; a single predicate with explicit call sites keeps the exception visible and testable.

**D2. The incomplete team is listed but inert.** The card shows the warning and no depth stepper (a depth write would be rejected by the API: the same members stay below three), keeps Edit and Delete and its order; its stored depth is kept so completing the team restores it. Alternative: hide it. Rejected: the user could not find or fix it.

**D3. Suggestions drop subsets, they never pad.** A proposal with fewer than three candidates would have to include a unit that does not satisfy the objective, which changes the covered objectives the proposal advertises. The suggestions requirement therefore skips such subsets. The worked example's Incisus-alone and Incisus-and-Calgar proposals disappear and the ranking is recomputed (Melee +945, Max 2 Hits +870, Ultramarines +811).

**D4. The editor explains instead of silently disabling.** A disabled Save with no reason is hard to read, so the count reads "n/5 · at least 3" and the message shows below three. The existing 400 handling covers any other API-side rejection.

**D5. Desktop and mobile share the rule and the copy.** The editor is a dialog on desktop and a bottom sheet on mobile; both show the same count and message in the footer area next to Save. No tour step changes (the Teams step copy does not mention a size).

## Risks / Trade-offs

- [A lane whose only team is incomplete suddenly shows "Add a team"] → That is the truth for the plan, and the card still shows the warning with Edit; the card and the Next token card point to the same fix.
- [Missing a consumer leaves an incomplete team in a calculation] → The predicate has one name and the tasks list every call site; a test per site builds a plan with a short team and asserts it is ignored.
- [Users with a V1 team of two lose it on import] → Reported with `team_too_small` and the remaining count in the import result.
- [Suggestions get fewer proposals] → Only proposals that are not valid teams disappear; the dialog empty state already covers "No team adds points".

## Migration Plan

No data migration. Ship after the API half. A client without this change would still show the short team and plan with it; the API only blocks new writes.
