## Why

Desktop sibling pages are hidden in transient sidebar flyouts, while account and global controls are split between the sidebar footer and page header. A persistent section menu and slim global top bar make destinations easier to discover and separate global controls from page context.

## What Changes

- Replace desktop child-page flyouts with a persistent, independently collapsible menu for the active section, including single-child sections; childless pages have no empty menu column.
- Start each full document load with the main rail compact and section menu expanded. Preserve both manual choices through all client-side navigation, including section changes and Back/Forward; reset only on refresh/new document load.
- Add a desktop global bar with app identity, navigation search, and the account control at the far right. Remove duplicate sidebar search and account controls.
- Move desktop theme selection into the account menu, retaining Light/System/Dark and existing theme persistence. Keep theme accessible through a guest account/preferences menu when signed out.
- Preserve section entry memory, route definitions, page breadcrumb/description, Create Goal and Sync in the sidebar, and language/feedback controls in the page header.
- Preserve mobile navigation and account layout. Update desktop navigation guidance, accessibility, translations, and regression coverage.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-navigation`: desktop global bar, persistent section menu, refresh-only menu defaults, relocated search, and replacement of flyout references in header behavior.
- `account-menu`: top-right desktop trigger, downward/right-aligned account card, theme selection, and guest preferences access.

## Impact

Frontend only: `apps/web/src/fsd/app/layout`, app account/theme providers, shared navigation tutorial, locale resources, and their tests. Reuse existing React Router, shadcn/Radix controls, theme provider, and route inventory; no new dependency or API contract is needed. No companion API change.

The working tree contains `move-raids-plan-to-plan-schedule` and `consolidate-project-views-into-goals`. This change consumes the current route inventory rather than reverting their routes. During spec sync, reconcile the Schedule change's replacement header-picker requirement with this change's desktop menu wording; preserve that change's mobile behavior and removal of third-level Raids tabs.
