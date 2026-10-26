# Tasks

Builds on `polish-goal-dialogs`, implemented on the same branch. Archive `polish-goal-dialogs` before this change, because both modify the same `goal-creation` requirement.

## 1. Shared goal cards (D1)

- [x] 1.1 Create `ui/goal-card/` with `RankGoalCard`, `AscensionGoalCard`, `AbilityGoalCard`, `UpgradeGoalCard` and `UnlockGoalCard`, using the props from D1. Move the per-kind field tests from `create-goal-sheet.test.tsx` and `goal-edit-dialog.test.tsx` to card tests, in both `mode`s. Verify that the card tests cover the target-reached message, the Upgrade quantity row message, and that milestones and prerequisites are absent in edit.
- [x] 1.2 Switch the create dialog to the cards (a kind-to-card map in place of the `GoalTypeCards` switch), one kind at a time. Verify that `create-goal-sheet.test.tsx` passes after each kind.
- [x] 1.3 Switch the edit dialog to the cards, and delete `GoalTargetFields`, `goal-type-fields.tsx`, `ability-goal-fields.tsx` and `upgrade-goal-fields.tsx`. Verify with `goal-edit-dialog.test.tsx`, plus a test asserting the same message text in both dialogs for one invalid Ascension target.

## 2. Target ladder (D2)

- [x] 2.1 Build `TargetLadder` with a radiogroup, tier groups, Current, taken and selected states, the range highlight, roving tabindex and `aria-disabled`. Verify with unit tests:
  - the Incisus fixture (Gold II start, Gold III and Diamond I taken);
  - right arrow then Enter from Diamond II;
  - a stored below-start target.
- [x] 2.2 Use the ladder in the Rank and Ascension cards, with the range and cost line read from `preview`, including its loading and failed states. Keep the additional target under it. Verify with card tests for the range text update and the loading state.

## 3. Ability stepper (D3)

- [x] 3.1 Build `AbilityLevelStepper` with bounds, "Next", "+5", "Rarity cap" and the range message, and use it for both tracks in the Ability card. Verify with tests:
  - Legendary at 35 gives 36, 40, 50;
  - "Rarity cap" is hidden at 50, and "Next" there gives 51;
  - decrease is unavailable at the start, which reads as no change;
  - raising one track only is valid;
  - a typed 61 shows the range message.

## 4. Mobile step flow (D4)

- [x] 4.1 Add `mobileStep` to `CreateGoalSheet`, with the step indicator (`aria-current="step"`) and step containers. Start at Goals when the launch carries a unit. Verify with tests (`useIsMobile` mocked): a plain launch starts at Unit; a Legendary Event prefill starts at Goals; desktop shows no indicator.
- [x] 4.2 Mobile footer: Close or Back, then Next or Create goal. Next on Goals is disabled while there are issues or no kind is enabled, with the issue summary beside it. Verify with tests for Upgrade without a material, for no kind, and that values survive Back.
- [x] 4.3 Remove the polish change's mobile placement of "Create paused" and "Create another goal" above the review, which the Review step now holds. Verify that the tests for 4.1 and 4.2 cover that placement.

## 5. Tours and i18n (D5)

- [x] 5.1 Update `create-goal-sheet.tutorial.tsx`:
  - add ladder steps on desktop and mobile, and a step-indicator step on mobile (desktop has no indicator);
  - add mobile `before` hooks that set `mobileStep` for steps on other composer steps.

  Update `goal-edit-dialog.tutorial.tsx` so its target step points at the ladder. Add the `tour.*` keys in en/de/es/fr. Verify with the updated `.tutorial.test.tsx` files.

- [x] 5.2 Add every new UI string to `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations:
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

- [x] 6.1 Create for Incisus: the Rank ladder fits without scrolling; Gold III and Diamond I show as taken; keyboard selection works; the cost line updates.
- [ ] 6.2 Create Ability for a Legendary unit: the quick picks and bounds match 3.1.
- [x] 6.3 Edit Arjac, Toth, Z'Kar and Shiron: the same controls and messages as in create, and no creation-only controls.
- [x] 6.4 Run the create and edit tours at 1280px and confirm every step resolves.

## 7. Mobile verification (<768px, 390×780 same-origin iframe)

- [x] 7.1 Confirm `innerWidth` < 768. Plain launch: Unit, then Goals, then Review, with values kept on Back; Next blocked on Upgrade without a material; the ladder wraps with steps ≥44px.
- [x] 7.2 Launch from a Legendary Event leaderboard row: starts on Goals.
- [x] 7.3 Edit a Rank goal on mobile: a single form with the ladder.
- [x] 7.4 Run the create tour on mobile, and confirm it switches composer steps and every step resolves. Run the edit tour on mobile.

## 8. Gates

- [x] 8.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check` and the bundle budget, and confirm all pass.

## Verification notes

- 6.1: Incisus now holds Rank goals at every rank from Gold III to Adamantine II, so its ladder falls back to Gold III with the slot conflict and marks Diamond I to Adamantine II "Already a goal". The taken-steps case was verified on Thaddeus (Gold I, Gold II taken): Gold I Current, Gold II "Already a goal" and not focusable, default Gold III; ArrowRight ×2 then Enter selected Diamond II and the range line moved from "Gold I → Gold III · 5 materials to farm" to "Gold I → Diamond II · 16 materials to farm"; ArrowLeft stopped at Gold III. All tiers fit in the main column at 1280×880.
- 6.2 (left unchecked): on Thaddeus (Legendary, active 35) Next/+5/Rarity cap gave 36/40/50, decrease stops at 35 with "No change", and a typed 61 shows the range message and blocks Create goal. The at-cap case ("Rarity cap" hidden at 50, Next gives 51) needs a Legendary unit with an ability at 50, and the local account has none; it is covered only by `goal-card.test.tsx`.
- 6.3: the edit dialogs show the same ladder, stepper, quantity rows, range line and previews as creation, and none of milestones, prerequisites, "Create paused" or "Create another goal". One difference remains from before this change: a Machine-of-War Ability goal shows the farming strategy at creation but the farming-location list in edit.
- 7.4: the mobile create tour switches composer steps (Unit for the indicator and status, Goals for ladder and milestones, Review for projects). Steps whose target is absent wait about a second each before Joyride skips them, so the jump to Review takes a few seconds.
- Tours: the step-indicator step is mobile-only, since desktop has no step indicator.

## Workflow follow-up

- Open the PR. CI must be green.
- Sync the specs and archive the change after merge.
