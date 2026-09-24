## Why

Project creation is available on the Projects dashboard, but a player browsing Goals Overview's “All projects” quick-nav must navigate away before starting one. New feedback asks for creation at that point of need, on desktop and mobile.

## What Changes

- Add a distinct Create project action to Goals Overview's project quick-nav, adjacent to its All projects destination on desktop and within the corresponding mobile project widget area.
- Open the existing project-creation sheet in blank mode without changing the current Goals filter, route, or Current plan. Keep the Projects dashboard's New project affordance.
- Make creation reachable in the empty-project state and keep project load/error states distinct.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `overview-project-quicknav`: Add contextual project creation to the Overview project area, including empty and responsive states.

## Impact

- Apps only: Goals Overview project quick-nav, the reusable `ManageProjectsSheet` and `useProjectActions`, localized copy, tests, and the Goals Overview tour.
- No API or persistence contract change. Separate from `create-project-from-goal-membership-picker`, which concerns assignment inside a goal form.
