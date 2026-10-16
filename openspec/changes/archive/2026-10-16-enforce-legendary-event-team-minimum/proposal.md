# Proposal

Apps half of the paired change `enforce-legendary-event-team-minimum` (companion API change in `tacticus-planner-api`, same name; the API half applies first). Authored to be applied after `fix-legendary-event-kill-score` is archived: its team-suggestions delta is written on top of that change's text.

## Why

A Legendary Event team cannot have fewer than three characters in the game, but the team editor saves one to five members, suggestions can propose a team of one ("Incisus alone"), and the V1 import brings in any size. Such teams then drive the token plan, clear estimates, upgrade impact and the master table as if they could be played; on the staging account one imported team (Uthar Alpha, two members, stored depth 5) already does. The apps specs even call partial teams first-class, which this change reverses.

## What Changes

- The team editor keeps Save unavailable below three non-reserve members and says why ("n/5 · at least 3", "A team needs at least 3 characters"); the reserve does not count.
- Suggestions propose only subsets with at least three candidates; the worked example loses its one- and two-unit proposals and its ranking shrinks to three.
- A stored team below three is **incomplete**: its card warns "Needs at least 3 characters", hides the depth stepper and keeps Edit and Delete; every calculation (token plan, reachable points, upgrade impact, suggestions, estimates, master table) ignores it; the Next token card treats a lane with only incomplete teams as having no team.
- The V1 import result explains a team skipped as too small (`team_too_small`) in en, de, es and fr.
- Not changed: the five-member maximum, the reserve slot, the "N/5" badge on valid teams, clear estimates for three- and four-member teams (the "Partial team" estimate scenario has three members and stays valid), any data (nothing is deleted or migrated).

## Capabilities

### New Capabilities

- `legendary-event-team-size`: the three-character minimum, incomplete teams and how they are shown and excluded from calculations, and the import result reason.

### Modified Capabilities

- `legendary-event-teams`: the editor's Save rule.
- `legendary-event-team-suggestions`: proposals need at least three candidates; the worked example, its ranking and the re-rank scenario follow.

## Impact

- Code (`apps/web/src/fsd`): `features/legendary-event-teams` (`model/team-editor-draft.ts` `canSaveDraft`, `ui/team-editor-dialog.tsx`, `ui/team-unit-picker.tsx` count text, the team card), `entities/legendary-event/lib` (a new `team-size.ts` predicate; `lane-teams.ts` `impactTeams`; `team-suggestions.ts`; `master-table.ts`; clear-estimate callers), `features/legendary-event-tokens/lib/token-plan-view.ts`, `features/legendary-event-team-suggestions/model`, `pages/legendary-events/ui/legendary-event/teams/teams-section.tsx` and `use-upgrade-impact.ts`, `features/v1-import` (`legendary-event-outcome-buckets.ts`).
- Copy: editor message and count, card warning, import reason in `public/locales/{en,de,es,fr}/legendaryEvents.json` and `common.json`.
- Tests: editor, picker, card, suggestions, token plan view, upgrade impact, master table and import result tests.
- Depends on the API half (400 for short teams, `team_too_small`).
- No tour change: the Teams step's copy mentions building teams, not their size; verified in the tasks.
