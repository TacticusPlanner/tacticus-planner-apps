## Why

The goal detail side panel on desktop wastes space (a narrow `max-w-sm` column) and carries a lot of read-only noise (history, dependencies, blockers, estimate, farming guidance, progress) that the Goals list and Dailies already cover. Editing a goal, the one thing the panel is really for, is buried behind a view/edit mode switch and split across two separate saves (target vs. everything else). Creating a goal has the same cramped panel.

## What Changes

- **Create goal** opens as a centered dialog on desktop (mobile keeps the bottom sheet), with a layout that uses the available width (two columns, fixed header/footer, scrolling body).
- **Goal detail is replaced** by a minimal **Edit goal** dialog (desktop) / form (mobile bottom sheet): read-only unit and goal kind, then goal target (goal type not changeable), priority, notes, projects, and the farming preferences that apply to the goal's kind. **BREAKING (UI)**: history, dependencies/prerequisite links, blockers, estimate, progress, remaining resources, farming guidance, and the view/edit mode switch are removed, on mobile as well.
- **Priority** becomes editable as a position select (1..N of the Active/Paused goals), saved by the server as a move to that position.
- **One Save** submits everything that changed (target, notes/strategy/sources, projects, priority) in one atomic request to a new API endpoint; nothing half-applies. The separate "Save target" flow goes away.
- **New Edit action** on every goal in the Goals list (desktop table and mobile cards; Overview and Project Detail). Clicking the goal name or row no longer opens a panel.
- Cleanup: unused detail components, tests, tutorial registrations and `goals.detail.*` i18n keys are removed; the create/edit tutorials and their selectors are updated.
- **Companion API change** `goals-edit-dialog` (`tacticus-planner-api`, applies first): new `PUT me/goals/{goalId}/edit`, an all-or-nothing edit taking optional target, details, projects, and priority (by position) sections. The existing four endpoints stay for their other callers.

## Capabilities

### New Capabilities

- `goal-edit-dialog`: the Edit action, the minimal Edit goal dialog contents, position-select priority, single atomic Save, discard confirmation, load/failure states, and the desktop space-use layout shared with Create goal.

### Modified Capabilities

- `goal-creation`: goal creation opens as a centered dialog on desktop, unchanged on mobile.
- `goal-target-editing`: the target is edited inside the Edit goal dialog and saved with its single Save instead of a separate Edit target/Save target flow.
- `goal-acquisition-source-picker`: the "detail/edit sheet" is now the Edit goal dialog.
- `goal-progress-display`: drops the goal-detail sheet from the surfaces that show the progress explanation and remaining-text formatter.
- `goal-visual-accessibility`: contrast targets name the goal dialogs instead of goal detail.
- `goal-detail-estimate-display`: both requirements removed (the goal-detail Estimate section no longer exists).
- `goal-farming-guidance`: "Goal detail exposes resource and source guidance" removed; project-scoped guidance is unchanged.

## Impact

- `apps/web/src/fsd/pages/goals/ui/goal-detail/*` (rewritten as the edit dialog; view, header, estimate, guidance, dependencies, and their tests deleted), `ui/create-goal/create-goal-sheet.tsx` (+ tests, tutorial), `ui/goals-board/{goal-row-actions,goal-row-shared,goals-page}.tsx`, `ui/projects/project-detail-page.tsx`, i18n namespaces in `apps/web/public/locales` (en/de/es/fr).
- A shared responsive dialog wrapper (desktop `Dialog`, mobile `Sheet`) and combobox portal handling in `shared/ui` (`unit-combobox`, `rarity-combobox`).
- Specs: `goal-edit-dialog` (new); `goal-creation`, `goal-target-editing`, `goal-acquisition-source-picker`, `goal-progress-display`, `goal-visual-accessibility`, `goal-detail-estimate-display`, `goal-farming-guidance` (deltas).
- Companion API change: `goals-edit-dialog` (new `goal-combined-edit` capability); the apps client and generated types consume the new endpoint.
