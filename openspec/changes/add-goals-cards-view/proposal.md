## Why

Players miss V1's Goals cards view (feedback `PLAN-026`, sysadmiral on UserJot, marked Planned). The reason given is readability: bigger portraits and more breathing room than the six-column table. V2 has only a table on desktop and a separate single-column card on mobile. The V1 card layout is recent and well liked, so the maintainer wants its arrangement back on top of V2's components and data, and wants it to be the default.

## What Changes

- **Goal card: V1 layout, V2 content.** A new card reproduces V1's arrangement (`tacticusplanner` `goal-card.tsx`) using only V2 components, tokens and data:
  - Header: selection checkbox, priority number, drag handle, avatar, name, a meta line with the done-by date, season-fit label and project badges, and the "⋯" menu.
  - Body: goal target, progress bar, level-requirement line, covered-by note, remaining-resource chips.
  - A ruled notes section.
  - A ruled footer with the status chip (one-click Pause/Resume) and the Blocked or Restricted indicator.
- **One card everywhere.** The same card renders in a responsive grid (`repeat(auto-fill, minmax(min(380px,100%),1fr))`) on desktop and replaces today's mobile card. On a phone the grid collapses to one column. The mobile reorder-mode card is unchanged.
- **Table/Cards switch, Cards by default.** At 768px and wider, a Table/Cards toggle sits in the Goals filters row. Below 768px the list is always cards and the toggle is hidden.
- **The preference follows the account.** The view is stored in the account's user settings (`goalsView`) through the companion API change, not in the browser. It is read before the list renders so the view doesn't flash, toggled optimistically, and saved in the background, with a revision conflict resolved silently. Saving Planning Settings keeps the stored view.
- **Desktop cards keep every table interaction:**
  - Per-card checkboxes and a select-all checkbox above the grid.
  - The "⋯" menu.
  - An inline drag handle that reorders across grid rows.
  - The Reached tint and cues.
  - Season-fit accents and a full-width season divider.
  - The Actual/Potential legend shown once above the grid.
- **Shared plumbing.** `SortableList` gets a sorting-strategy option for grid reordering. The drag handle is extracted into one shared goal-row component used by both the table and the cards.
- **Updated tour.** The Goals tour gains a step for the view switch, and its desktop steps still find their targets in Cards view.
- **Left out on purpose:** V1's "Go to Raids" button (Today has no goal deep link), V1's up/down priority arrows (drag and the priority number cover them) and V1's background color coding (tracked as `PLAN-020`).
- **The `PLAN-026` triage is overridden on three points, by maintainer decision:** Cards is the default instead of Table; the card follows V1's layout instead of reusing the old mobile card body; and the preference is stored on the account instead of per-device `localStorage`.

Companion change: `tacticus-planner-api` `add-goals-cards-view`, which adds `goalsView` to `GET`/`PUT /api/v1/settings`. It applies first, and this change pins its OpenAPI document.

## Capabilities

### New Capabilities

_None._ The view switch and card anatomy belong to the existing Goals list layout capability.

### Modified Capabilities

- `goal-list-layout`:
  - The table/card platform switch becomes "phones always show cards; desktop follows the stored view, Cards by default".
  - Adds the account-stored view preference and the toggle.
  - Replaces the mobile-only card requirement with one card anatomy and grid for every platform.
  - Adapts the legend, and the notes and projects placement, for cards.
  - The desktop table requirement applies when Table is selected.
- `goal-bulk-actions`: desktop selection works in Cards view, with per-card checkboxes and a select-all above the grid.
- `global-goal-priority`: desktop reorder works in Cards view, with an inline handle and moves across grid rows.
- `goal-season-fit`: the season divider spans the whole grid row in desktop Cards view.
- `goal-remaining-resources`: ascension orbs and Character ability badges show available/needed (V1's "x/y"), like Machine of War materials already do; Insights' missing totals are unchanged.

## Impact

- **Pages:** `apps/web/src/fsd/pages/goals/ui/goals-board/`:
  - `goals-list.tsx` chooses between table and cards.
  - A new `goal-card.tsx` and `goals-cards.tsx` (grid) replace the body of `goals-mobile-cards.tsx`; its reorder-mode card stays.
  - `goals-toolbar.tsx` and `goals-page.tsx` get the view-switch slot and wiring.
  - The drag handle moves out of `goal-table-row.tsx`.
  - `goals-page.tutorial.tsx` is updated.
- **Entities:** `apps/web/src/fsd/entities/planning-setting/`:
  - `goalsView` in the types and defaults, plus `normalizeGoalsView`.
  - A view-update path with an optimistic update and conflict retry.
  - `planning-settings-dialog.tsx` passes `goalsView` through on save.
- **Shared:** `apps/web/src/fsd/shared/ui/sortable-list.tsx` gets a `strategy` option.
- **API types:** `apps/web/openapi/api.json`, `api.ref` and `shared/api/schema.d.ts` are regenerated from the API change.
- **i18n:** new keys in `apps/web/public/locales/{en,de,es,fr}` for the toggle, the cards select-all label and the tour step.
- **Tests:** goals list, cards, bulk select, reorder, the drag-performance test extended to a 150-goal grid, the planning-settings save path, and the tutorial.
- No V1 code is changed or ported.
