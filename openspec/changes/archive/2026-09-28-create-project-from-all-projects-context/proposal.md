## Why

Project creation is available on the Projects dashboard, but a player browsing the Goals page's project quick-nav (its "All projects" link) must navigate away before starting one. New feedback asks for creation at that point of need, on desktop and mobile.

## What Changes

- Add a distinct Create project action to the Goals page's (`/plan/goals`) project quick-nav, adjacent to its All projects destination on desktop and within the corresponding mobile project widget area.
- Open the existing project-creation sheet in blank mode without changing the current Goals filter or route. Keep the Projects dashboard's New project affordance.
- Keep the creation control reachable when the desktop chip row has nothing to show (project list empty or failed) and on mobile in every state, while the existing loading/error/empty presentations stay distinct.
- Modify the quick-nav's "No projects yet" and "Loading and failure states" requirements, which currently say the desktop row renders nothing in those states.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `overview-project-quicknav`: Add contextual project creation to the Goals page's project area (new requirement), and adjust the empty and failure states so the creation control stays available. The capability name and the `OverviewProjectQuicknav` component/testids keep their existing "overview" naming; renaming them is out of scope.

## Impact

- Apps only: the Goals page project quick-nav (`overview-project-quicknav.tsx`, hosted by `goals-page.tsx`), the feature-owned `ManageProjectsSheet` and `useProjectActions`, localized copy, tests, and the Goals page tour.
- No API or persistence contract change. New projects are Custom projects; creating one changes no project selection (there is no Current plan/Active project to change) and no goal order.
- Separate from `create-project-from-goal-membership-picker`, which concerns assignment inside a goal form.
- Archive order: after `consolidate-goals-into-plan-and-remove-active-project`, which renames the quick-nav's Current-plan requirements and moves its routes to `/plan/*`; the requirements modified here keep the names they have in the main spec today.
