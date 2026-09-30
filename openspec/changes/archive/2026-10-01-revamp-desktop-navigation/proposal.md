## Why

Desktop sibling pages are hidden in transient sidebar flyouts, while account and global controls are split between the sidebar footer and page header. A persistent section menu and slim global top bar make destinations easier to discover and separate global controls from page context.

## What Changes

- Replace desktop child-page flyouts with a persistent, independently collapsible menu for the active section, including single-child sections; childless pages have no empty menu column. The menu's header shows the section name and a collapse button; child rows are text-only. When the menu is collapsed its column is fully released and the page header shows a reopen button with a "Section ›" breadcrumb before the title; with it expanded the header shows just the page title.
- Start each full document load with the main rail compact and section menu expanded. Preserve both manual choices through all client-side navigation, including section changes and Back/Forward; reset only on refresh/new document load.
- Add a desktop global bar with app identity, navigation search, and at the far right the existing UserJot feedback button (moved from the page header) next to the account control. Remove duplicate sidebar search and account controls.
- Re-lay out the desktop account menu as: identity header (avatar, name, email, edit button to the Account settings profile tab), Preferences (theme three-icon switch, Language row opening a picker - the language control leaves the page header), Account settings, Import from V1 (existing action, a plain top-level item), Send feedback, Roadmap (public roadmap, new tab), Sign out, and the catalog version as a quiet footer. Keep theme and language reachable through the guest preferences menu when signed out. Export backup, Restore from backup, Keyboard shortcuts, and Delete account are out of scope (follow-up).
- Preserve section entry memory, route definitions, page description, and Create Goal and Sync in the sidebar. Move the rail's expand/collapse toggle and tour button to the top of the rail (first and second), align Sync with Create Goal, drop the search launcher tooltip, and move the page-header board link into the account menu as a "Roadmap" row.
- Restyle the mobile account drawer and the mobile guest settings popover to the same account card layout as desktop (shared components), adding a "Take a tour" row since mobile has no rail; keep the rest of mobile navigation unchanged. Ctrl/Cmd+B now toggles the section menu and the main rail has no shortcut; the section column animates its width like the rail. Update desktop navigation guidance, accessibility, translations, and regression coverage.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-navigation`: desktop global bar, persistent section menu, refresh-only menu defaults, relocated search, and replacement of flyout references in header behavior.
- `account-menu`: top-right desktop trigger, downward/right-aligned account card, theme selection, and guest preferences access.

## Impact

Frontend only: `apps/web/src/fsd/app/layout`, app account/theme providers, shared navigation tutorial, locale resources, and their tests. Reuse existing React Router, shadcn/Radix controls, theme provider, and route inventory; no new dependency or API contract is needed. No companion API change.

The working tree contains `move-raids-plan-to-plan-schedule` and `consolidate-project-views-into-goals`. This change consumes the current route inventory rather than reverting their routes. During spec sync, reconcile the Schedule change's replacement header-picker requirement with this change's desktop menu wording; preserve that change's mobile behavior and removal of third-level Raids tabs.
