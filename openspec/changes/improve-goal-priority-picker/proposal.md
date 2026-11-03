# Proposal

## Why

Choosing a priority today means picking a bare number: the Edit goal dialog's Priority select lists 1 to N, and Move to priority… takes a typed number. Players can't tell what sits at a position without closing the dialog and counting rows. Severyn asked (3 Nov, while planning the deadline work) for the picker to show what goal is at each position, and for Priority to move to the top of the Edit goal dialog.

Agreed on 3 Nov (decisions 36 to 39 in the planning notes):

- Each position shows the goal in it now ("4 · [portrait] Ragnar · Rank → A1"), with no project dots.
- The picker is a searchable combobox, matching a number or a unit name.
- Move to priority… uses the same picker.
- Priority is first in the Edit goal dialog on desktop and mobile.

## What Changes

- A shared **priority picker** combobox. It lists positions 1 to N, each showing the in-flight goal currently there (unit portrait, unit name, goal type and target). The goal's own position is marked "(current)". You can search by number, unit name or goal type.
- The Edit goal dialog's Priority select and Move to priority…'s number field are both replaced by it.
- The Edit goal dialog shows Priority first, above the target.

## Capabilities

### New Capabilities

- `goal-priority-picker`: the combobox, its options and its search.

### Modified Capabilities

- `goal-edit-dialog`: the Priority field uses the picker and comes first.
- `global-goal-priority`: Move to priority… uses the picker.

## Impact

- `features/goal-planning` (picker options from the in-flight order), a picker component under `features/goal-planning/ui/` used by `features/goal-create` (Edit goal dialog) through its `@x` public API and by `pages/goals` (Move to priority…).
- `common` `goals.order.*` and `goals.edit.*` i18n in en/de/es/fr; the Edit goal dialog tour.
- No API change, and no dependency on the deadline changes.
