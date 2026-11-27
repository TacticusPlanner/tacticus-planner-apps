## Why

Every project-scoped page kept its own session-only project selection, so a player who picked a project on Dailies > Raids had to pick it again on Plan > Insights and Plan > Schedule, and again after every reload.

## What Changes

- Dailies (Raids, HSE, HRE, Event shop), Plan > Schedule and Plan > Insights share one project selection, remembered per browser across pages and reloads.
- A remembered project that no longer exists or is archived falls back to "All goals".
- The selection is account data (under the `tp.session.` prefix), so sign-out drops it.
- The Goals page's `?project=` scope stays URL state and independent, as before.

## Capabilities

### Modified Capabilities

- `goals-navigation`: the project selection is shared and remembered instead of session-only.
- `daily-raids-today`, `daily-raids-plan`, `daily-raids-home-screen-event`, `hre-campaign-raids`: their project selectors use that shared, remembered selection.

## Impact

- New `entities/project/model/selection/` (`selected-project.ts`, `use-selected-project-id.ts`) exported as `useSelectedProjectId`.
- `pages/dailies/ui/dailies-layout.tsx`, `pages/goals/ui/insights/insights-page.tsx`, `pages/goals/ui/schedule/schedule-page.tsx` and their tests. No API or locale change.
