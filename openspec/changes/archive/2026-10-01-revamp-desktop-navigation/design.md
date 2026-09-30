## Context

See proposal.md for motivation. `DesktopShell` currently wraps a sidebar and page inset in `SidebarProvider`; the provider defaults open. `NavMenuItemWithFlyout` renders child links in a HoverCard. `navItems`, `resolveActiveNavigation`, and `useSectionEntryPath` already supply the hierarchy, nested-route matching, and session-persisted section entry memory. Search uses `DesktopNavigationDialog`; its shortcut currently lives inside `AppSidebar`.

`AuthControl` has separate mobile Drawer and desktop Popover branches. The desktop popover opens above a sidebar trigger. `ThemeSwitcher` already uses the shared theme provider and can be reused. General desktop tour selectors currently group page-header controls and sidebar footer controls. Existing specs still describe the old locations.

Azure was inspected through the Chrome extension: its main rail retained expanded labels after reload while the Monitor submenu reopened. The selected product behavior deliberately differs: both menu presentation states reset on full load only.

## Goals / Non-Goals

**Goals:** Keep shell state independent of route state, reuse existing navigation and account logic, and keep the global bar and navigation usable at every desktop width from 768px upward.

**Non-Goals:** New route hierarchy, submenu search/grouping/favorites, horizontal top-level navigation, mobile redesign, moving Sync/Create Goal, API work, or changes to theme persistence.

## Decisions

### Shell composition and ownership

Keep composition in the app layer. `DesktopShell` composes an app-local `DesktopTopBar`, main sidebar, existing page header, and an app-local `DesktopSectionNavigation` as a full-height column beside the page (header plus route outlet). The top bar spans the full width; brand appears there rather than twice in the sidebar. The section panel runs from just under the top bar to the bottom of the viewport as a sibling column; the page header and outlet share the content column to its right, so an expanded panel pushes the header right rather than the header spanning above it. When the panel is collapsed the column is gone and the header spans the full content width. Start with a 48px top bar, a roughly 56px compact rail, and a 208px section menu; adjust token-level spacing during visual verification.

The section menu consumes the existing active section and pathname, uses its localized children in declared order, and marks nested routes under the correct child. It is a semantic navigation landmark with ordinary links and a header row holding the section name and a collapse button. Collapsing unmounts the whole column (no icon rail, no leftover floating control); the reopen button lives in the page header instead (see "Section menu header and collapsed header"). Home and other childless pages omit the column and toggle. All sections with children, including Guild, render the panel.

Child rows are text-only: no per-row icons and no Goals count badge (both were tried and dropped), so the panel does not query goal data.

Alternative: retain hover flyouts alongside the new panel. Rejected because it duplicates navigation and maintains the current hover/click ambiguity. Main rail icons instead have simple label tooltips and retain existing entry-path behavior.

No new FSD feature is needed: shell components remain private to `app/layout`, account controls remain in `app/providers`, and theme state is consumed through the existing `shared/theme` public API. Route pages do not own shell state or import one another.

### Refresh-only state

Own two controlled booleans in the stable `ShellContent` above the desktop/mobile branch: `primaryExpanded=false` and `sectionExpanded=true`. Use one section-menu choice across sections, not a per-section map. Do not key state by pathname or reset it in route effects. This also preserves choices if the viewport temporarily crosses the mobile breakpoint. Pass primary state to the existing sidebar provider and section state to the new panel. Do not read cookies/localStorage/sessionStorage for these choices; existing sidebar cookie writes must not become a restoration source.

Keep `useSectionEntryPath` session memory unchanged: the last visited child and menu presentation are separate concerns. Visiting a childless page temporarily hides the section panel without changing its stored in-memory choice. Full reload restores the defaults even when old sidebar cookies exist. Theme selection continues using its existing persistence.

Alternatives: reset on route change (explicitly rejected by the user); persist menu choices across refresh (also rejected).

### Top bar, search, and account

The top bar contains app identity left, a flexible search launcher in the middle, and account right. The search launcher looks like a search field but is an accessible button opening the existing dialog; it does not introduce a second search implementation. Move dialog state/shortcut handling to the desktop shell or top bar so Ctrl/Cmd+K still toggles it from any focus location. Preserve labels/descriptions, authentication filtering, child destinations, and entry-path behavior. Remove the old sidebar search button.

