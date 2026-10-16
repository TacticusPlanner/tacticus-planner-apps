# Tasks

Paths are under `apps/web/src/fsd` unless stated. Commands from the repository root (`pnpm --filter web exec vitest run <file>` for one file).

## 1. Objective filter and ranking

- [x] 1.1 Extend `features/legendary-event-teams/model/team-picker.ts` so `buildPickerTiles` (or a companion) takes the selected objective indexes: units satisfying every selected objective first (points per battle, objectives count, name), the rest after, and expose per-objective counts after the search and Only unlocked filters (spec: the picker filters and ranks units by objective; composes with the other picker controls). Verify: `team-picker.test.ts` asserts the Lysander Alpha Flying plus No Resilient example (Dante, 152, before a Flying-only unit), the unchanged order with no chip, counts that follow Only unlocked, and that no unit is removed by a chip.
- [x] 1.2 Add the objective chips (icon, label, score, count) to `ui/team-unit-picker.tsx` above the grid, dim non-matching tiles with an accessible description, keep dimmed tiles selectable, and reset the selection when the editor closes; add the strings to `public/locales/{en,de,es,fr}/legendaryEvents.json` with real de, es and fr translations. Verify: `team-unit-picker.test.tsx` covers the search plus chip, dimmed-unit pick and selection reset scenarios, and the locale files carry the keys in four languages.

## 2. Footer and Save and add another

- [x] 2.1 Check `shared/ui/responsive-dialog.tsx`: the footer must stay visible while the body scrolls on the dialog and the bottom sheet; fix it if not. Verify: `responsive-dialog.test.tsx` has a case asserting the footer is not inside the scrolling region.
- [x] 2.2 Rework the footer in `ui/team-editor-dialog.tsx` to show the count (and the minimum message from `enforce-legendary-event-team-minimum`), the covered objectives as compact read-only chips, the depth line (value, or the estimate marked "estimated") and Cancel, Save and Save and add another (new team only), reading the same draft as the body (spec: the editor keeps its summary and actions in view). Verify: `team-editor-dialog.test.tsx` asserts the footer content for a four-member draft, that unticking an objective in the body updates the footer, and that editing offers only Cancel and Save.
- [x] 2.3 Implement Save and add another: after a successful create, replace the draft with an empty one for the lane (name unset, depth null), keep the chips, Only unlocked, search text and Goals Preview, focus the search field, and keep the draft after a conflict or error (spec: save and add another builds teams in a row; `team-editor-draft.ts` gains the reset). Verify: tests cover the two-teams-in-a-row scenario, the unavailable state when Save is unavailable, and the failed-save scenario (draft kept, "not applied" message).
- [x] 2.4 Add the footer and action strings in four languages and check the mobile sheet (actions at least 44px, content above the safe area). Verify: locale keys present; a mobile-form test asserts the target sizes.

## 3. Hoisted editor and leaderboard action

- [x] 3.1 Move the single `TeamEditorDialog` out of `pages/legendary-events/ui/legendary-event/teams/teams-section.tsx` into a page-level host exposing `openTeamEditor({ laneId, memberUnitIds?, team? })` and restoring focus to the opener; Add team, Edit and Use this team call it (spec: leaderboard rows can start a team; the editor opens as for a suggestion). Verify: the existing teams-section tests pass against the host, and a test asserts focus returns to the Add team button after closing.
- [x] 3.2 Add **Add to new team** to `leaderboard/leaderboard-parts.tsx` (`LeaderboardRowActions`) with a lane item list for the Overview leaderboard (one item per lane that allows the unit, in lane order) and wire it in the lane table, the mobile cards and the Overview leaderboard through callbacks from the page; add the strings in four languages. Verify: leaderboard tests assert the lane-leaderboard, Overview (Alpha and Gamma, no Beta), locked-unit and mobile-card scenarios, and that the menu still opens Create goal.
- [x] 3.3 Update the lane leaderboard tour step copy to name Add to new team (keys `tour.<page>.steps.*` in four languages). Verify: the tour test passes and the copy appears in all four locale files.

## 4. Verification and documentation

- [x] 4.1 Run `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `pnpm test:run`. Verify: all four succeed.
- [ ] 4.2 On staging at 1280px and in a same-origin 420px frame, build two teams on Fabius Gamma with Save and add another using the Mechanical and Min 5 hits chips, then open Add to new team from the Overview leaderboard; delete the test teams afterwards. Verify: each behavior matches the spec scenarios and no console errors appear.
- [x] 4.3 Update `tacticus-planner-docs` (Legendary Event feature spec, team builder section) with the objective-first picker, the footer and Save and add another. Verify: the docs lint passes.
      Done in tacticus-planner-docs#15 (the docs repo has no lint; `git diff --check` is clean).

## Workflow follow-up

- Archive after staging is verified; revisit auto-fill and quick teams only on user feedback.
