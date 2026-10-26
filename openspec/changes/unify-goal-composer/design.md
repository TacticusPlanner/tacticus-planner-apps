# Design

## Context

See proposal.md. This builds on `polish-goal-dialogs` once it has been archived. That change brings:

- the issues list keyed by field (D1);
- `firstFreeTarget` and the taken-target keys (D2);
- the shared target-option functions (D3);
- the edit estimate (D11);
- the edit material picker (D12);
- the fixed-height two-pane desktop layout and accordion `GoalTypeCard` (D14, D15).

How create and edit are built today, in `features/goal-create`:

- **Create:**
  - `UnitGoalFormFields` renders one `GoalTypeCard` per enabled kind, with the per-kind fields inline. There is a `switch` in `GoalTypeCards` in `unit-goal-form-fields.tsx`, plus `goal-type-fields.tsx`, `ability-goal-fields.tsx` and `upgrade-goal-fields.tsx`.
  - State comes from `useCreateGoalForm`.
- **Edit:**
  - `GoalEditForm` renders `GoalTargetFields` (its own target controls), `GoalEditFarmingFields` and `GoalEditNotesField`.
  - State comes from `GoalEditDraft`.
- **Already shared:** `FarmingStrategyField`, `AcquisitionSourceField`, `MythicMaterialSourceField`, `AdditionalTargetLabel` and `OptionalRangeField`.

## Goals / Non-Goals

**Goals:**

- One per-kind card that both dialogs render, so a fix lands in both.
- The ladder and the ability stepper as the only target controls for those kinds.
- A mobile create flow that shows one concern at a time.

**Non-Goals:**

- Merging `useCreateGoalForm` and `GoalEditDraft` into one state model. They differ in real ways: a multi-goal batch versus one saved goal, and revisions and dirty tracking in edit. Only the view layer is shared.
- A desktop wizard.
- API changes.

## Decisions

### D1. Shared cards take a per-kind value and callbacks, not a form object

New `ui/goal-card/` in `features/goal-create`: `RankGoalCard`, `AscensionGoalCard`, `AbilityGoalCard`, `UpgradeGoalCard` and `UnlockGoalCard`. Each takes:

- `start`;
- `value`: that kind's target draft;
- `onChange`;
- `issues`: from the polish issues list, filtered to that kind;
- `takenKeys`;
- `preview`: the preview result and its state;
- the source and strategy props the shared fields already take;
- `mode: "create" | "edit"`. Only creation-only parts check it, which are milestones and prerequisites.

Create adapts `useCreateGoalForm` to these props, and edit adapts `GoalEditDraft`. Both dialogs keep their own shell: header, footer, save and submit, unsaved-changes dialog, priority and projects.

Everything stays in one slice, so there are no new cross-feature imports. `GoalTargetFields`, `goal-type-fields.tsx`, `ability-goal-fields.tsx` and `upgrade-goal-fields.tsx` are deleted once both dialogs use the cards. The `GoalTypeCards` switch becomes a map from kind to card.

_Alternative:_ one generic card configured by kind. Rejected: the kinds' fields differ too much, and a config layer would be harder to read than five small components.

### D2. Ladder component

`TargetLadder` in `features/goal-create/ui/goal-card/target-ladder.tsx` takes:

- `steps: { key, label, icon, tier }[]`, built from the existing rank and progression orders and icons;
- `startKey`, `valueKey` and `takenKeys`;
- `onChange`.

It renders a `role="radiogroup"` of `role="radio"` buttons grouped by tier. Steps at or below the start, and taken steps, are `aria-disabled`, so they stay announced but can't be chosen. Arrow keys skip disabled steps (a roving tabindex).

- **Desktop:** tiers in one wrapping flex row, which fits all tiers at the main column's width (about 46rem in the two-pane layout). This is checked in the browser.
- **Mobile:** each tier on its own row, with `min-h-11` steps.

The range highlight is a background on the steps between start and value. The cost line beside it reads from the card's `preview`; there is no new calculation.

### D3. Ability stepper

`AbilityLevelStepper` provides decrease and increase buttons, a numeric input, and quick-pick buttons.

- Bounds: `start` (labelled as no change, matching the polish picker's "(no change)" option) to `maxAbilityLevel` (from `@workspace/game-domain`). The existing rule that at least one track rises stays in the issues list.
- "Rarity cap" uses `abilityCapForProgression(currentProgression)` and is hidden when `start >=` that cap.
- The above-cap prerequisite suggestion is unchanged; it already keys off the target value.

### D4. Mobile step flow (desktop/mobile split)

|           | Desktop (≥768px)                 | Mobile (<768px)                         |
| --------- | -------------------------------- | --------------------------------------- |
| Structure | one two-pane dialog (polish D14) | three steps: Unit, Goals, Review        |
| Footer    | options, Close, Create goal      | Back/Close, then Next or Create goal    |
| Status    | full card in the side column     | full on Unit, one-line summary on Goals |
| Review    | side column                      | Review step                             |

- `CreateGoalSheet` holds `mobileStep: "unit" | "goals" | "review"`. It starts at `"goals"` when the launch carries a unit.
- `useIsMobile()` picks the layout. The same components render in both layouts: the mobile steps are containers around the parts the desktop panes already use.
- Next on Goals is disabled while the issues list is non-empty or no kind is enabled. The polish `GoalFormIssueSummary` renders beside it.
- The step indicator is an `<ol>` with `aria-current="step"`.
- State lives in the form hooks, so changing step never resets anything.

### D5. Tours across steps

- **Mobile create tour:** each step that targets content on another composer step uses a `before` hook to set `mobileStep`. The tour reaches the setter through the tour registration props. It relies on the readiness wait from `mobile-tour-target-readiness`, which already covers force-opened content.
- **New steps:** the ladder and the step indicator, on both desktop and mobile.
- **Edit tour:** the target step now targets the ladder.

## Risks / Trade-offs

- **[Risk]** A large view refactor while polish behaviour is fresh. → Move tests to the cards first (task 1.x), run them against the old components where possible, then switch the dialogs over one kind at a time.
- **[Risk]** The ladder may not fit when Rank has 19+ steps. → It wraps by design. The desktop check verifies that all tiers are visible without scrolling at 1280px.
- **[Trade-off]** The mobile flow adds two taps to the simplest create. Launches with a unit skip the Unit step. Quick add from the list, which is out of scope, would address the rest.

## Open Questions

None.
