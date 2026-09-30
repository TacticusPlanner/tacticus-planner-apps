## Why

The Goals page (`/plan/goals`) is the one list of every goal, yet every
lifecycle action is one goal at a time: pausing a whole event push or
deleting a batch of stale goals means one click and one confirmation per
row. At the same time the desktop table is wider than a 1500px viewport
because two cells carry content that belongs in a tooltip (the blocked
goal's unavailable-materials list under its status) or is clipped away
(a Machine of War goal's resource chips, cut off after two lines with no
sign that more exist). This change adds row selection with bulk actions,
modelled on the Azure Portal's resource list (checkbox column, "…" menu in
the name column, an actions row with Create first and the bulk actions
after it), and reclaims that width.

## What Changes

- **Row selection + bulk actions (new).** A checkbox per in-flight row and
  a select-all-visible checkbox in the header on desktop; a select mode on
  mobile that mirrors the existing reorder mode (control-row toggle,
  checkbox cards, bottom bar). Four bulk actions over the selection:
  Pause, Resume, Delete, Add to project. Bulk pause/resume acts on the
  selected goals only (no prerequisite cascade). Delete confirms once,
  naming the count. Each action runs the existing per-goal request
  sequentially and reports partial failure with the existing aggregate
  toast; no new API.
- **Actions toolbar (desktop).** Two control rows beneath the scope chips:
  an actions row (Create goal first, then Pause, Resume, Add to project,
  Delete, disabled until something is selected and labelled with the
  count, Planning settings at the far right) and a filters row (status,
  Type, Group, order hint). Mobile keeps its status row and icon row and
  gains the select-mode toggle.
- **Row actions consolidated into a "…" menu** at the trailing edge of the
  Character cell (desktop) and the card header (mobile): Edit, Pause or
  Resume, Delete. The desktop Actions column and its three inline icon
  buttons are removed. **BREAKING** for `goal-status-actions`'s "primary,
  not behind the menu" pause/resume requirement, which this change
  reverses. The unreachable project move/remove branch of the row actions
  (its `project` prop is never supplied on this page) is deleted rather
  than carried into the menu.
- **Status · Done by narrowed.** A blocked estimate's per-material
  "material · remaining · reason" list moves into the Blocked badge's
  tooltip; the cell keeps its status badges and the "📅 date · in N days"
  line exactly as today.
- **Column order.** Status · Done by moves before Remaining, so the one
  variable-width column sits at the table's edge.
- **Remaining unclipped.** The 220px / two-line clip and the "+N" overflow
  chip are removed; every chip renders, wrapping within a wider column, and
  a row grows taller only when its chips wrap (precedent: level-requirement
  rows already keep a taller height in Compact density).
- Selection clears on any change to what the list shows (status filter,
  Type filter, project scope, Group). Reorder mode and select mode on
  mobile are mutually exclusive.

## Capabilities

### New Capabilities

- `goal-bulk-actions`: selecting goal rows on the Goals page (desktop
  checkboxes, mobile select mode), the four bulk actions over that
  selection, their enablement and applicability rules, confirmation,
  partial-failure reporting, and when the selection clears.

### Modified Capabilities

- `goal-list-layout`: column set becomes selection cell, Character
  (with the "…" menu), Projects, Goal, Progress, Status · Done by,
  Remaining; the Actions column and its inline icon buttons are removed;
  the desktop "…" menu is required rather than forbidden; the fixed row
  height gains a wrapped-chips exception; the mobile card header hosts the
  menu and, in select mode, a checkbox.
- `goal-status-actions`: "Pause and resume are primary row actions" is
  replaced by pause/resume living in the row's "…" menu; the cascade
  requirement is restated to apply to the row action only, with the
  selection-based bulk action excluded.
- `project-management`: "No bulk pause/resume on Projects" narrows to "no
  project-wide pause/resume control", so a selection-based bulk action
  over explicitly chosen goals is allowed.
- `goals-navigation`: the desktop single-control-row requirement becomes
  two rows (actions, then filters) with the enumerated control order; the
  mobile icon row gains the select-mode toggle.
- `goal-remaining-resources`: every chip renders (no count or height
  clip, no "+N" collapse); the Remaining column must fit a Machine of War
  goal's full chip set by wrapping.
- `goal-list-estimate-display`: a Blocked goal's Done By cell shows the
  blocked indicator only; the unavailable-materials detail lives in that
  indicator's tooltip.

## Impact

- `apps/web/src/fsd/pages/goals/ui/goals-board/`: `goals-page.tsx`
  (selection state, two-row toolbar, mobile select toggle and bar),
  `goals-list.tsx` and `goal-table-row.tsx` (selection cell, column
  order, "…" menu, no Actions cell), `goal-row-actions.tsx` (menu-only,
  dead project branch removed), `goals-mobile-cards.tsx` (select-mode
  cards, header menu), `goal-row-shared.tsx` (blocked materials into the
  tooltip), `delete-goal-dialog.tsx` (count-aware copy).
- `apps/web/src/fsd/pages/goals/ui/shared/goal-resource-chips.tsx`
  (clip and overflow removed) and `status-badge.tsx` (tooltip gains the
  unavailable-materials rows).
- `apps/web/src/fsd/pages/goals/model/goals-data/use-goal-actions.ts`:
  bulk status, bulk delete, and add-to-project loops built on the
  existing `run`/pending/optimistic helpers.
- `packages/ui` `Checkbox` reused; no new dependency.
- Translations in all four locales (`common.json` `goals.*` and
  `tour.overview.steps.*`); `goals-page.tutorial.tsx` gains selection and
  bulk-action steps on both platforms.
- No backend change: bulk actions call the existing per-goal status,
  delete and goal-projects endpoints. No companion `tacticus-planner-api`
  change.
- Existing tests for row actions, list, page, reorder and tutorial are
  updated; the FSD boundary validator runs unchanged.
- Sequencing: lands before `add-goals-overview-density-option`, whose
  toolbar placement (density toggle on the filters row) and row-height
  tasks rebase onto this layout. `goals-edit-dialog` is unaffected (the
  menu's Edit opens the same dialog).
