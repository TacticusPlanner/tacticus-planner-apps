## 1. Prerequisites

- [x] 1.1 Confirm `add-home-screen-event-tracking` (apps) is applied and synced/archived, so `/dailies/hse`, `useActiveHomeScreenEvent` and `selectActiveHomeScreenEvent` exist and main `dailies-navigation` lists the HSE tab. Verify: the HSE tab renders at `/dailies/hse`.

## 2. Selector and hook

- [x] 2.1 Extend `selectActiveHomeScreenEvent` (`features/daily-raids/model`) to also return `upcoming` (ascending by start, excluding the active event; `next` equals `upcoming[0]`), and add the pure preview helper returning the active event first then upcoming, capped at 2, with a live marker. Verify: tests for active plus upcoming, cap of 2, only upcoming, none, inclusive start and exclusive end, `TZ=Pacific/Honolulu` vs UTC, overlap pick unchanged, `next` unchanged for existing tests.
- [x] 2.2 Pass the new data through `useActiveHomeScreenEvent` and export what the nav provider and widget need through the `features/daily-raids` public API. Verify: hook tests for ready, loading, error and tick re-selection across an event boundary.

## 3. Navigation live indicator

- [x] 3.1 Add the optional `liveIndicator` flag to `NavItem` and `NavSubItem` in `nav-items.ts` (set on the HSE child and on the Dailies parent), the shared `NavLiveDot` (aria-hidden dot, `sr-only` localized text, `motion-safe` pulse) and an `HseLiveProvider` that calls `useActiveHomeScreenEvent` once in the authenticated shell and is skipped when signed out. Verify: unit tests for the dot (visible with a live context, absent otherwise, accessible text present, no pulse class without motion-safe, nothing for loading or error).
- [x] 3.2 Render the dot in all renderers: desktop side menu and collapsed rail (`desktop-layout.tsx`), section menu children (`desktop-section-navigation.tsx`, `nav-child-row.tsx`), header tabs (`section-tabs.tsx`), mobile bottom bar (`mobile-nav-link.tsx`), mobile drawer (`mobile-layout.tsx`, `mobile-drawer-sub-item.tsx`) and `desktop-navigation-dialog.tsx`. Verify: tests per renderer for live (HSE entry and Dailies entry show the indicator with the accessible text) and idle (none); a non-rule HSE also lights it; search results show none.
- [x] 3.3 Run `pnpm lint:fsd` and check the shell import goes through the public API without pulling feature UI into the eager shell chunk. Verify: lint clean; adjust the export path if not.

## 4. Home Screen Events card

- [x] 4.1 Add `pages/home/ui/events-widget/home-events-widget.tsx`: card titled "Home Screen Events", up to two entries (live first with LIVE badge and "ends in", then upcoming with local start and "starts in"), icon and event names reused from the calendar and `events` namespace, loading, error and empty bodies, whole-card activation to `/dailies/hse` (click, Enter, Space, `role="button"`, `tabIndex={0}`), `data-testid="home-events-widget"`. Reuse the existing countdown formatting where it fits (design decision 8); avoid page-to-page imports. Verify: component tests for live plus upcoming ordering, cap of 2, only upcoming, empty, error, loading, click and keyboard navigation, local start display under two timezones with unchanged live/upcoming result, and that the card is not the calendar.
- [x] 4.2 Update `home-page.tsx`: Token Availability and the new card share one `md:grid-cols-2` row, stacked on mobile directly after tokens; Projects/Raids row and the calendar follow unchanged. Verify: layout test (order and grid classes, all token entries still rendered), existing Home tests updated.
- [x] 4.3 Update the Home tour (`home-page.tutorial.tsx`) with a step for the card (desktop and mobile) and update `home-page.tutorial.test.tsx`. Verify: tutorial tests pass.

## 5. i18n

- [x] 5.1 Add all new strings (`nav.eventLive`, `home.events.*` title/LIVE/ends in/starts in/empty/error/loading, `tour.home.steps.hseWidget.*`) in en, de, es and fr with real translations at the quality of sibling keys, and update translation-coverage tests. Verify: the locale tests pass and no English text remains in de/es/fr.

## 6. Verification

> Apply-time note (2026-10-01): the working tree already carries an uncommitted, user-side change to the api `event-occurrences.json` (Machine Hunt start moved to 2026-10-01T08:00Z), so Machine Hunt was live during verification. This session did not edit that file. The live desktop and mobile states were observed against it; upcoming-only and empty states, reduced-motion emulation and the fixture revert were not reachable without editing calendar data and remain open.

Data states: a live HSE (fixture), an upcoming-only calendar, and an empty calendar. The live state is not reachable with shipped data, so it needs the reversible local calendar fixture in the `tp-manual-ui-verification` skill (for example shifting the Machine Hunt start in the api `event-occurrences.json`). Editing that file needs the user's explicit permission at apply time; ask first and revert it afterwards. Run through the full Aspire stack.

- [ ] 6.1 Desktop verification (viewport at or above 768px): with a live fixture, the indicator on the HSE entry and Dailies in the side menu (expanded and collapsed), section menu and navigation dialog; the Home card beside Token Availability with all tokens visible (also at 768px), LIVE first then upcoming, whole-card click and keyboard open `/dailies/hse`; Home tour step; reduced-motion emulation shows no pulse; then upcoming-only and empty states.
- [ ] 6.2 Mobile verification (below 768px, via the same-origin 420px iframe method in the `tp-manual-ui-verification` skill, confirming the mobile layout renders): indicator on the Dailies bottom-bar icon, HSE section tab and drawer entries; the card stacked directly after Token Availability; tap opens `/dailies/hse`; Home tour step on mobile; upcoming-only and empty states.
- [ ] 6.3 Confirm the indicator disappears and the card falls back to empty or upcoming after the fixture is reverted. Verify: the fixture file has no diff.

## 7. Gates

- [x] 7.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check` in `tacticus-planner-apps`. Verify: all green.
- [x] 7.2 At sync, apply this change after `add-home-screen-event-tracking`, then run `openspec validate add-hse-live-indicators --strict` and review all artifacts before archive.

## Deferred / out-of-session

Archived with the following tasks left unchecked (archive explicitly authorised by the user). Tracking issue: not filed yet.

- 6.1 Desktop verification: needs a reversible live-HSE calendar fixture (and the user's permission to use one) to show the live indicator, Home card LIVE-first ordering, whole-card click/keyboard and Home tour step; also reduced-motion emulation (no pulse) and the upcoming-only and empty states. Not performed in-session.
- 6.2 Mobile verification (420px iframe method): same live fixture requirement for the Dailies bottom-bar, HSE section tab and drawer indicators, stacked card, tap-through, Home tour step on mobile, and upcoming-only and empty states. Not performed in-session.
- 6.3 Fixture revert check: depends on 6.1/6.2 having used a fixture; no fixture was applied in-session, so there is nothing to revert and nothing verified.
