## Context

See proposal.md for motivation. `DesktopShell` currently wraps a sidebar and page inset in `SidebarProvider`; the provider defaults open. `NavMenuItemWithFlyout` renders child links in a HoverCard. `navItems`, `resolveActiveNavigation`, and `useSectionEntryPath` already supply the hierarchy, nested-route matching, and session-persisted section entry memory. Search uses `DesktopNavigationDialog`; its shortcut currently lives inside `AppSidebar`.

`AuthControl` has separate mobile Drawer and desktop Popover branches. The desktop popover opens above a sidebar trigger. `ThemeSwitcher` already uses the shared theme provider and can be reused. General desktop tour selectors currently group page-header controls and sidebar footer controls. Existing specs still describe the old locations.

Azure was inspected through the Chrome extension: its main rail retained expanded labels after reload while the Monitor submenu reopened. The selected product behavior deliberately differs: both menu presentation states reset on full load only.

## Goals / Non-Goals

**Goals:** Keep shell state independent of route state, reuse existing navigation and account logic, and keep the global bar and navigation usable at every desktop width from 768px upward.

**Non-Goals:** New route hierarchy, submenu search/grouping/favorites, horizontal top-level navigation, mobile redesign, moving language/feedback/Sync/Create Goal, API work, or changes to theme persistence.

## Decisions

### Shell composition and ownership

Keep composition in the app layer. `DesktopShell` composes an app-local `DesktopTopBar`, main sidebar, existing page header, and an app-local `DesktopSectionNavigation` beside the route outlet below the page header. The top bar spans the full width; brand appears there rather than twice in the sidebar. Start with a 48px top bar, a roughly 56px compact rail, and a 208px section menu; adjust token-level spacing during visual verification.

The section menu consumes the existing active section and pathname, uses its localized children in declared order, and marks nested routes under the correct child. It is a semantic navigation landmark with ordinary links, a section label, and a collapse button. Collapsing releases its width except for a small accessible reopen control; it does not become a second icon rail. Home and other childless pages omit the column and toggle. All sections with children, including Guild, render the panel.

Alternative: retain hover flyouts alongside the new panel. Rejected because it duplicates navigation and maintains the current hover/click ambiguity. Main rail icons instead have simple label tooltips and retain existing entry-path behavior.

No new FSD feature is needed: shell components remain private to `app/layout`, account controls remain in `app/providers`, and theme state is consumed through the existing `shared/theme` public API. Route pages do not own shell state or import one another.

### Refresh-only state

Own two controlled booleans in the stable `ShellContent` above the desktop/mobile branch: `primaryExpanded=false` and `sectionExpanded=true`. Use one section-menu choice across sections, not a per-section map. Do not key state by pathname or reset it in route effects. This also preserves choices if the viewport temporarily crosses the mobile breakpoint. Pass primary state to the existing sidebar provider and section state to the new panel. Do not read cookies/localStorage/sessionStorage for these choices; existing sidebar cookie writes must not become a restoration source.

Keep `useSectionEntryPath` session memory unchanged: the last visited child and menu presentation are separate concerns. Visiting a childless page temporarily hides the section panel without changing its stored in-memory choice. Full reload restores the defaults even when old sidebar cookies exist. Theme selection continues using its existing persistence.

Alternatives: reset on route change (explicitly rejected by the user); persist menu choices across refresh (also rejected).

### Top bar, search, and account

The top bar contains app identity left, a flexible search launcher in the middle, and account right. The search launcher looks like a search field but is an accessible button opening the existing dialog; it does not introduce a second search implementation. Move dialog state/shortcut handling to the desktop shell or top bar so Ctrl/Cmd+K still toggles it from any focus location. Preserve labels/descriptions, authentication filtering, child destinations, and entry-path behavior. Remove the old sidebar search button.

Move authenticated `AuthControl` to the top-right, with avatar and a truncating name where space allows. Open its card below the trigger, aligned to the right and constrained to the viewport. Preserve identity, loading/fallback behavior, name editing, catalog status, import, manage-account, sign-out, and their guards. Add the existing theme selector inline in the desktop card. Remove the standalone desktop theme selector and sidebar account/sign-in control.

For signed-out desktop Library access, render a guest preferences/account trigger in the same position containing theme selection and the existing sign-in action/status. This is a proposed edge-case default to preserve existing anonymous theme access, not a new authentication flow. Leave the mobile account drawer and its theme placement untouched.

Alternative: move every global control into the bar. Rejected for this scope; language, feedback and board link remain in the page header, Create Goal and Sync remain in the rail, and the rail footer retains its collapse and general tour controls.

### Responsive layout, accessibility, and tours

At narrow desktop widths, shrink the search launcher and hide/truncate optional brand/account text before allowing overlap; retain accessible names and the shortcut in a tooltip when its visible hint cannot fit. Keep independent nav scrolling and `min-width: 0` on page content so wide Schedule content scrolls within its area rather than stretching the shell. Expanded panels occupy layout width, not an overlay. Controls remain usable with both menus expanded at 768px.

Use named primary/section navigation landmarks, `aria-current` on child links, and independent labeled buttons with `aria-expanded`/`aria-controls`. Hidden submenu links must leave the tab order. Preserve standard Escape and focus-return behavior for search and account popovers. When hiding a panel containing focus, move focus to its toggle.

Update `general.tutorial.tsx` and desktop tour tests for the top bar, section menu, and remaining footer controls. Section-menu guidance must handle childless pages and an initially collapsed menu without missing-target waits; prefer explaining the available toggle rather than permanently changing user state. Preserve the mobile tour's existing drawer orchestration. Translate changed control and tutorial copy in en/de/es/fr.

## Risks / Trade-offs

- Additional horizontal and vertical space consumption -> compact default rail, slim top bar, bounded submenu width, and verification at 768px and a wide viewport using Schedule and long Library labels.
- Account refactor could affect mobile/auth fallback -> keep platform branches explicit and add signed-in, signed-out, and loading regression coverage.
- Route navigation could accidentally remount/reset state -> test sibling, cross-section, childless, search, Back/Forward, and breakpoint transitions separately from full reload.
- Concurrent navigation specs -> this delta targets the current main spec. The Schedule change renames the header-picker requirement; during sync, apply this change's desktop section-menu wording to the renamed requirement and preserve Schedule's mobile/no-third-level-tab changes. Do not resurrect old routes or duplicate header requirements.

## Migration Plan

Implement on an isolated apps worktree based on the current route changes. Ship as a frontend shell change with no data migration, new package, or API dependency. Run automated gates and separate desktop/mobile browser verification through the Aspire stack. Follow CI and review resolution before syncing/archiving; reconcile the documented spec overlap then. Rollback is a frontend revert; no stored user data is changed.
