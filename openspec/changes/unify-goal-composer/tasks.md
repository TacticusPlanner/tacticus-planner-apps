# Tasks

Builds on `polish-goal-dialogs`, implemented on the same branch. Archive `polish-goal-dialogs` before this change, because both modify the same `goal-creation` requirement.

## 1. Shared goal cards (D1)

- [ ] 1.1 Create `ui/goal-card/` with `RankGoalCard`, `AscensionGoalCard`, `AbilityGoalCard`, `UpgradeGoalCard` and `UnlockGoalCard`, using the props from D1. Move the per-kind field tests from `create-goal-sheet.test.tsx` and `goal-edit-dialog.test.tsx` to card tests, in both `mode`s. Verify that the card tests cover the target-reached message, the Upgrade quantity row message, and that milestones and prerequisites are absent in edit.
- [ ] 1.2 Switch the create dialog to the cards (a kind-to-card map in place of the `GoalTypeCards` switch), one kind at a time. Verify that `create-goal-sheet.test.tsx` passes after each kind.
- [ ] 1.3 Switch the edit dialog to the cards, and delete `GoalTargetFields`, `goal-type-fields.tsx`, `ability-goal-fields.tsx` and `upgrade-goal-fields.tsx`. Verify with `goal-edit-dialog.test.tsx`, plus a test asserting the same message text in both dialogs for one invalid Ascension target.

## 2. Target ladder (D2)

- [ ] 2.1 Build `TargetLadder` with a radiogroup, tier groups, Current, taken and selected states, the range highlight, roving tabindex and `aria-disabled`. Verify with unit tests:
  - the Incisus fixture (Gold II start, Gold III and Diamond I taken);
  - right arrow then Enter from Diamond II;
  - a stored below-start target.
- [ ] 2.2 Use the ladder in the Rank and Ascension cards, with the range and cost line read from `preview`, including its loading and failed states. Keep the additional target under it. Verify with card tests for the range text update and the loading state.

## 3. Ability stepper (D3)

- [ ] 3.1 Build `AbilityLevelStepper` with bounds, "Next", "+5", "Rarity cap" and the range message, and use it for both tracks in the Ability card. Verify with tests:
  - Legendary at 35 gives 36, 40, 50;
  - "Rarity cap" is hidden at 50, and "Next" there gives 51;
  - decrease is unavailable at the start, which reads as no change;
  - raising one track only is valid;
  - a typed 61 shows the range message.

## 4. Mobile step flow (D4)

- [ ] 4.1 Add `mobileStep` to `CreateGoalSheet`, with the step indicator (`aria-current="step"`) and step containers. Start at Goals when the launch carries a unit. Verify with tests (`useIsMobile` mocked): a plain launch starts at Unit; a Legendary Event prefill starts at Goals; desktop shows no indicator.
- [ ] 4.2 Mobile footer: Close or Back, then Next or Create goal. Next on Goals is disabled while there are issues or no kind is enabled, with the issue summary beside it. Verify with tests for Upgrade without a material, for no kind, and that values survive Back.
- [ ] 4.3 Remove the polish change's mobile placement of "Create paused" and "Create another goal" above the review, which the Review step now holds. Verify that the tests for 4.1 and 4.2 cover that placement.

## 5. Tours and i18n (D5)

- [ ] 5.1 Update `create-goal-sheet.tutorial.tsx`:
  - add ladder and step-indicator steps on desktop and mobile;
  - add mobile `before` hooks that set `mobileStep` for steps on other composer steps.

  Update `goal-edit-dialog.tutorial.tsx` so its target step points at the ladder. Add the `tour.*` keys in en/de/es/fr. Verify with the updated `.tutorial.test.tsx` files.

- [ ] 5.2 Add every new UI string to `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations:
  - ladder states (Current, Already a goal, selected), the range line;
  - stepper labels and quick picks;
  - step names, Back, Next, the step indicator's accessible text.

  Verify with the i18n parity check and no English text in de/es/fr.

## 6. Desktop verification (≥768px, 1280×880, signed-in Aspire stack)

The data states come from the current local account:

- Incisus is at Gold II, with Rank goals at Gold III and Diamond I;
- Arjac has a Rank goal;
- Toth has an Ascension goal;
- Z'Kar has a MoW Ability goal;
- Shiron has an Upgrade goal.

- [ ] 6.1 Create for Incisus: the Rank ladder fits without scrolling; Gold III and Diamond I show as taken; keyboard selection works; the cost line updates.
- [ ] 6.2 Create Ability for a Legendary unit: the quick picks and bounds match 3.1.
- [ ] 6.3 Edit Arjac, Toth, Z'Kar and Shiron: the same controls and messages as in create, and no creation-only controls.
- [ ] 6.4 Run the create and edit tours at 1280px and confirm every step resolves.

## 7. Mobile verification (<768px, 390×780 same-origin iframe)

- [ ] 7.1 Confirm `innerWidth` < 768. Plain launch: Unit, then Goals, then Review, with values kept on Back; Next blocked on Upgrade without a material; the ladder wraps with steps ≥44px.
- [ ] 7.2 Launch from a Legendary Event leaderboard row: starts on Goals.
- [ ] 7.3 Edit a Rank goal on mobile: a single form with the ladder.
- [ ] 7.4 Run the create tour on mobile, and confirm it switches composer steps and every step resolves. Run the edit tour on mobile.

## 8. Gates

- [ ] 8.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check` and the bundle budget, and confirm all pass.

## Workflow follow-up

- Open the PR. CI must be green.
- Sync the specs and archive the change after merge.
