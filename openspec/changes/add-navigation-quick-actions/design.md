## Context

See proposal.md for motivation. DesktopNavigationDialog and MobileBottomNav each keep a query and use filterNavigationItems for localized label/description matching. Desktop displays a dialog; mobile searches its full-height Menu drawer. Neither currently models actions.

ShellContent already owns the global Create Goal launcher and resolves project scope from the current Goals URL. ManageProjectsSheet and useProjectActions are exported by features/project-management; the existing form handles validation, pending state, error toasts, and query invalidation. usePlayerDataSyncStatus exposes the same sync callback/status used by existing desktop/mobile controls. UserJotFeedbackButton delegates to useUserJot().open(). PageTourButton uses hasPageTour/isRunning/startPageTour from the tour provider; the shared public index will need to expose a suitable read/action hook.

The desktop navigation revamp moves search to the top bar without changing the dialog's purpose. Apply this change after that revamp; it additionally changes the mobile search contents, not mobile navigation structure.

## Goals / Non-Goals

**Goals:** One action inventory and dispatch policy for both search surfaces, reuse existing workflows, preserve page context, and avoid overlapping modal focus traps.

**Non-Goals:** New backend operations, reimplementing creation forms, a new search service, fuzzy matching, action history, automatic submission, new keyboard shortcuts, or removal of existing action controls.

## Decisions

### Shared app-layer action inventory

Own an app-local action descriptor list in app/layout: stable id, icon, localized label/description/keywords, visibility, disabled reason, and callback. Compose callbacks in ShellContent using lower-layer public APIs and app providers; pass descriptors to desktop and mobile search. Do not import page components into other pages or put application orchestration into shared UI.

The project-management feature retains its public ManageProjectsSheet/useProjectActions API; shell composition mounts one create-mode instance (project undefined) on demand. Reuse existing create/save/pending/error behavior and invalidation. Do not navigate to Projects just to open the form. Success closes the form and keeps the current route, while queries refresh; cancellation writes nothing. A new shared tour API exposes only the current page tour's availability, running state, and start command (or exports the existing useTour through the index if suitable).

Alternative: simulate clicks on existing buttons. Rejected because controls may not be mounted on the current page and DOM coupling breaks mobile/desktop parity. Alternative: route to Projects for Create Project. Rejected because quick actions should launch directly without losing page context.

### Results and matching

Show Quick actions first, then Pages, preserving existing page hierarchy/order. The initial action order is Create Goal, Create Project, Sync with Tacticus, Submit Feedback, Tour this page. With an empty query, show all eligible actions and existing routes. Filter each group independently with trimmed, case-insensitive substring matching over localized labels/descriptions, plus action keywords (including API for sync). Hide empty groups and show one no-results state only when both groups are empty.

Keep route filtering and entry-path resolution intact. Action results are buttons; page results remain links. Reuse short existing action labels where appropriate, add localized descriptions/group labels, and change search copy to communicate "Search pages and actions". Retain the existing Sync with Tacticus label; API is an alias rather than a new integration. No additional action aliases are required beyond meaningful localized descriptions.

### Availability and execution

Creation and sync are authenticated actions and are hidden for guests. Feedback remains available to guests, following existing anonymous feedback rules. Page tour is hidden without registered steps and disabled while a tour runs. Sync remains visible but disabled with its existing progress/status while syncing; retry/reauth behavior uses the existing callback. Re-evaluate guards at activation so an action cannot run after its eligibility changed while search was open. An unavailable activation retains the search with updated state instead of invoking a stale callback.

Search never creates a record or submits feedback merely by opening or filtering results. Explicit activation opens the corresponding form/widget; normal save/submit behavior remains in those surfaces. Create Goal delegates to the existing global callback, retaining current project scope and creation defaults rather than deriving a project from search text. Create Project opens a blank form even when there are no projects or the project's list query has failed; saving uses existing validation/error/retry behavior.

### Modal handoff and interaction

Keep a pending selected action in the stable shell, close/reset the active search surface, then dispatch once its modal layer has released focus and pointer restrictions. Use the dialog/drawer close lifecycle or unmount completion rather than a fixed arbitrary timeout. Avoid callback replay on rerender and recheck availability at dispatch. For goal/project forms, focus enters the new form; for the page tour, it enters the first step only after targets are reachable; for feedback, the widget controls its focus. For sync, focus returns to the search trigger and existing status/toasts report progress/errors. After a launched form closes, restore focus to the originating search trigger if still present.

Desktop retains Ctrl/Cmd+K toggle, auto-focused input, Escape dismissal, and Tab traversal with Enter/Space on focused action buttons. Typing or Enter in an input must not execute an action implicitly. Mobile retains the Menu drawer/search field, touch-friendly rows, and scrollable results above the on-screen keyboard. Close the drawer and dismiss the keyboard before opening the target overlay. No new desktop shortcut is introduced on mobile.

Update general.tutorial.tsx desktop search guidance and mobile Menu guidance, including translated copy in en/de/es/fr. Tutorial demonstrations describe actions rather than executing sync or creation automatically. Desktop uses the top-bar search target; mobile uses the Menu/search target and its existing drawer orchestration.

## Risks / Trade-offs

- Nested modal focus/pointer conflicts -> explicit close-completion dispatch, desktop/mobile integration tests and real browser checks.
- Stale authentication/sync/tour status -> shared descriptors derived from live providers plus execution-time guards and single-dispatch tests.
- UserJot SDK is optional and current open callback can silently no-op -> expose readiness through the app provider, keep the matching feedback result disabled with an unavailable explanation until ready, and verify unavailable state. Do not add a new SDK loader or fallback destination.
- Duplicate project forms on Projects -> mount the shell form only when launched and verify unique active form/focus targets; retain page-local form behavior.
- Discoverability adds five rows to mobile -> small separate group, scrollable results, and no extra nested action menu.

## Migration Plan

Frontend-only change after revamp-desktop-navigation; no data migration or API companion. Implement in an isolated apps worktree preserving existing route/scope changes, verify both platforms, and complete repository gates and PR review before spec sync/archive. Reverting the search additions restores route-only search without changing user data.