Move authenticated `AuthControl` to the top-right, with avatar and a truncating name where space allows. Open its card below the trigger, aligned to the right and constrained to the viewport. Preserve loading/fallback behavior, catalog status, import, manage-account, sign-out, and their guards. Remove the standalone desktop theme selector and sidebar account/sign-in control. The card layout is covered under "Account card layout".

For signed-out desktop Library access, render a guest preferences/account trigger in the same position containing theme selection and the existing sign-in action/status. This is a proposed edge-case default to preserve existing anonymous theme access, not a new authentication flow. Leave the mobile account drawer and its theme placement untouched.

The mock's notification bell is replaced by the existing `UserJotFeedbackButton` (unchanged component, including its unread dot), moved from the page header into the bar just left of the account trigger. The page-header board link icon is removed: a "Roadmap" row in the account card (and guest menu) opens `USERJOT_ROADMAP_URL` (`${USERJOT_BOARD_URL}/roadmap`, both defined once in `userjot-provider.tsx`) in a new tab with `rel="noopener noreferrer"`. The mobile account drawer keeps its existing board link, which is not duplicated by the desktop card. The page header now holds only the title/breadcrumb, page tour button and description.

Alternative: move every global control into the bar. Rejected for this scope; Create Goal and Sync remain in the rail. The rail's expand/collapse toggle and general tour button (`data-testid="desktop-sidebar-tools"`) sit at the top of the rail as its first and second items, stacked on separate rows (never side by side); the toggle is a full-width row button (Azure-style «) with its icon at the right when expanded and on the shared icon axis when compact, and flips between PanelLeftClose/PanelLeftOpen. The section panel header uses the same pattern: one full-width button row (name left, icon right, `pt-4` to match the page header) — the name is part of the button rather than a separate heading, since the panel is a labeled nav landmark and has no heading semantics to preserve, above Create Goal and Sync, and the rail has no footer. Sync has the same size and center axis as Create Goal and the nav icons in the compact rail (its icon is explicitly centered), and the same icon left edge when expanded.

### Section menu header and collapsed header

The page header's title is the active page's name: the active child's label for sections with children, the section's label otherwise. The section name is shown by the panel header, so the old always-on "Plan › Goals" title is dropped. `DesktopSectionHeader` receives `sectionExpanded`; only when it is false (and the section has children) does it render, before the title, a reopen button and a plain "Section ›" breadcrumb, which together with the title read "Plan › Goals". The collapse button (panel) and reopen button (header) are different elements sharing `data-testid="desktop-section-toggle"`; `DesktopShell` moves focus to whichever one replaces the clicked button after the state change. `sectionExpanded` state stays in `ShellContent`, unchanged.

### Account card layout

The desktop card is a re-layout of existing behavior, split into `AccountCard` (signed-in, shared by the desktop popover and the mobile drawer), `GuestAccountMenu`, and shared `account-menu-parts` (rows, preferences section, sub-view shell, language picker). Order: identity header with the existing edit-name button (Account settings, `profile` tab); Preferences (existing `ThemeSwitcher` inline, Language row showing the current language and a chevron); Account settings (Account settings, default tab); Import from V1 (existing action as a plain top-level row; no Import & export submenu because it would hold a single item); Send feedback (existing `useUserJot().open`); Sign out; and the existing `CatalogSyncStatusBadge` in a `plain` quiet-text mode as footer. Language opens an in-card sub-view with a Back button rather than a nested popover, so focus, Escape, and outside-click behavior of the single popover are unchanged; the view resets because popover content unmounts on close. The language picker shares a `useLanguage` hook with `LanguageSwitcher` (same supported locales and `changeLanguage`). `LanguageSwitcher` stays on the mobile header and mobile account drawer; it is removed from the desktop page header so there is one desktop language control. The guest menu gets the same Preferences section (theme + language) so anonymous users keep language access.

Out of scope, deliberately not added (including any Import & export submenu): Export backup, Restore from backup, Keyboard shortcuts, Delete account. They need their own behavior and specs and are follow-up work. The mock's catalog "Up to date" right-hand label is also not added: the existing status label (for example "Game Catalog version 1.42") is the whole footer.

### Mobile account drawer

