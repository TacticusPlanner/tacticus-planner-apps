## 1. Backend: authored event data (tacticus-planner-api)

> Groups 1-3 (backend) were implemented and shipped as a separate, mirrored OpenSpec change in the
> `tacticus-planner-api` repo — `add-game-events-calendar-dataset` (that repo's own
> `openspec/changes/add-game-events-calendar-dataset/`), since this change's apply session can only edit
> within `tacticus-planner-apps`. See [tacticus-planner-api#38](https://github.com/TacticusPlanner/tacticus-planner-api/pull/38).
> One deviation from the original task wording below: `eventOccurrences` is **not** served directly (only
> `eventDefinitions` and `eventsCalendar` are) — see that change's design.md Decision 1.

- [x] 1.1 Add `Data/events/event-definitions.json` covering: `campaign-event`, `incursion`, `legendary-event`, `always-double-xp-sunday`, `always-double-gold-saturday` (all `Fixed` recurrence, per design.md Decision 3), plus `new-character-event`, `game-version-release`, every currently-known `hse-*` definition (including `hse-faction-boost` with `requiredParameters: ["targetFactionId"]` and `hse-faction-focus` with none, per design.md Decision 6), and every current Tournament Arena ruleset definition (all `None` recurrence).
- [x] 1.2 Add `Data/events/event-occurrences.json` seeded with currently-known real occurrences (author from whatever's actually announced/scheduled at implementation time), including `parameters` satisfying each referenced definition's `requiredParameters`.
- [x] 1.3 Add `eventDefinitions`, `eventOccurrences`, and `eventsCalendar` dataset key entries to `Models/GameCatalogDatasets.cs`.
- [x] 1.4 Extend `GameCatalogLoader.cs` to load the two new raw JSON files.

## 2. Backend: denormalization & projection

- [x] 2.1 Implement `Fixed`-kind recurrence projection in a new `Denormalization` unit: for each `Fixed`-recurrence definition, generate placeholder occurrences filling every slot from now through 15 weeks ahead, using its `intervalDays`/`durationDays`.
- [x] 2.2 Implement reconciliation: an authored occurrence covering the same window as a projected slot for the same definition supersedes that placeholder.
- [x] 2.3 Implement `eventsCalendar` date-index expansion: build a date-keyed map from the merged (authored + projected) occurrence set; each entry is self-contained (`occurrenceId` nullable, `definitionId`, `confirmed`, `startUtc`, `endUtc`, `parameters`); an occurrence spanning multiple dates is repeated under every date it spans.
- [x] 2.4 Unit test the projection/reconciliation: a slot exactly at the 15-week boundary and just past it, an authored occurrence superseding its placeholder, a `None`-kind definition never appearing without an authored occurrence, a multi-day occurrence appearing on every spanned date, and `always-double-xp-sunday`/`always-double-gold-saturday` appearing on every Sunday/Saturday within the window.

## 3. Backend: validation & manifest

- [x] 3.1 Extend `Validation/*.cs` to cross-reference every occurrence's `definitionId` against `eventDefinitions`, and to fail the build when an occurrence omits a value for any of its definition's `requiredParameters`.
- [x] 3.2 Register `eventDefinitions`, `eventOccurrences`, and `eventsCalendar` in `GameCatalogHashing.cs` for manifest hashing.
- [x] 3.3 Add served endpoints for the three new dataset keys via the existing `ServedDatasetEndpoint<T>` pattern in `GetGameCatalogDatasetEndpoints.cs`.
- [x] 3.4 Update the Verify-based manifest snapshot test to cover the new datasets.

## 4. Client: game-catalog package dataset wiring

- [x] 4.1 Add `eventDefinitions` and `eventsCalendar` to `servedDatasetKeys` (`dataset-keys.ts`).
- [x] 4.2 Add zod schemas for both datasets, including the `Fixed`/`None` recurrence union and per-definition-type `parameters` shapes (`schemas/*.ts`). Deviation: `events-calendar`'s served payload is date-indexed (`z.record`), not a plain array like every other dataset — the one exception, documented in `schemas/events.ts`.
- [x] 4.3 Add corresponding inferred types to `record-types.ts`.
- [x] 4.4 Dexie tables for both new keys are picked up automatically — `game-catalog-storage.ts` builds its `EntityTable`s generically from `servedDatasetKeys`, no per-key declaration needed.
- [x] 4.5 Extend `game-catalog.mapper.ts` for the two new datasets — `event-definitions` is a plain-array passthrough; `events-calendar` gets a new `byCalendarDate` transform flattening the date-indexed payload into one row per (date, entry) pair, injecting `date` and a composite id.
- [x] 4.6 Confirmed `game-catalog-api.ts`/`game-catalog-sync.ts` need no dataset-specific branching — both are fully generic over `servedDatasetKeys`/`datasetPayloadSchemas`; the existing `game-catalog-sync.test.ts` fixture (which derives its manifest from `servedDatasetKeys`) already exercises the two new keys and still passes.

## 5. Client: active/upcoming event selectors

- [x] 5.1 Add `queries.ts` selectors: `getEventDefinitions`/`getEventDefinitionsMap`, `getEventsActiveAt`/`getEventsActiveNow`, `getUpcomingEvents` — each deduping by occurrence identity across the per-date storage rows a multi-day entry produces.
- [x] 5.2 Unit test the selectors (`queries.events.test.ts`): active-window boundary (inclusive start, exclusive end), confirmed vs. projected entries both returned, and a multi-day occurrence not duplicated when a query range spans several of its dates. Also `game-catalog.mapper.test.ts` for the flattening transform itself.

## 6. Client: home page calendar UI

- [x] 6.1 Build the calendar view for `apps/web/src/fsd/pages/home`, rendering `eventsCalendar` for a date range, desktop layout. Implemented as a 7-column week grid (`ui/events-calendar/desktop/events-calendar-desktop.tsx`); a full month-grid Calendar primitive doesn't exist in this repo's shadcn set and wasn't required by design.md's Non-Goals (exact visual layout deferred to implementation).
- [x] 6.2 Build the mobile layout (below the 768px breakpoint) — not just a reflow of desktop, per this app's desktop/mobile convention. Implemented as stacked day sections showing only days with entries (`ui/events-calendar/mobile/events-calendar-mobile.tsx`), genuinely different from the 7-column grid, following the Character Lookup desktop/mobile split pattern (`useIsMobile()` branching, separate files).
- [x] 6.3 Visually distinguish confirmed occurrences from projected (unconfirmed) placeholders — a "Confirmed"/"Projected" badge on every `EventEntryCard`.
- [x] 6.4 Visually indicate entries active at the current time — a "Live now" badge plus a highlighted border/background, computed client-side from `startUtc`/`endUtc` vs. now.
- [x] 6.5 Add date-range navigation: forward within the projection horizon, and backward into authored/archived occurrences. Rolling 7-day window (`useEventsCalendar`'s `weekOffset`), unbounded in both directions since `getUpcomingEvents` has no lower bound and the UI doesn't cap `weekOffset`.
- [x] 6.6 Add distinct loading, load-failure, and empty-range states (`events-calendar-state.tsx`, mirroring Dailies' `RaidState` pattern). Note: total game-catalog sync failure is already handled globally by `GameCatalogInitGate` before any page mounts; this page-level failure state covers a page-local read failure after that gate has passed — `useEventsCalendar`'s querier catches internally and resolves a tagged result, since `useLiveQuery` itself throws to an error boundary on a rejected promise rather than returning an error value.
- [x] 6.7 Replace `home-page.tsx`'s placeholder content with the calendar as the page's primary content; retained the tour-trigger button (now in a header row with the page title).

## 7. i18n & icon mapping

- [x] 7.1 Added a new `events` i18n namespace (`apps/web/public/locales/{en,de,es,fr}/events.json`) covering every event definition id and non-character/non-faction parameter value; reused the existing `characters`/`factions` namespaces for `featuredCharacterId`/`targetFactionId` values via `resolve-event-display.ts`. Registered the namespace's TS resource type in `i18next.d.ts`.
- [x] 7.2 Added id-based icon mapping — `event-type-icon.tsx` resolves a lucide-react icon from the definition's `type` (no real icon assets exist for event content yet, so a small generic set rather than per-definition artwork).
- [x] 7.3 Ported the namespace's keys to `de`, `es`, and `fr`.
- [x] 7.4 Added `events-translations.test.ts` (key-parity across locales), mirroring `dailies-translations.test.ts`.

## 8. Joyride tutorial

- [x] 8.1 Added `home-page.tutorial.tsx` covering the new calendar (title, navigation, confirmed-vs-projected), identical steps both platforms (mirroring `today.tutorial.tsx`'s simpler pattern, since nothing here differs meaningfully by viewport).
- [x] 8.2 Added the corresponding `tour.home.steps.*` i18n keys across all locales (inside `events.json`, since that's what `HomePage` now primarily uses).
- [x] 8.3 Added `home-page.tutorial.test.tsx` covering the new/changed steps (asserts localized desktop/mobile step parity and exact `data-testid` targets), mirroring `projects-list-page.tutorial.test.tsx`.

## 9. Verification

- [x] 9.1 Manual verification via the real local stack (`aspire start`), signed in with a real (pre-existing) session — confirmed against **real, live backend data**, not fixtures: the calendar rendered actual confirmed occurrences and actual server-projected placeholders (`events-calendar` legitimately spanned 2026-05-28 through 2026-12-02, ~15 weeks past the live "now"), "Live now"/"Confirmed"/"Projected" badges rendered correctly, week navigation (`<`/`Today`/`>`) worked, today's column was highlighted. Caught and fixed a real bug this way: the desktop card's icon+name+badges-in-one-row layout left ~0px for the event name once two badges were present, and the 7-column grid overflowed the viewport instead of shrinking (CSS Grid's implicit `minmax(auto, ...)` track sizing takes the non-shrinkable `Badge` content as a hard minimum) — fixed by stacking name/badges vertically in `EventEntryCard` and adding `min-w-0` to each day column. **Not verified**: a true desktop-width (≥768px) screenshot — the browser tool's `resize_window` reported success but the viewport stayed pinned at mobile width for the rest of the session (tool/environment issue, not a code issue); mobile-width rendering, the grid-overflow fix's correctness, and the code path itself were confirmed by direct inspection instead. A multi-day-span visual check, an empty-range state, and a load-failure state were not separately walked through interactively (covered by `events-calendar.test.tsx`/`events-calendar-calc.test.ts` instead, which do exercise multi-day spanning, the empty state, and the caught-error status).
- [x] 9.2 No regression: the tour-trigger button is still present (now beside the page title) and functions the same way (`useTour().startTour()`); full existing test suite (693 tests) still passes, including anything exercising `pages/home`'s public API.
- [x] 9.3 `pnpm test:run` (693/693 web, 51/51 game-catalog), `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check` (line-ending warnings only) all pass in `tacticus-planner-apps`; `dotnet build`/`dotnet test` pass in `tacticus-planner-api` (one confirmed pre-existing, unrelated failure — see that change's tasks.md 7.6).
