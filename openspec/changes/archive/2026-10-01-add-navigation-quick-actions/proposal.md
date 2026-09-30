## Why

Navigation search currently finds destinations only, leaving common actions scattered across page toolbars, sidebars, and account menus. Including quick actions gives desktop and mobile users one searchable place to open creation flows, sync, send feedback, and start the current page's tour.

## What Changes

- Extend desktop navigation search and mobile Menu search with a labeled Quick actions group alongside Pages.
- Include Create Goal, Create Project, Sync with Tacticus, Submit Feedback, and Tour this page, searchable by localized labels and short descriptions. Include API as a search keyword for Sync with Tacticus.
- Show eligible actions with an empty query as well as matching queries; distinguish actions from route links and preserve existing route search behavior.
- Reuse the existing flows: open creation forms without submitting, invoke existing player-data sync, open the feedback widget without posting, and start the registered page tour.
- Apply current authentication and running-state guards. Hide authenticated creation/sync actions when signed out; hide page tour when none is registered; disable sync/tour while already running with an explanation.
- Close the search surface before dispatching an action, preserve the underlying route and its context, and provide keyboard/touch access on both platforms.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-navigation`: searchable quick actions, availability, result grouping, and desktop/mobile action activation.
- `userjot-widget`: recognize search quick actions as an additional explicit feedback entry point.

## Impact

Apps frontend only: app layout search/filtering, ShellContent action wiring, project-management feature public API, tour public API, UserJot and sync providers, localization, tours, and tests. No API contract, backend companion change, or new dependency.

Apply after `revamp-desktop-navigation` to use its desktop top-bar launcher; this change extends the mobile Menu drawer as well. Preserve the current goal/project scope behavior from `consolidate-project-views-into-goals` and current Schedule routes. Existing buttons/shortcuts remain available. The initial action set is limited to the five named actions; fuzzy search, command history, new shortcuts, and automatic form submission are out of scope.
