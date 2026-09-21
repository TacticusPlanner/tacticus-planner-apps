## Why

Project detail's status filter and Group control float in a bare, unlabeled row below the header card, visually disconnected from the project switcher just above them even though all three answer the same question ("which goals am I looking at, and how"). None of the three controls carries a visible label — a returning user has to recognize "Unfulfilled (31)" and "No grouping" from their current value alone. The Group control also still offers "by unit" on this route, a display mode `project-management` documents in detail (dedicated cluster-ordering rules, drag confined to a unit's cluster) that has turned out to add more complexity than value here, since the route already orders every goal by its real stored priority regardless of grouping.

## What Changes

- Move the status filter and Group control into the project detail header card, next to the project switcher, so all three browsing controls live in one place.
- Add a visible label above each of the three controls: "Project", "Filter", "Group By".
- Remove "Group by unit" from the Group control on the project detail route only. Goals Overview keeps its own Group control, including "by unit", unchanged.

## Capabilities

### Modified Capabilities

- `project-management`: the detail route's header now contains the labeled status filter and Group control alongside the project switcher (goal content still renders below); the Group control on this route no longer offers "by unit", and the now-inapplicable unit-clustering requirement is removed.
- `goals-navigation`: the project selector's "trailing in the same row as the status control" rule gets a documented exception for project detail's new grouped-in-header layout.

## Impact

- `apps/web/src/fsd/pages/goals/ui/projects/project-detail-header.tsx` — gains the status filter and Group control, plus labels for all three controls.
- `apps/web/src/fsd/pages/goals/ui/projects/project-detail-page.tsx` — stops rendering the status filter and `GoalFilters` row below the header; passes them into the header instead.
- `apps/web/src/fsd/entities/goal/ui/goal-filters.tsx` — needs a way for a caller to restrict which Group options render (project detail drops "unit").
- `apps/web/src/fsd/pages/goals/model/goals-data` or wherever `goals.projectDetail.group` is persisted — the "unit" value already stored from a prior session needs a safe fallback on project detail once that option disappears from the control.
- i18n: new label strings across `en`/`de`/`es`/`fr`.
- Existing tests for `project-detail-page`, `project-detail-header`, and `goal-filters` that assert today's layout/options.
