# Tasks

Paths are under `apps/web/src/fsd` unless stated. Commands from the repository root (`pnpm --filter web exec vitest run <file>` for one file). Requires the API half for the staging checks in group 6.

## 1. The predicate

- [x] 1.1 Add `entities/legendary-event/lib/team-size.ts` exporting `MIN_TEAM_MEMBERS` (3) and `isCompleteTeam(team)` (non-reserve member count at least 3), exported from `entities/legendary-event/index.ts`. Verify: `team-size.test.ts` asserts 2 members (false), 2 members plus a reserve (false), 3 (true), 5 (true).

## 2. Editor rule

- [x] 2.1 In `features/legendary-event-teams/model/team-editor-draft.ts` make `canSaveDraft` require at least `MIN_TEAM_MEMBERS` non-reserve members. Verify: `team-editor-draft.test.ts` covers 0, 2, 2 plus reserve (false) and 3 (true).
- [x] 2.2 In `ui/team-editor-dialog.tsx` and `ui/team-unit-picker.tsx` show the count "n/5 · at least 3" and the message "A team needs at least 3 characters" beside Save below three, on the dialog and the bottom sheet (spec: a team needs at least three characters); add the strings to `public/locales/{en,de,es,fr}/legendaryEvents.json` with real de, es and fr translations. Verify: component tests assert the three editor scenarios (two members, third member, removing below three) on desktop and mobile layouts, and the locale files carry the keys in all four languages.

## 3. Incomplete teams

- [x] 3.1 In the team card (`features/legendary-event-teams/ui`) show the warning "Needs at least 3 characters" for an incomplete team, hide its depth stepper, keep Edit and Delete and the lane order, and have Edit open the editor with its members and Save unavailable (spec: a stored team below three characters is incomplete); localize the warning in four languages. Verify: card and section tests assert the Uthar two-member team scenario and the completion scenario (the stored depth for run 2 returns after saving three members).
- [x] 3.2 Filter `isCompleteTeam` at every calculation input: `entities/legendary-event/lib/lane-teams.ts` (`impactTeams`), `features/legendary-event-tokens/lib/token-plan-view.ts` (teams, empty-state selection), `entities/legendary-event/lib/master-table.ts` (In teams set, estimates), the clear-estimate callers, `features/legendary-event-team-suggestions/model` (existing teams) and `pages/legendary-events/ui/legendary-event/use-upgrade-impact.ts` (spec: incomplete teams are ignored by every calculation). Verify: one test per call site builds a plan whose only team is the two-member team and asserts it contributes nothing, that the Next token card reads "Add a team on Alpha to get a plan", and that `bloodIntercessor` is absent from the In teams master table.

## 4. Suggestions

- [x] 4.1 In `entities/legendary-event/lib/team-suggestions.ts` skip a subset with fewer than three candidates (spec: team suggestions per lane). Verify: `team-suggestions.test.ts` asserts the worked example (proposals Ultramarines +811, Max 2 Hits +870, Melee +945; none for Piercing or Max 2 Hits plus Melee; ranking Melee, Max 2 Hits, Ultramarines) and the re-rank scenario after saving Melee (+250, +191); the dialog tests follow.

## 5. Import result

- [x] 5.1 Map `team_too_small` (value = remaining count) in `features/v1-import/model/legendary-event-outcome-buckets.ts` and add its localized reason to `public/locales/{en,de,es,fr}/common.json` next to `empty_team` (naming the team and the remaining count). Verify: `import-v1-result.test.tsx` renders the "Melee, 2 remained" case and the locale files carry the reason in four languages.

## 6. Verification

- [x] 6.1 Check the Teams tour step copy for any statement about team size and update it (with its four-language keys) if one exists. Verify: the tour test passes and the step copy does not contradict the minimum.
- [x] 6.2 Run `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `pnpm test:run`. Verify: all four succeed.
- [ ] 6.3 On staging (API half deployed) at 1280px and in a same-origin 420px frame: Add team with two members cannot be saved and shows the message; Uthar Alpha's two-member team shows the warning, no depth stepper, and the Alpha plan says "Add a team on Alpha to get a plan"; completing it to three members restores its depth and the plan. Verify: each behavior matches the spec scenarios.
- [x] 6.4 In `tacticus-planner-docs`, update the Legendary Event feature spec (partial teams are no longer valid) and ADR 0008's note on partial teams if it has one. Verify: the docs lint passes and no document calls a team under three characters valid.

## Workflow follow-up

- Archive both halves together after staging is verified.
