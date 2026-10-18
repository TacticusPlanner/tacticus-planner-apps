# Design

## Context

- `TeamEditorDialog` renders Name, Covered objectives (tickable derived chips), Clear depth, then Members (`TeamUnitPicker`: count badge, selected chips, search, switches, objective chips, grid). The sticky footer `TeamEditorSummary` already shows the checked objectives as read-only chips.
- `team-editor-draft.ts` keeps `excluded` (derived objectives the user unticked) and reconciles it on every member change.
- `TeamUnitPicker` holds `selectedObjectives` and `sort` (default `pointsLeft`) as local state; `objectiveChipCounts` counts each chip alone.
- `suggestLaneTeams` takes the first five candidates by power for each subset. `LegendaryEventUnit.traits` carries `Healer`, `Mechanic` and `Mechanical` (7, 5 and 18 units in the test catalog).
- `teams-section.tsx` opens the editor from a suggestion with `memberUnitIds` and `suggestionRank` only.

## Goals / Non-Goals

**Goals:** a shorter editor whose coverage cannot drift from its members; suggestions that use the subset they were built for and include healing or repair where it helps.

**Non-Goals:** changing the clear estimate (it stays power-only, so a support swap may lower the estimated depth); changing stored teams; healer or mechanic preference in the picker sort.

## Decisions

### D1. Coverage is always derived

The draft drops `excluded`; checked = derived. Opening a saved team whose stored objectives omit a derived one shows it covered, and saving stores the derived set. Cards keep reading the stored objectives until the team is saved again.

_Alternative:_ keep stored unticks invisibly. Rejected: coverage the user cannot see or change is worse than none.

### D2. Cleared mark moves to the footer chips

`TeamEditorSummary` takes the lane model, progress and the draft's depth and marks a chip cleared through that depth with the same Check icon and screen-reader text as cards.

### D3. Members row

The Members `<h3>` with the count badge sits on the left of a flex row and `ClearDepthField` on the right (`justify-between`, wrapping only if the row cannot fit). The picker gets the count badge from the dialog, so the count moves out of `TeamUnitPicker` into the row. The selected chips stay first inside the picker.

### D4. Initial picker chips

`openTeamEditor` gains `objectiveIndexes`; the host passes it to `TeamEditorDialog`, which passes `initialObjectives` to `TeamUnitPicker` as the `selectedObjectives` initial state. Save and add another keeps the chips as today.

### D5. Chip counts follow the selection

`objectiveChipCounts(tiles, indexes, selected)`: chip X counts tiles satisfying `selected ∪ {X}`. With nothing selected it equals today's count.

### D6. Default sort is Power

`useState<PickerSort>("power")`; `shownSort` still falls back to `pointsLeft` without a power config.

### D7. Grid columns

`grid-cols-3 md:grid-cols-5`. The objective icon row keeps 16px icons and no wrap.

### D8. Support swap in suggestions

After taking the first five candidates of a subset (in the existing order):

- A member is a **useful Healer** when it has the `Healer` trait and another member lacks `Mechanical`. A member is a **useful Mechanic** when it has the `Mechanic` trait and another member has `Mechanical`.
- If no member is a useful Healer, take the first candidate outside the team with `Healer` that satisfies the subset and that the player holds (a locked unit adds no power and cannot be fielded). Replace the last member in candidate order that is not a Healer or Mechanic, but only if the resulting team has a useful Healer and still has a useful Mechanic if it had one; otherwise try the earlier such members, and swap nothing if none works. Then apply the same step for a Mechanic.
- Teams with fewer than five members already hold every candidate, so nothing is swapped.
- The member order stays candidate order. Merging, the cleared drop, gain and ranking run on the swapped team.

_Alternative:_ swap only when the estimated depth does not drop. Rejected: the estimator values power only, so it would almost always refuse the swap.

## Risks / Trade-offs

- [A support swap lowers the estimated clears and gain] → Accepted: the user asked for healers and mechanics, and the estimate is a power estimate. The Uthar worked example is unchanged, because Incisus (`ultraApothecary`) is already a Healer member.
- [Three-column tiles make the mobile grid longer] → The grid scrolls inside the sheet, and the footer stays in view.
