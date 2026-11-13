## Why

A Reached goal is done, and the usual next step is to clear it away. On a goal card that took opening the "…" menu, picking Delete and confirming a dialog, and the card carried "-" placeholder rows (in the header beside the projects, and a whole body row) that said nothing.

## What Changes

- A Reached goal's card shows a Delete button in its footer, next to the Reached label.
- Deleting a Reached goal, from that button or from the "…" menu (cards and table), acts at once without the confirmation dialog. Unreached goals keep the confirmation.
- A Reached goal's card no longer shows the "-" placeholders for its estimate and its progress/remaining area. The desktop table keeps its "-" cells.

## Capabilities

### Modified Capabilities

- `goal-list-layout`: how a Reached card renders.
- `goal-deletion`: Reached goals delete without confirmation.

## Impact

- `pages/goals/ui/goals-board/goal-card.tsx`, `goal-row-actions.tsx` and their tests; a `goals.actions.deleteGoal` accessible name in en/de/es/fr.