The mobile drawer and the mobile guest settings popover reuse the same shared pieces as desktop: `AccountCard` (identity with edit pencil, Preferences, Account settings, Import from V1, Send feedback, Roadmap, Sign out, catalog footer) and `GuestPreferencesCard`. The drawer stays a full-height bottom drawer with safe-area padding, the Close footer button, and `data-testid="auth-account-drawer"` (the guest popover keeps `mobile-guest-settings-content`), so the mobile tour's drawer orchestration is unchanged. Mobile has no rail, so the card takes a `tourRow` (the existing `TourButton`, ghost variant) placed after Send feedback and before Roadmap; rows get an 44px minimum touch height. The drawer title/description become screen-reader-only because the identity header shows them. Superseded mobile-only controls are removed: the full-width `LanguageSwitcher` (component deleted), the separate board-link button (`UserJotBoardLink` deleted, with its `feedback.viewBoard` key), and the badge-style catalog status.

### Keyboard shortcut and motion

`SidebarProvider` gained an opt-out `keyboardShortcut` prop (default true, so other consumers keep Ctrl/Cmd+B); the desktop shell passes `false`, so the main rail has no shortcut. `DesktopShell` binds Ctrl/Cmd+B (ignoring key repeat) to the shared section expansion state only when the active section has a menu; it calls `preventDefault` only then, works from focused inputs, and moves focus to the reopen button only when focus was inside the panel being hidden. The section buttons carry `aria-keyshortcuts` and a `title` hint (`⌘B`/`Ctrl+B` via `isMacPlatform`), plus a small visible hint (the same `CommandShortcut` styling as the search launcher), marked `aria-hidden` so it is not read twice, on the expanded panel's collapse row only; the collapsed-view reopen button keeps just the title and `aria-keyshortcuts`, and the rail toggle shows none.

The section column animates its width with the rail's timing (`transition-[width,visibility] duration-200 ease-linear`, `motion-reduce:transition-none`). It stays mounted, clips its overflow, and keeps a fixed-width inner panel so content does not reflow. While collapsed it is `inert`, `aria-hidden`, and `invisible` (visibility flips at the end of the transition), so links leave the tab order immediately; `data-testid="desktop-section-navigation"` and the toggle test id exist only on the expanded panel, so the tour and focus handoff target the reopen button while collapsed.

### Responsive layout, accessibility, and tours

At narrow desktop widths, shrink the search launcher and hide/truncate optional brand/account text before allowing overlap; retain the accessible name when the visible shortcut hint is hidden. The search launcher has no tooltip (its visible label and hint are enough); main rail label tooltips are kept because the rail is icon-only when compact. Keep independent nav scrolling and `min-width: 0` on page content so wide Schedule content scrolls within its area rather than stretching the shell. Expanded panels occupy layout width, not an overlay. Controls remain usable with both menus expanded at 768px.

Use named primary/section navigation landmarks, `aria-current` on child links, and independent labeled buttons with `aria-expanded`/`aria-controls`. Hidden submenu links must leave the tab order. Preserve standard Escape and focus-return behavior for search and account popovers. When hiding a panel containing focus, move focus to its toggle.

Update `general.tutorial.tsx` and desktop tour tests for the top bar (search, a new feedback step, account), section menu, and the top-of-rail tools step (now before Create Goal); the former header language/feedback group step is removed because those controls moved, and the header board link no longer has a target. The section-menu step targets the expanded panel or, when collapsed, the header reopen button (a selector list), so it is dropped only for childless pages and never waits on a missing target; prefer explaining the available toggle rather than permanently changing user state. Preserve the mobile tour's existing drawer orchestration. Translate changed control and tutorial copy in en/de/es/fr.

## Risks / Trade-offs

- Additional horizontal and vertical space consumption -> compact default rail, slim top bar, bounded submenu width, and verification at 768px and a wide viewport using Schedule and long Library labels.
- Account refactor could affect mobile/auth fallback -> keep platform branches explicit and add signed-in, signed-out, and loading regression coverage.
- Route navigation could accidentally remount/reset state -> test sibling, cross-section, childless, search, Back/Forward, and breakpoint transitions separately from full reload.
- Concurrent navigation specs -> this delta targets the current main spec. The Schedule change renames the header-picker requirement; during sync, apply this change's desktop section-menu wording to the renamed requirement and preserve Schedule's mobile/no-third-level-tab changes. Do not resurrect old routes or duplicate header requirements.

## Migration Plan

Implement on an isolated apps worktree based on the current route changes. Ship as a frontend shell change with no data migration, new package, or API dependency. Run automated gates and separate desktop/mobile browser verification through the Aspire stack. Follow CI and review resolution before syncing/archiving; reconcile the documented spec overlap then. Rollback is a frontend revert; no stored user data is changed.
