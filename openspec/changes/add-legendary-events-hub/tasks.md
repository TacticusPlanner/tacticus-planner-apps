# Tasks

## 1. Package queries

- [x] 1.1 Add `getLegendaryEvents()`, `getLegendaryEvent(id)` and `getLegendaryEventCommon()` to `packages/game-catalog/src/queries.ts` (named, `useLiveQuery`-safe, typed from the existing `lre` storage models, each with a one-line comment naming the pending `lres` / `lre-common` rename) and verify a new `queries.legendary-events.test.ts` seeds the datasets and asserts each query's result, including `getLegendaryEventCommon()` returning `null` on an empty store.
- [x] 1.2 Add `getLegendaryEventsProgress()` and `getLegendaryEventProgress(eventId)` to `packages/player-data/src/queries.ts` over the `lre-progress` chunk and verify tests cover a present event, an absent event returning `undefined`, and an empty chunk.
- [x] 1.3 Move `formatEventCountdown` and its test from `pages/home/ui/events-widget` to `shared/lib` (exported from `shared/lib/index.ts`), update the events widget import, and verify the moved test and `home-events-widget.test.tsx` pass unchanged.

## 2. `entities/legendary-event` domain

- [x] 2.1 Create `entities/legendary-event/model/types.ts` and `lib/lifecycle.ts` (`LEGENDARY_EVENT_RUN_DURATION_MS`, `deriveLegendaryEventLifecycle`, `orderLegendaryEventsForHub`) and verify `lifecycle.test.ts` covers: active inside the 7-day window, the boundary instants (`start` active, `start + 7d` not), upcoming with the earliest future date, archived by `finished`, archived by expiry, and hub ordering (active, upcoming ascending, archived by name).
- [x] 2.2 Create `lib/next-points-milestone.ts` and `lib/lane-label.ts` (`laneAllowedRule`) and verify tests cover the first milestone above 3,410 (3,500, +60), `undefined` past the last milestone, and "No Xenos" / "No Chaos or Orks" rules from real `allowedUnitsFilter` values.
- [x] 2.3 Create the hooks `use-legendary-events.ts`, `use-legendary-event.ts`, `use-legendary-events-progress.ts`, `use-legendary-event-progress.ts`, `use-legendary-event-common.ts` (status objects over `useLiveQuery`, minute tick for lifecycle) and `use-objective-label.ts` (label + icon per design D6 with the catalog `name` fallback), export the public API from `entities/legendary-event/index.ts`, and verify hook tests (mocked package queries) cover loading, error, ready, and the label hook's trait / damage / faction / alliance / hits / attack-type / fallback branches in `en` and `de`.

## 3. i18n

- [x] 3.1 Add the `legendaryEvents` namespace (`apps/web/public/locales/{en,de,es,fr}/legendaryEvents.json`) with hub headings and states, run-status labels, objective templates (`objective.minHits`, `maxHits`, `ranged`, `melee`, `not`), lane labels, lane overview copy and the "how points work" paragraph, and `tour.hub.*` / `tour.event.*` step copy; register it in `shared/config/i18n/i18next.d.ts`; add `legendary-events-translations.test.ts` asserting equal key sets and no empty values across the four locales; verify de/es/fr carry real translations at the quality of `dailies.json`.
- [x] 3.2 Add `nav.events`, `nav.eventsDescription`, `events.tabs.legendaryEvents`, `events.tabs.legendaryEventsDescription` and the widened Home card keys (`home.events.title` → "Events", `home.events.run`, `home.events.points`, `home.events.sourceFailed`, `home.events.openHse`, `home.events.openLegendaryEvents`) to `common.json` in all four locales with real translations, extend `NavLabelKey` / `NavDescriptionKey`, and verify `common-translations.test.ts` key-parity passes.
- [x] 3.3 Update `events:tour.home.steps.hseWidget.*` copy in all four locales to describe both event types (rename the key to `eventsWidget`), and verify the Home tutorial translation assertions pass.

## 4. Navigation and routes

- [x] 4.1 Add the Events `NavItem` (path `/events`, `CalendarDays` icon, `anonymousAllowed: false`, `mobilePlacement: "menu"`, one child `/events/legendary-events` with `isLandingPage: true`) after Progress in `nav-items.ts`, and verify `desktop-layout.test.tsx`, `mobile-layout.test.tsx`, `navigation-filter.test.ts`, `use-section-entry-path.test.ts` and `section-tabs.test.tsx` are updated for the extra section (link counts, anonymous filtering, search match on "legendary", landing-page tab return from `/events/legendary-events/:eventId`).
- [x] 4.2 Create `pages/events/` with `index.ts` (`EventsLayout`, `routes`), `route.tsx` (index redirect to `/events/legendary-events`, lazy hub and `legendary-events/:eventId`), `ui/events-layout.tsx`, and wire `/events` under `ProtectedRoute` in `app/routes.tsx`; verify a route test covers the redirect (replace, not push), the hub route, the detail route, and that an anonymous user is bounced like Plan.
- [x] 4.3 Add the Events section to `general.tutorial.tsx`'s sections step copy (desktop and mobile) and the matching `common:tour.steps.*` keys in four locales; verify `general.tutorial.test.tsx` passes.

## 5. Legendary Events hub

- [x] 5.1 Build `pages/events/ui/legendary-events-hub/legendary-events-hub-page.tsx` (orchestrator over `useLegendaryEvents` + `useLegendaryEventsProgress`, `orderLegendaryEventsForHub`, minute tick) with `legendary-event-card.tsx` (portrait via `characterIcon`, name via `useUnitName`, lifecycle timing, run / tokens / points for the active event, "synced data unavailable") and the skeleton, error-with-retry and no-active-event bodies; verify `legendary-events-hub-page.test.tsx` covers ordering, the active row's synced state, the active row without a synced entry, the upcoming row's local start, the no-active line, catalog pending, catalog failure + retry, player data unavailable, and navigation on card activation.
- [x] 5.2 Verify a 1280px and a 390px render test assert the card grid vs stacked list and no horizontal overflow.

