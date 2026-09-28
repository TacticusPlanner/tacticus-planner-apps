## Why

Project Detail's bulk sheet currently only adds goals and is difficult to scan in large plans (`PLAN-009`). Users need a reviewed add/remove workflow that shows current versus pending membership, protects concurrent edits, and never changes goal priority as a side effect.

## What Changes

- Turn the existing project-context assembly sheet into a searchable, groupable add/remove membership editor with a clear pending-change summary and explicit Save.
- Use the API companion's atomic replacement precondition and structured stale/slot/last-membership responses; keep the draft for review after rejection.
- Preserve the account-wide goal order (`Goal.GlobalPriority`) and existing goal status/target: membership edits never move a goal in the order. Rows are listed in that global order and can be grouped by unit or goal type; there is no separate sort control (the Goals page has none either).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-management`: Extend its bulk assembly requirement from add-only to reviewed add/remove.

## Impact

Apps `features/project-management/ui/add-goals-to-project-sheet.tsx`, project API types/query refresh, localized copy and tests. Paired `tacticus-planner-api` change has the same name and applies first. Applies after `establish-global-goal-priority` (whose delta this one modifies again) and `consolidate-goals-into-plan-and-remove-active-project`. V2 direct contract adjustment is permitted by the destructive-change policy.
