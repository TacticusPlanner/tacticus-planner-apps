## Why

A goal row's "⋯" menu currently offers "Remove from this project" and Delete, both hidden behind an extra click. When the viewed project is the goal's only membership, "Remove" today silently relocates the goal to the Default project — the user never chooses a destination — and when the Default project itself is the goal's only membership, "Remove" is disabled with a tooltip explaining there is nowhere to go. That dead end is unnecessary: the user could always resolve it by creating a new project to move the goal into, they just aren't offered that from here.

## What Changes

- **BREAKING** (behavioral, not API): when a goal's viewed project is its only membership, "Remove" no longer silently relocates it to the Default project. It becomes "Move to project", which opens a picker of the account's other existing projects plus a "Create new project" option; picking an existing project moves the goal there, and creating a new project moves the goal into it once created.
- When the goal already belongs to another project besides the one being viewed, the row keeps a plain "Remove from project" action (no destination needed — the goal remains a member of its other project(s)).
- The disabled "nowhere to go" state, and its explanatory tooltip, are removed: when the account has no other existing project to offer in the picker, "Move to project" becomes a single action that goes straight to project creation instead of opening a picker with nothing in it.
- On desktop, the row-level Move-or-Remove action and Delete render as inline icon buttons directly in the row (alongside the existing Pause/Resume icons), not hidden inside the "⋯" menu. The "⋯" menu keeps Archive/Unarchive and renders only when at least one of those applies; on mobile, all of Move/Remove/Delete/Archive/Unarchive stay inside the "⋯" menu, unchanged.

## Capabilities

### Modified Capabilities

- `goal-project-membership`: reworks the last-membership removal path into an explicit, user-chosen move (existing project or newly created one), and removes the "nowhere to go" unavailable state it replaces.
- `goal-list-layout`: the desktop Actions column additionally inlines Move-or-Remove and Delete as icon buttons; the "⋯" menu is present only when it still has content.

## Impact

- `apps/web/src/fsd/pages/goals/model/projects/use-remove-goal-from-project.ts` and `project-removal.ts` — `planProjectRemoval`'s always-Default relocation and its `lastMembershipIsDefault` unavailable case are replaced by a user-chosen destination (existing project or a just-created one); the occupied-slot conflict check generalizes from "the Default project" to "whichever project is the destination."
- `apps/web/src/fsd/pages/goals/ui/goals-board/goal-row-actions.tsx` — inline icon buttons for Move/Remove and Delete on desktop; a destination picker; "⋯" menu rendered conditionally.
- A destination picker UI (existing projects + "Create new project"), reusing the project-creation form already used by `ManageProjectsSheet`/`project-management` rather than building a second one.
- i18n: new/changed strings for "Move to project", the picker, and the dropped tooltip's replacement copy, across `en`/`de`/`es`/`fr`.
- Existing tests asserting today's disabled-Remove-with-tooltip behavior and the silent-relocate-to-Default behavior.
