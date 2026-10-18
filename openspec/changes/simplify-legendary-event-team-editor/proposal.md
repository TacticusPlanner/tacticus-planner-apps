# Proposal

## Why

After the previous refinement shipped (#238), a second pass on the Legendary Event team editor and suggestions showed seven gaps. The editor still spends space on a Covered objectives section that only repeats what the members derive. Members and Clear depth sit in separate rows. Using a suggestion drops the objectives it was built for. The picker opens sorted by points left rather than power. Chip counts ignore the chips already selected. Tiles are too narrow for their objective icons. Suggestions ignore healers and mechanics.

## What Changes

- **No Covered objectives section in the editor (feedback 1).** The body loses its Covered objectives section. Covered objectives are always the derived set (every non-reserve member satisfies them) and can no longer be unticked. The footer keeps showing them as read-only chips and now carries the "already cleared through battle D" mark.
- **Members and Clear depth on one row (feedback 2).** The Members heading with its count and the Clear depth field share one row above the selected-member chips, on desktop and mobile.
- **Suggestions prefill the picker chips (feedback 3).** Use this team opens the editor with the proposal's objective subset already selected as picker chips.
- **Power is the default sort (feedback 4).** The picker opens sorted by Power. Without power data it falls back to Points left, as today.
- **Chip counts follow the selection (feedback 5).** Each chip counts the units that satisfy it together with every chip already selected. A selected chip counts the units that satisfy the whole selection.
- **Bigger tiles (feedback 6).** The grid has three columns on mobile (was four) and five on desktop (was six), so a tile's objective icons fit on one line.
- **Suggestions bring a healer or mechanic (feedback 7).** A proposal without a useful Healer swaps its weakest member for the strongest Healer that satisfies the subset, but only when the team has another non-Mechanical member to heal. The same rule applies to a Mechanic when the team has another Mechanical member to repair.

No **BREAKING** changes: front-end only, nothing stored changes shape, and V2 is pre-production.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `legendary-event-teams`: coverage is always derived (no untick), the editor body loses the Covered objectives section, the cleared mark moves to the footer chips, and Members and Clear depth share a row.
- `legendary-event-team-editor-workflow`: Power becomes the default sort, chip counts follow the selection, and the grid uses three columns on mobile and five on desktop.
- `legendary-event-team-suggestions`: proposals add a useful Healer or Mechanic, and Use this team preselects the proposal's objective chips.

## Impact

- `apps/web/src/fsd/entities/legendary-event/lib/team-suggestions.ts`: support swap step.
- `apps/web/src/fsd/features/legendary-event-teams`: `team-editor-draft.ts` (no exclusions), `team-editor-dialog.tsx` (layout), `team-editor-summary.tsx` (cleared mark), `team-picker.ts` (chip counts, default sort), `team-unit-picker.tsx` (grid columns, initial chips).
- `apps/web/src/fsd/pages/legendary-events/ui/legendary-event/teams`: pass the suggestion's objectives to the editor.
- i18n: remove keys only the Covered objectives section uses, in en/de/es/fr.
- No API change.
