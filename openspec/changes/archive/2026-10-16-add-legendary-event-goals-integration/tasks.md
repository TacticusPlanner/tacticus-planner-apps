# Tasks

No companion API change: goals, plans, the roster, `lre-battles` and `horde-mode-tiers` are already served. Independent of `add-legendary-event-token-plan` (Stage 4, apps PR #219); see the proposal for the files both touch.

## 1. Goal creation launcher

- [x] 1.1 Move `CreateGoalLauncherContext`, `useCreateGoalLauncher`, `LaunchCreateGoal` and `CreateGoalPrefill` to `entities/goal/model/create-goal-launcher.ts`, export them from `entities/goal/index.ts`, and switch `pages/goals` (provider, `goals-create-button.tsx`, `projects-list-page.tsx`, `prerequisite-prefill.ts`, `use-create-goal-prefill.ts`) and `app/layout/app-shell.tsx` to the entity import; verify the existing goal-creation and entry-point tests pass unchanged and `pnpm lint:fsd` passes (design D2).
- [x] 1.2 Add the Rank prefill (`rankEnd`, `appliedUpgradesEnd: 0`) and the unit-only prefill, and make `projectIds` optional with the existing no-context fallback; handle both in `use-create-goal-prefill.ts`; verify tests cover each scenario of the `goal-creation-entry-points` delta (Ascension, Rank, unit-only, Default project, changing the prefill).
- [x] 1.3 Add `entities/goal/ui/unit-goal-badge.tsx` (icon, tooltip and accessible text listing goals by kind and target); verify a component test covers one goal, several goals and none.

## 2. Entity: calculations

- [x] 2.1 Add `lib/goal-preview-roster.ts` (`previewRoster`, `LegendaryEventGoalTarget`); verify `goal-preview-roster.test.ts` covers the Tigurius worked example (11,295; 13,554; clears 7 from 67,770 vs 67,301.5 and 112,692.5), the Certus unlock (346; clears 2), a goal below the current state, equal-rank applied upgrades, and a unit without goals (spec `legendary-event-goals-preview`, design D3).
- [x] 2.2 Add `lib/reachable-points.ts` (`laneReachablePoints`); verify `reachable-points.test.ts` covers the worked example (0, 75, 140, 144, 146 = 505), overlapping teams (1,043), a partial high score, a lane with no synced record, a reserve and a muted stored objective that never count, and marks having no effect (design D4).
- [x] 2.3 Add `lib/upgrade-steps.ts` (`nextUpgradeSteps`); verify `upgrade-steps.test.ts` covers the Epic Gold1 cap, a Legendary Silver2 → Silver3 rank step with 0 upgrades, Unlock to the initial rarity's first step, and the last progression step (design D5).
- [x] 2.4 Add `lib/upgrade-impact.ts` (`laneUpgradeImpact` returning `UpgradeImpact`); verify `upgrade-impact.test.ts` covers every scenario of `specs/legendary-event-upgrade-impact/spec.md` with the intermediate values (37,534.8 → depth 5; 38,143.2 and 38,041.8 → depth 6; +148 rows in name order; the stored depth 4 → 5 at +146; the Melee overlap at 0; Certus unlock at 37,272.4 not listed), a unit in two teams, and a missing estimate (design D5).
- [x] 2.5 Add `lib/team-suggestions.ts` (`suggestLaneTeams`); verify `team-suggestions.test.ts` covers the worked example (653, 755, 830, 830, 819 and their ranking), the re-rank after saving the Melee team (420, 250, 200, 148), merging identical member sets, dropping a proposal equal to an existing team, Prefer units with goals and Only unlocked off (spec `legendary-event-team-suggestions`, design D6).
- [x] 2.6 Put the worked fixtures (Uthar Alpha points, the synced encounters, the roster at 8,792 / 9,299 / 9,806, battle 8's power 225,385) in `lib/clear-estimate.fixtures.ts` beside Stage 5's, and export the new libs and types from `entities/legendary-event/index.ts`; verify `pnpm lint:fsd`.

## 3. Feature: legendary-event-goals

- [x] 3.1 Add `features/legendary-event-goals/model/use-legendary-event-goal-targets.ts`: Active Character goals of kinds Unlock, Ascension, Rank and Ability for the event's allowed units, detail reads through `useQueries(goalQueries.detail)`, mapped to `LegendaryEventGoalTarget`, with `loading | failed | ready` and a "no active goals" flag; verify `use-legendary-event-goal-targets.test.tsx` covers each state, Paused goals ignored and units outside the event ignored (design D3, D8).
- [x] 3.2 Add `model/create-goal-prefill.ts` (leaderboard row and upgrade step → `CreateGoalPrefill`, plus "already in goals" for a step); verify tests cover each row of the `goal-creation-entry-points` delta.
- [x] 3.3 Add `ui/upgrade-impact-section.tsx` (`data-testid="legendary-event-upgrade-impact"` on the header): collapsed by default with the open state in `localStorage` (`legendaryEvents.upgradeImpact.open`, try/catch), derived summary, desktop rows and mobile cards, Create goal through `useCreateGoalLauncher`, "In goals", and every empty state; verify `upgrade-impact-section.test.tsx` covers each scenario of the "Upgrade impact section on a lane tab" requirement (design D5, D7, D8).
- [x] 3.4 Export the hook, prefill helpers, section and types from `features/legendary-event-goals/index.ts`; verify `pnpm lint:fsd`.

## 4. Feature: legendary-event-team-suggestions

- [x] 4.1 Add `model/use-team-suggestions.ts` (memoised `suggestLaneTeams` from the page's reads, toggles reset on close) and `ui/team-suggestions-dialog.tsx` (dialog on desktop, bottom sheet on mobile; toggles, three proposals, Show more up to ten, reason line, goal badges, `onUseSuggestion` prop; skeleton, no-proposal and disabled states); verify `team-suggestions-dialog.test.tsx` covers each scenario of the "Suggest teams dialog" requirement (design D6, D7).
- [x] 4.2 Export them from `features/legendary-event-team-suggestions/index.ts`; verify `pnpm lint:fsd` shows no import of `features/legendary-event-teams`.

## 5. Teams feature

- [x] 5.1 Let `TeamEditorDialog` open as a new team from initial members (in order) with coverage derived and the default name, and add `source` (`manual` | `suggestion`) and `suggestionRank` to `legendary_event_team_created`; verify `team-editor-dialog.test.tsx` covers saving and cancelling a proposal and the analytics properties (design D6, D9).
- [x] 5.2 Give the team picker a Goals Preview switch starting from a `goalsPreview` prop, preview tiles (owned state, rarity, rank, estimate, preview marker) from a preview roster prop, and goal badges from a goal-unit prop; verify `team-unit-picker.test.tsx` covers the "Picker starts from the page value" scenario and the badge.

## 6. Page wiring

- [x] 6.1 In `legendary-event-page.view-model.ts`, add the Goals Preview page state (off, shared, reset on leaving), the preview roster and the goal targets, and pass them to the leaderboards and the picker; verify `legendary-event-page.test.tsx` covers the preview scenarios of `legendary-event-goals-preview` (raised estimate, Only unlocked, shared across tabs, reset on leaving).
- [x] 6.2 Add the Goals Preview switch to `leaderboard-controls.tsx` (desktop row, mobile compact bar; disabled states), the preview marker and goal badge to `leaderboard-table.tsx` and `leaderboard-list.tsx` and the cross-lane leaderboard, and the row actions menu with Create goal on all three; verify `leaderboard.test.tsx` covers the `legendary-event-eligibility` delta scenarios and the badge and preview scenarios.
- [x] 6.3 Render the Upgrade impact section on lane tabs after Teams, and the Suggest teams button in the Teams section header and empty state, wired to the team editor through `onUseSuggestion`; verify the page test covers the lane order and opening the editor from a proposal.
- [x] 6.4 Analytics `legendary_event_goals_preview_toggled`, `legendary_event_create_goal_opened`, `legendary_event_upgrade_impact_expanded`, `legendary_event_team_suggestions_opened` through the existing entry point; verify a test asserts each event's properties (design D9).

## 7. Tour and i18n

- [x] 7.1 Add the `upgradeImpact` step after `teams` in `legendary-event.tutorial.tsx` (same target on both forms) and update the Teams and leaderboard step copy; verify the tutorial test lists the steps in order on desktop and mobile.
- [x] 7.2 Add to `legendaryEvents.json` (en/de/es/fr): `goalsPreview.*` (switch, marker, hints, unavailable), `goalBadge.*` (kinds and targets), `leaderboardActions.*` (menu, Create goal, header), `upgradeImpact.*` (title, summary, steps, team change, points, Create goal, In goals, empty states), `suggestions.*` (button, title, toggles, reason line, Use this team, Show more, empty and disabled states) and `tour.event.steps.upgradeImpact.*` plus the updated `teams` and `leaderboard` step copy, with real German, Spanish and French copy; verify `legendary-events-translations.test.ts` passes.

## 8. Platform-independent verification

Data states: a profile with a synced roster, an Uthar plan with two Alpha teams (one with a manual depth) and Active Rank, Ascension and Unlock goals for Alpha units; a profile with no goals; a profile with no teams on Beta; a catalog without `horde-mode-tiers` (fixture or local API override) for the estimates-unavailable states.

- [ ] 8.1 With the Aspire stack, turn Goals Preview on and confirm a unit with goals shows its target rarity, rank and estimate, and that points, team cards and Upgrade impact do not change.
- [ ] 8.2 Create a goal from an Upgrade impact row and from a leaderboard row menu, and confirm the sheet's prefill, the created goal on the Goals page and the badge on the event page without a reload.
- [ ] 8.3 Use a suggestion, save it, reload, and confirm the team persists and the remaining suggestions re-rank; cancel another and confirm nothing was saved.

## 9. Desktop verification (≥768px)

- [ ] 9.1 Leaderboard tables show the actions column and the Goals Preview switch in the controls row without horizontal scroll; the menu works with the keyboard.
- [ ] 9.2 The Upgrade impact section expands into rows with labelled Create goal buttons and remembers its state after reload; Suggest teams opens a dialog.
- [ ] 9.3 The tour's Upgrade impact step highlights the section header after the Teams step.

## 10. Mobile verification (<768px, same-origin iframe per the `tp-manual-ui-verification` skill)

- [ ] 10.1 Row cards show the three-dots button in the corner; the Goals Preview switch sits in the compact bar; nothing scrolls horizontally.
- [ ] 10.2 Upgrade impact cards are two lines with icon Create goal buttons; Suggest teams opens a bottom sheet with full-width Use this team buttons, and the team editor sheet follows.
- [ ] 10.3 The tour's Upgrade impact step scrolls its target into view below the sticky lane strip.

## 11. Gates

- [x] 11.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check`.

## Deferred / out-of-session

- Amend `tacticus-planner-docs` when archived: plan Stage 6 (gain from newly reached battles through lane reachable points, not Stage 4's token plan; marks ignored; preview never feeds the plan) and `product/features/lre-planning.md` Stage 6 requirements.