## 6. Legendary Event page

- [x] 6.1 Build `pages/events/ui/legendary-event/legendary-event-page.tsx` (orchestrator: `useLegendaryEvent(eventId)`, `useLegendaryEventProgress`, `useLegendaryEventCommon`, manifest `syncedAt`; unknown id → replace to the hub; mobile lane-selector state keyed by `eventId`; `laneIds` passed to lane-scoped sections) with `legendary-event-page.view-model.ts`, and verify `legendary-event-page.test.tsx` covers known event, unknown id replace, section order, selector default Alpha and reset on event change.
- [x] 6.2 Build `run-status-card.tsx` (run, tokens + next token, points, currency, chests claimed, shards, next milestone line, run timing, "Synced X ago", no sync button) with the no-entry and synced-unavailable bodies; verify `run-status-card.test.tsx` reproduces the spec's populated example ("Run 1 of 3", "3/12", "1 hr 30 min", "90 points to milestone 14 (+60 currency)"), the absent-entry body, and the 25-minute synced age.
- [x] 6.3 Build `lane-overview.tsx` (lane label with allowed-alliance rule, kill points, five objective chips via `useObjectiveLabel`, battle count, `battlesPoints` bar row, collapsed "how points work" disclosure) and verify `lane-overview.test.tsx` renders Lysander Alpha's five chips with scores, the "Alpha · No Xenos" label, the 18-bar ladder, and a German label for `No Resilient`.
- [x] 6.4 Compose `legendary-event-desktop-page.tsx` (three lane panels) and `legendary-event-mobile-page.tsx` (shared `Tabs` selector, one lane) and verify render tests at 1280px assert three lane panels and no selector, and at 390px assert the selector and a single lane.

## 7. Home events widget

- [x] 7.1 Add `pages/home/ui/events-widget/select-home-event-rows.ts` (merge HSE selection and Legendary Event lifecycle into `HomeEventRow[]`: live first, then by start, cap three) and verify `select-home-event-rows.test.ts` covers the spec's live-HSE + live-LE + one-upcoming case, only-upcoming ordering across types, the cap, and the timezone-independence of ordering.
- [x] 7.2 Rework `home-events-widget.tsx`: title "Events", rows as buttons with type icon and accent, per-row navigation (`/dailies/hse` or `/events/legendary-events/:eventId`), card no longer a button, Legendary rows showing run number and points when synced, loading when either source pending, per-source inline failure note, error body only when both fail, empty body with the two links; verify `home-events-widget.test.tsx` covers each state and navigation, and `home-page.test.tsx` layout assertions still pass.
- [x] 7.3 Update `home-page.tutorial.tsx` (step key `eventsWidget`, same target) and verify `home-page.tutorial.test.tsx` passes.

## 8. Tours

- [x] 8.1 Add `legendary-events-hub.tutorial.tsx` (active group or no-event line, one upcoming row; desktop and mobile) and `legendary-event.tutorial.tsx` (run status, lane overview; mobile adds the lane selector first), register both via `useTourPageSteps`, and verify tutorial tests assert every step target exists on the rendered desktop and mobile pages.

## 9. Desktop verification (viewport ≥ 768px)

- [ ] 9.1 Start the full stack through the workspace Aspire AppHost, wait for `web` and `api` healthy, sign in with an account whose synced `lre-progress` has an entry for an active or recent event (required data states: synced roster with at least one Legendary Event entry, and an event with no entry), and verify at 1280px: the Events sidebar item lands on the hub; the hub groups and orders events; the active card shows run, tokens and points; `/events` redirects; an unknown id returns to the hub. Record browser evidence.
- [ ] 9.2 On the event page at 1280px verify Run status values match the in-game values for the signed-in account, three lane panels render, objective chips show localized labels and icons in `en` and `de`, and the "how points work" disclosure opens; run the hub and event page tours and verify every step targets a visible element.
- [ ] 9.3 On Home at 1280px verify the Events card lists live and upcoming rows of both types, each row navigates to its destination, and light and dark themes render the row accents legibly.

## 10. Mobile verification (viewport < 768px)

- [ ] 10.1 Using a same-origin 420px iframe on the signed-in app origin (per the `tp-manual-ui-verification` skill), verify the Menu drawer lists Events › Legendary Events, the bottom bar is unchanged, the hub renders stacked cards, and the header tab returns from an event detail to the hub.
- [ ] 10.2 On the event page at 420px verify the Alpha / Beta / Gamma selector drives the Lane overview, defaults to Alpha, resets when opening another event, and there is no horizontal page scroll; run the event page tour and verify the selector step comes first. Record evidence.
- [ ] 10.3 Verify the Home Events card at 420px stacks after Token Availability, rows tap through to their destinations, and the countdowns tick.

## 11. Integration and gates

- [x] 11.1 Run `pnpm lint:fsd` and verify `entities/legendary-event` imports no feature or page, `pages/events` and `pages/home` import it only through its index, and no page imports another page.
- [x] 11.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.

## Workflow follow-up

- Open the apps PR, wait for CI and CodeRabbit, triage comments, then `/opsx:sync` and `/opsx:archive` this change inside `tacticus-planner-apps`.
- Bump the `tacticus-planner-apps` submodule pin in `tacticus-planner-dev` after merge.
- Start `add-legendary-event-progress` once this change is merged.
