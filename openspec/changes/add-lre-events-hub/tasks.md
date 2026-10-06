# Tasks

## 1. Package queries

- [ ] 1.1 Add `getLres()`, `getLre(id)` and `getLreCommon()` to `packages/game-catalog/src/queries.ts` (named, `useLiveQuery`-safe, typed from the existing `lre` storage models) and verify a new `queries.lre.test.ts` seeds the three split datasets and asserts each query's result, including `getLreCommon()` returning `null` on an empty store.
- [ ] 1.2 Add `getLreProgress()` and `getLreProgressForEvent(eventId)` to `packages/player-data/src/queries.ts` and verify `queries.test.ts` (or a new `queries.lre.test.ts`) covers a present event, an absent event returning `undefined`, and an empty chunk.
- [ ] 1.3 Move `formatEventCountdown` and its test from `pages/home/ui/events-widget` to `shared/lib` (exported from `shared/lib/index.ts`), update the events widget import, and verify the moved test and `home-events-widget.test.tsx` pass unchanged.

## 2. `entities/lre` domain

- [ ] 2.1 Create `entities/lre/model/types.ts` and `lib/lifecycle.ts` (`LRE_STAGE_DURATION_MS`, `deriveLreLifecycle`, `orderLresForHub`) and verify `lifecycle.test.ts` covers the spec scenarios: active inside the 7-day window, upcoming with earliest future date, archived by `finished`, archived by expiry, hub ordering (active, upcoming asc, archived by name), and the boundary instants `start` (active) and `start + 7d` (not active).
- [ ] 2.2 Create `lib/damage-profile-exclusions.ts` (`votanChampion` → Psychic / Direct / DirectDamage, `thousSekhetar` → Psychic; `unitDealtDamageTypes`) and `lib/restriction-match.ts` (`matchesLreFilter`, `isUnitAllowedOnTrack`, `restrictionsSatisfied`), and verify `restriction-match.test.ts` covers every kind in the spec table with real catalog records (`bloodDante`, `votanChampion`, `astarLysander`), `exclude` inversion, ranged-over-melee hits, the DirectDamage exclusion, and an unknown kind returning `false`.
- [ ] 2.3 Add a catalog-wide guard test that loads the real `lres` dataset fixtures (the three served events) and asserts every `allowedUnitsFilter` and `unitsRestrictions` kind is in the supported set and every filter target for `Trait` / `DamageType` / `Faction` resolves to at least one catalog character; verify it passes today and fails when a fixture is given `kind: "NoSummons"`.
- [ ] 2.4 Create `lib/unit-potential.ts` (`unitTrackPotential`, `buildTrackLeaderboard` with owned / locked / unknown ownership and default ordering points → slots → name) and verify `unit-potential.test.ts` reproduces the spec's worked example (Dante on Lysander Alpha = 152 points, 2 slots), the not-allowed case (0 / 0, excluded from rows), and the default order C, B, A.
- [ ] 2.5 Create `lib/track-points-model.ts` and `lib/synced-track-progress.ts` (`buildTrackPointsModel`, `buildSyncedTrackProgress`, `nextPointsMilestone`) and verify `track-points-model.test.ts` reproduces 471 for Lysander Alpha battle 1 and 9,000 for the track, and `synced-track-progress.test.ts` covers the partially cleared battle (`[0,2,3]`, 238 of 471), the complete battle (six indices), battles beyond the encounters (0 points, nothing cleared), a `null` lane, an absent event entry, and `nextPointsMilestone` returning the first milestone above 3,410 (3,500, +60) and `undefined` past the last milestone.
- [ ] 2.6 Create `model/use-lres.ts`, `model/use-lre.ts`, `model/use-lre-progress.ts` (status objects over `useLiveQuery`, minute tick for lifecycle) and `model/use-lre-restriction-label.ts` (label + icon per D7, catalog `name` fallback), export the slice's public API from `entities/lre/index.ts`, and verify hook tests (mocked package queries) cover loading, error, ready, and the label hook's trait / damage / faction / alliance / hits / attack-type / fallback branches in `en` and `de`.

## 3. i18n

- [ ] 3.1 Add the `lre` namespace (`apps/web/public/locales/{en,de,es,fr}/lre.json`) with page titles, hub headings and states, round-status labels, restriction templates (`restriction.minHits`, `maxHits`, `ranged`, `melee`, `not`), track labels, leaderboard headers and controls, progress headers and the "how points work" paragraphs, and `tour.lreHub.*` / `tour.lreEvent.*` step copy; register it in `shared/config/i18n/i18next.d.ts`, add an `lre-translations.test.ts` asserting equal key sets and no empty values across the four locales, and verify de/es/fr carry real translations at the quality of `dailies.json`.
- [ ] 3.2 Add `nav.events`, `nav.eventsDescription`, `events.tabs.lre`, `events.tabs.lreDescription` and `home.lre.*` (title, live, stage, pointsToMilestone, noProgress, syncedUnavailable, empty, error, loading) to `common.json` in all four locales with real translations, extend `NavLabelKey` / `NavDescriptionKey`, and verify `common-translations.test.ts` key-parity passes.
- [ ] 3.3 Add `events:tour.home.steps.lre.title|content` in all four locales for the new Home tour step and verify the Home tutorial translation assertions include it.

