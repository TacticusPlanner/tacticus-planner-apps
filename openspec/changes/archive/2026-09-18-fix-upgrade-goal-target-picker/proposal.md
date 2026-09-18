## Why

Users report that the Create Goal button never enables when an Upgrade goal is added
("Unable to Create Character Goal", staging). The Upgrade card's material picker is scoped
to the selected rank range **and** drops every crafted upgrade — and for a single rank step
those two filters intersect to nothing: 810 of 2340 rank steps across the catalog have no
non-crafted material at all, including **every** step at Gold2 and above for every
character. With no option to pick, the Upgrade goal can never satisfy its
"at least one target" rule, so submit stays disabled — and nothing on screen explains why,
because that rule never produces a validation message.

V1 had the same crafted exclusion, but drew from every base material in the game, so its
list was never empty. The regression is V2's rank-range scoping layered on top.

## What Changes

- The Upgrade card's picker decomposes the selected rank range's crafted upgrades through
  their recipes, recursively, and offers the resulting **base materials**, deduplicated,
  each with the quantity that range actually requires. The rank range keeps driving the
  suggestions — only what it resolves to changes.
- An Upgrade goal with no selected target surfaces a visible validation message instead of
  silently disabling the submit action.
- Depends on the companion API change `fix-upgrade-goal-target-picker` in
  `tacticus-planner-api`, which widens accepted Upgrade targets to the same decomposed set.
  The API half applies first; without it the server rejects the newly offered materials.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `goal-creation`: adds requirements for which materials the Upgrade card offers for a rank
  range, and for surfacing the reason a goal cannot be submitted.

## Impact

- `apps/web/src/fsd/pages/goals/model/estimate/goal-spec-builder.ts` — both
  `*RelevantUpgradeQuantities` helpers; `countOccurrences` is removed.
- `apps/web/src/fsd/pages/goals/model/goal-creation-form/goal-validation.ts` and
  `use-goal-validation-state.ts` — the missing-target validation issue.
- `apps/web/public/locales/en/common.json` — one new validation string.
- Companion API change: `tacticus-planner-api` / `fix-upgrade-goal-target-picker`.
