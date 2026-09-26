## Why

`establish-global-goal-priority` added a separate Global Plan page (`/goals/plan`) that renders almost the same list as All Goals, and it left "Current plan" (the Active project) behind as a browsing preference that no longer selects anything that matters. The result is two near-duplicate pages, a project pointer users have to understand and maintain for no execution effect, and a section whose landing depends on that pointer. This change removes the duplication and the pointer so the Plan section has one goal list ordered by global priority, one fixed landing, and one always-present Default project.

## What Changes

- **BREAKING (route)**: Rename the Goals section to `/plan`: `/plan/goals` (formerly `/goals/overview`), `/plan/projects`, `/plan/projects/:id`, `/plan/insights`. Bare `/plan` redirects (replace) to `/plan/goals`. Temporary redirects map `/goals` and `/goals/*` to their `/plan/*` counterparts (`overview` becomes `goals`, `plan` becomes `goals`), including a stored login `next` path, until they are removed in a later change. The analytics route group changes from `/goals` to `/plan`.
- **BREAKING (UI)**: Remove the separate Global Plan page, route, tab, tutorial, and copy. "All Goals" is renamed **Goals** and absorbs its capabilities: the list is always in global priority order (the Sort control and other sort modes are removed), Active and Paused rows have drag handles, mobile has a reorder mode, stale-order conflicts show the review/retry banner, and rows and the detail sheet show plan-aware estimates from the account-wide run. Status, Type, project-membership filters and Group stay; reordering while they hide goals anchors to the visible neighbour and writes through to the full order.
- **BREAKING (concept)**: Remove the Active project ("Current plan") concept: `isActivePlan`, `activateProject`, Make current, the Current plan section/badge/marker/note, "Current plan first" ordering, the "activated" toast, and every Current-plan default. Custom projects remain. The Default project remains, renamable, non-archivable, and undeletable, and stays the fallback home for goals without another membership.
- Plan's landing becomes the fixed `/plan/goals`; the dynamic `DefaultGoalsLanding` (Current plan, then Default, then All Goals) is deleted.
- Shops, Arena, Onslaught, Salvage, and Insights default to all goals in global order; their existing project selector remains an optional filter. Home projects widget, quick-nav, and Projects dashboard order the Default project first, then the existing order.
- The project detail's "Open Global Plan" link becomes a link to Goals. English, German, Spanish, and French copy, tour copy, and stale "Active project" strings (Home tour, Dailies empty state, V1 import note) are updated.
- Supersedes `make-global-plan-the-goals-landing` (delete it when this change is applied). Wording follow-ups land in `add-goals-overview-density-option`, `create-project-from-all-projects-context`, and `surface-goal-farming-guidance`.

## Capabilities

### New Capabilities

None. Requirements land in existing capabilities, including `global-goal-priority`, which `establish-global-goal-priority` creates.

### Modified Capabilities

- `global-goal-priority`: the plan lives on the Goals page rather than `/goals/plan`; reordering works with filters and Group; Current plan no longer appears. _(Requirement names come from `establish-global-goal-priority`; archive it first.)_
- `app-navigation`: Plan's default child is the fixed `/plan/goals`; the path examples change.
- `goals-navigation`: Goals page terminology and controls (no Sort); the Current plan and Current-plan-independence requirements are replaced by an all-goals default for project-aware views.
- `goal-list-layout`: drag handles are present wherever the Goals list is reorderable, including the Goals page.
- `project-management`: routes move to `/plan/projects*`; no Make current, Current plan section, or Current plan header state; the Default project is the only non-archivable project, and "Open Global Plan" becomes a Goals link.
- `overview-project-quicknav`, `home-projects-widget`: Default-first ordering and `/plan/projects*` links; no Current plan.
- `goal-project-membership`: no Current plan marker; membership and status independence no longer mention Current plan.
- `daily-raids-today`, `home-raids-widget`: drop Current plan and Active project wording; the Home widget is scoped to all Active goals like Today.
- `daily-shop-recommendations`, `dailies-arena-recommendations`: default scope is all goals with an optional project filter (Onslaught and Salvage Run already use the shared Dailies selection and need no requirement change).
- `v1-profile-import`: remove the "unless your default project is also your active project" note.

## Impact

- Apps only; no new API surface. Depends on the paired API change of the same name (removes `Profile.ActiveProjectId`, `POST /me/projects/{id}/activate`, and `isActivePlan`), which ships first; regenerate the API client/contract types after it.
- Depends on `establish-global-goal-priority` being applied and archived first (this change edits requirements it introduces).
- Touches: `pages/goals` (route, layout, Goals page, insights, project pages), `pages/dailies` (layout, Shops, Arena, Onslaught, Salvage), `pages/home`, `entities/project`, `features/project-management`, `features/goal-order`, app navigation and shell, four locale files, tutorials, and about 30 test files.
