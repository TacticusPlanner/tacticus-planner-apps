## Why

On a phone the Menu drawer is both the main menu and navigation search, yet its list gets only 297 of 844px (about 35%) on an iPhone 13. The rest goes to a large centred "Navigation" title and hint, the search field, and a full-width Close button. About four rows fit, and the list is 2,716px tall. Six quick actions as two-line rows take about 400px before the first page appears. On both platforms there is no way back to a recent page, "Submit feedback" and "Report a bug" sit side by side as near-duplicates, and commands people type for ("theme", "sign out", "settings") find nothing.

## What Changes

- Phone Menu layout: a one-line header ("Menu" and a close button) and no footer Close button (the handle, a swipe and the X still close it). Quick actions become a horizontal chip row, hidden while typing because matching actions then show as rows. Rows are one line. While typing, results sit at the bottom so the best match is right above the field, and the keyboard's Go/Enter opens it. The search field stays at the bottom and is not autofocused, since the drawer is also used to browse.
- Recent pages on both platforms: the last 3 visited pages, not counting the current one, kept on the device and shown above Quick actions when nothing is typed. Storage failures are tolerated (`browser-storage-resilience`).
- Tidy the actions: "Submit feedback" and "Report a bug" become one "Send feedback" row with a "Report a bug" shortcut (desktop) or a single Feedback chip (phone). Add Switch theme, Account settings and Sign out (Sign in and Sign up stay for guests). The Sync row shows when the last sync happened.

## Capabilities

### Modified Capabilities

- `app-navigation`: phone Menu layout, recent pages and the quick-action set.

## Impact

- `apps/web/src/fsd/app/layout/mobile-layout.tsx`, the shared navigation list from `navigation-palette-core`, `use-quick-actions.ts`, a new recent-pages store, locales and tests.
- No API change.

Stacked on `navigation-palette-core`.
