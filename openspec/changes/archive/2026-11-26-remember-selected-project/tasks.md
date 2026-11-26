## 1. Shared selection

- [x] 1.1 Add the stored selection (`tp.session.project.selected.v1`) with an in-memory fallback when storage refuses the write, and cross-tab sync
- [x] 1.2 Resolve it against the loaded project list: a deleted or archived project falls back to all goals
- [x] 1.3 Use it in the Dailies layout, Plan > Schedule and Plan > Insights

## 2. Tests

- [x] 2.1 Unit tests for resolving, storing and sharing the selection
- [x] 2.2 Dailies: the picked project is remembered on the next visit; a deleted one falls back to all goals
- [x] 2.3 Insights: preselects the project picked elsewhere; a deleted one falls back to all goals
