## Why

The Plan entry currently lands on a selected project's detail page, or All Goals when there is no project. Once `establish-global-goal-priority` provides the single effective plan, that global view should be the default Plan destination (`PLAN-003`), while existing browsing routes remain reachable.

## What Changes

- Make the global ordered plan the default for bare `/goals`, desktop first-entry, and each mobile Plan entry.
- Distinguish the ordered plan from All Goals and Projects in localized navigation and keep direct/deep links to those views working.
- Preserve desktop last-visited-child behavior for Plan after a child has actually been visited; leave other sections unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-navigation`: Change only Plan's default-child resolution after the global plan is available.

## Impact

Apps Goals route/index landing, navigation item labels/paths, localized copy and tests. Depends on the apps/API `establish-global-goal-priority` change; no API change here.
