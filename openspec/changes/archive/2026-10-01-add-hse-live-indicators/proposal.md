## Why

Home Screen Events (HSE) only surface once a player opens Dailies and the HSE tab (`add-home-screen-event-tracking`). A player has no signal that an event is live, and no heads-up about the next one, anywhere else in the app. A live indicator in the navigation and a compact Home card close that gap.

## What Changes

- **Nav live indicator.** The HSE navigation entry shows a live indicator whenever any HSE is active (not only rule-bearing ones such as Faction Boost). It appears in all four navigation renderers (desktop side menu, section tabs / mobile tabs, mobile drawer, desktop navigation dialog) through one optional flag on the nav item and one shared dot component, and also on the parent "Dailies" entry so it stays visible when the menu is collapsed. The indicator is not colour-only (localized "event live" text for assistive tech) and its pulse respects `prefers-reduced-motion`.
- **Home "Home Screen Events" card.** A new Home card titled "Home Screen Events" (distinct from the existing "Events calendar") shows up to two entries: the live event first (LIVE badge, "ends in ..."), then upcoming events by start time, each with its local start time (device timezone, display only) and a relative countdown. The card holds HSE only for now and is built to take other event types later. The whole card is activatable and opens `/dailies/hse`, keyboard accessible, like the Raids widget. It has loading, empty and error bodies like its siblings.
- **Home layout.** The new card shares the row with the Token Availability card from `md` up (no new breakpoint), and stacks directly after it on mobile. The Home tour gains a step for the card.
- **Data.** The pure selector `selectActiveHomeScreenEvent` and `useActiveHomeScreenEvent` are extended to also return the first N entries (active first, then upcoming by start) instead of duplicating the selection logic.
- Not changed: how the HSE tab works, raid-point rules, and calendar data. No API change, so there is **no companion `tacticus-planner-api` change**. Calendar note: after 2026-10-10T08:00Z the API calendar has no authored HSE (the second Against the Tide run is unauthored), so the card shows its empty state until the calendar is updated.
- **Order.** Applies after `add-home-screen-event-tracking` (apps) is applied, synced and archived; its HSE tab, `useActiveHomeScreenEvent` and the selector are prerequisites.

## Capabilities

### New Capabilities

- `home-events-widget`: the Home "Home Screen Events" card (content, ordering, time display, navigation, states, placement, tour step).

### Modified Capabilities

- `app-navigation`: ADDED requirement for the HSE and Dailies live indicator across navigation renderers.
- `dailies-navigation`: ADDED requirement for the HSE tab's live indicator.
- `home-token-availability`: ADDED requirement for the shared row (supersedes its "full width" wording on desktop at sync).

## Impact

- `apps/web/src/fsd/features/daily-raids` (selector, hook, public API), `app/layout` (`nav-items.ts`, `desktop-layout.tsx`, `section-tabs.tsx`, `mobile-layout.tsx`, `mobile-nav-link.tsx`, `mobile-drawer-sub-item.tsx`, `nav-child-row.tsx`, `desktop-section-navigation.tsx`, `desktop-navigation-dialog.tsx`, a new shared dot component), `pages/home/ui` (new widget, `home-page.tsx`, `home-page.tutorial.tsx`), i18n (en/de/es/fr), tests.
- Read-only use of the existing calendar queries; no new data, storage or network.
