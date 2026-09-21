## Why

Jumping from Goals Overview to a specific project today means opening the project-membership filter (which only narrows Overview's own list) or navigating away to the Projects dashboard. There is no direct, glanceable way to jump straight into a project's own detail route from Overview, even though Overview is the page most users land on first.

## What Changes

- Goals Overview gains a project quick-nav for jumping directly to a project's detail route.
- Desktop: a single row of project chips renders above the existing control row (status filter, Type/Sort/Group, Planning Settings), Current plan first, every other non-archived project after it, plus a trailing link to the full Projects dashboard.
- Mobile: the same widget already used on the home page (`home-projects-widget`) renders on Overview — Current plan first, capped to 3 with a "+N more" link when there are more.
- Activating a project chip or card navigates to that project's `/goals/projects/{id}` route, exactly like the home widget and the Projects dashboard; it does not change Current plan.

## Capabilities

### New Capabilities

- `overview-project-quicknav`: Goals Overview's project quick-nav row/widget — what it shows, how desktop and mobile differ, and what activating an entry does. A sibling to `home-projects-widget` (which it reuses on mobile) rather than a modification of it, since this is a new surface, not a change to the home page's own widget.

## Impact

- `apps/web/src/fsd/pages/goals/ui/goals-board/goals-page.tsx` — new row above the existing control row.
- A new small Overview-local component reusing `useHomeProjects`/`ProjectSummaryRow` from `@/features/project-management` (already the feature-level, page-agnostic pieces `home-projects-widget` is built from) — not a direct import of `pages/home`'s `ProjectsWidget`, which would violate the page-to-page FSD boundary.
- i18n: new strings for the desktop chip row and its "all projects" link, across `en`/`de`/`es`/`fr`.
- `goals-page.test.tsx` and the Overview tutorial's step targets, if any `data-testid` ordering shifts.