## 4. Navigation and routes

- [ ] 4.1 Add the Events `NavItem` (path `/events`, `CalendarDays` icon, `anonymousAllowed: false`, `mobilePlacement: "menu"`, one child `/events/lre` with `isLandingPage: true`) after Progress in `nav-items.ts`, and verify `desktop-layout.test.tsx`, `mobile-layout.test.tsx`, `navigation-filter.test.ts`, `use-section-entry-path.test.ts` and `section-tabs.test.tsx` are updated for the extra section (link counts, anonymous filtering, search match on "legendary", landing-page tab return from `/events/lre/:eventId`).
- [ ] 4.2 Create `pages/events/` with `index.ts` (`EventsLayout`, `routes`), `route.tsx` (index redirect to `/events/lre`, lazy `lre` and `lre/:eventId`), `ui/events-layout.tsx`, and wire `/events` under `ProtectedRoute` in `app/routes.tsx`; verify a route test covers the redirect (replace, not push), the hub route, the detail route, and that an anonymous user is bounced like Plan.
- [ ] 4.3 Add the Events section to `general.tutorial.tsx`'s sections step copy (desktop and mobile) and the matching `common:tour.steps.*` keys in four locales; verify `general.tutorial.test.tsx` passes.

## 5. LRE hub page

- [ ] 5.1 Build `pages/events/ui/lre-hub/lre-hub-page.tsx` (orchestrator over `useLres` + `useLreProgress`, `orderLresForHub`, minute tick) with `lre-hub-card.tsx` (portrait via `characterIcon`, name via `useUnitName`, lifecycle timing, stage / tokens / points for the active event) and the skeleton, error-with-retry, and no-active-event bodies; verify `lre-hub-page.test.tsx` covers ordering, the active row's synced state, the no-active line, catalog pending, catalog failure + retry, player data unavailable, and navigation on card activation.
- [ ] 5.2 Build the desktop grid and mobile stacked forms of the hub (one component with responsive classes is acceptable here since only layout reflows) and verify a 1280px and a 390px render test assert the card grid vs stacked list and no horizontal overflow.

## 6. LRE event page

- [ ] 6.1 Build `pages/events/ui/lre-event/lre-event-page.tsx` (orchestrator: `useLre(eventId)`, `useLreProgressForEvent`, `useLreCommon`, roster via `getPlayerCharacters`, manifest `syncedAt`; unknown id → replace to `/events/lre`; mobile track-selector state keyed by `eventId`; shared sort/filter state) with `lre-event-page.view-model.ts`, and verify `lre-event-page.test.tsx` covers known event, unknown id replace, section order, selector default Alpha and reset on event change, and sort/filter shared across tracks.
- [ ] 6.2 Build `round-status-card.tsx` (stage, tokens + next token, points, currency, chests claimed, shards, next milestone line, stage timing, "Synced X ago", no sync button) with the no-entry and synced-unavailable bodies; verify `round-status-card.test.tsx` reproduces the spec's populated example ("Stage 1 of 3", "3/12", "1 hr 30 min", "90 points to milestone 14 (+60 engrams)"), the absent-entry body, and the 25-minute synced age.
- [ ] 6.3 Build `track-overview.tsx` (track label with allowed-alliance rule, kill points, five restriction chips via `useLreRestrictionLabel`, battle count, collapsed "how points work" disclosure) and verify `track-overview.test.tsx` renders Lysander Alpha's five chips with points and the "Alpha · No Xenos" label, and a German label for `No Resilient`.
- [ ] 6.4 Build `leaderboard/leaderboard-table.tsx` (desktop) and `leaderboard/leaderboard-list.tsx` (mobile) over `buildTrackLeaderboard`, with the sort control, "Only unlocked" toggle, locked marker, `RarityIcon` / `RankBadge`, per-restriction indicators with accessible text, and the no-eligible-units and roster-not-synced bodies; verify `leaderboard.test.tsx` covers default order, owned vs locked rendering, Only-unlocked filtering across tracks, roster unavailable (toggle disabled), and that the table has sortable headers while the list has the compact bar.
- [ ] 6.5 Build `progress/progress-grid.tsx` (desktop 18×6 grid) and `progress/progress-rows.tsx` (mobile compact rows with sticky icon header) over `buildSyncedTrackProgress`, with the track header "earned / max" + progress bar, per-row points and high score, accessible cleared text, and the null-lane and absent-event bodies; verify `progress-grid.test.tsx` covers the partially cleared row (238 / 471, high score 31), the complete row, rows beyond the encounters, a null lane, "3,410 / 9,000" header, and the sr-only cleared / not-cleared text.
- [ ] 6.6 Compose `lre-event-desktop-page.tsx` (three-column track sections) and `lre-event-mobile-page.tsx` (shared `Tabs` selector, one track) and verify render tests at 1280px assert three track columns and no selector, and at 390px assert the selector and a single track per section.

## 7. Home card

- [ ] 7.1 Build `pages/home/ui/lre-widget/home-lre-widget.tsx` over `useLres` + `useLreProgress` + `useLreCommon` (active else earliest upcoming; LIVE badge; stage; "ends in" / "starts in"; points and points-to-milestone; no-progress, synced-unavailable, skeleton, error, empty bodies; whole-card button navigating to the event or hub), add it to `home-page.tsx` as a new `md:grid-cols-2` row before the calendar, and verify `home-lre-widget.test.tsx` covers the spec's active, upcoming-only, no-entry, loading, error and empty scenarios plus click and keyboard navigation, and `home-page.test.tsx` asserts the new row's position on desktop and mobile.
- [ ] 7.2 Add the `home-lre-widget` step to `home-page.tutorial.tsx` between the raids and calendar-navigation steps and verify `home-page.tutorial.test.tsx` asserts the target exists.

## 8. Tours

- [ ] 8.1 Add `pages/events/ui/lre-hub/lre-hub.tutorial.tsx` (`useLreHubTutorial`: active group or no-event line, one upcoming row; desktop and mobile) and `pages/events/ui/lre-event/lre-event.tutorial.tsx` (`useLreEventTutorial`: round status, track overview, leaderboard, progress grid; mobile adds the track selector first), register both via `useTourPageSteps`, and verify tutorial tests assert every step target exists on the rendered desktop and mobile pages.

## 9. Desktop verification (viewport ≥ 768px)

- [ ] 9.1 Start the full stack through the workspace Aspire AppHost, wait for `web` and `api` healthy, sign in with an account whose synced `lre-progress` has an entry for an active or recent event (required data state: synced roster + at least one LRE entry; also exercise an event with no entry), and verify at 1280px: the Events sidebar item lands on `/events/lre`; the hub groups and orders events; the active card shows stage, tokens and points; `/events` redirects; an unknown id returns to the hub. Record browser evidence.
- [ ] 9.2 On the event page at 1280px verify Round status values match the in-game values for the signed-in account, three track columns render for each section, leaderboard sorting and "Only unlocked" work across all three tracks, restriction chips show localized labels and icons in `en` and `de`, and the progress grid's cleared cells and per-battle points match the game; **assert D4**: for at least three battles with partial clears, the cleared cells implied by `objectivesCleared` sum (with kill/high score) to the synced `encounterPoints`; record the comparison.
- [ ] 9.3 Run the hub and event page tours at 1280px and verify every step targets a visible element; verify the Home card shows the active event and opens its page; light and dark themes render chips, badges and the grid legibly.

## 10. Mobile verification (viewport < 768px)

- [ ] 10.1 Using a same-origin 420px iframe on the signed-in app origin (per the `tp-manual-ui-verification` skill), verify the Menu drawer lists Events › Legendary Events, the bottom bar is unchanged, the hub renders stacked cards, and the header tab returns from an event detail to the hub.
- [ ] 10.2 On the event page at 420px verify the Alpha / Beta / Gamma selector drives all three sections, defaults to Alpha, resets when opening another event, the leaderboard renders row cards with the compact sort/filter bar, the progress rows show the sticky icon header, and there is no horizontal page scroll; run the event page tour and verify the selector step comes first. Record evidence.
- [ ] 10.3 Verify the Home card at 420px renders full width before the calendar, ticks its countdown, and opens the event page on tap.

## 11. Integration and gates

- [ ] 11.1 Run `pnpm lint:fsd` and verify `entities/lre` imports no feature or page, `pages/events` and `pages/home` import `entities/lre` only through its index, and no page imports another page.
- [ ] 11.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.

## Workflow follow-up

- Open the apps PR, wait for CI and CodeRabbit, triage comments, then `/opsx:sync` and `/opsx:archive` this change inside `tacticus-planner-apps`.
- Bump the `tacticus-planner-apps` submodule pin in `tacticus-planner-dev` after merge.
- Note in `tacticus-planner-docs` (LRE plan Stage 1) the D4 verification result and whether the API must carry an objective map before Stage 3.
