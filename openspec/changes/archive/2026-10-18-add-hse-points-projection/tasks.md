# Tasks

Companion API change: `add-hse-points-projection` in `tacticus-planner-api` (applies first; serves `event-definitions[].config.hse`). Builds on `add-hse-instance-switcher`.

## 1. Catalog package

- [x] 1.1 Add zod schemas and types for `config.hse` (variants, tiers, milestones, repeat, trackers, unit filters, modifiers) to `packages/game-catalog/src/schemas/events.ts` and `types.ts`, plus `resolveHseVariant(definition, parameters)`; verify tests parse the Psyker Boost and Faction Boost payloads and resolve `hseVariant`, `targetFactionId` and `default`.

## 2. Feature libs

- [x] 2.1 Add `features/home-screen-event-points/lib/resolve-hse-scoring.ts` (tier from `plTier`, Default fallback); verify the High, Mid and single-tier scenarios.
- [x] 2.2 Add `lib/hse-token-supply.ts` (design D3); verify the upcoming and running worked examples token by token and a null bucket.
- [x] 2.3 Add `lib/hse-projection.ts` returning the D2 shape; verify every worked example of `hse-points-projection` with each intermediate value (target, remaining, tokens, points per unit, units to defeat, required average, projected points, milestones reached, points to next, repeats), Faction Boost summing, Faction Focus battles, Defeat Waves with an empty average, and target already reached.
- [x] 2.4 Add `lib/hse-description.ts` producing i18n keys and values per modifier and tracker (design D6); verify the Psyker Boost lines, Faction Boost, For the Emperor (enemy filter), Squig Smash (unit id) and an unknown tracker kind.

## 3. Model and UI

- [x] 3.1 Add `model/use-hse-projection-inputs.ts` (averages per definition and mode, points so far per instance, guarded `localStorage`, design D5); verify persistence across reload and isolation between definitions.
- [x] 3.2 Add `model/use-hse-projection.ts` reading definitions, player tokens, power level and roster; verify loading, failure, past, global and no-data states.
- [x] 3.3 Add `shop-rewards/@x/home-screen-event-points.ts` and `ui/milestone-grid.tsx` (incremental points, reward icon and quantity, tooltip, endless cell with cap, 5 / 3 columns); verify the Psyker Boost grid scenario and an unknown reward id.
- [x] 3.4 Add `ui/event-details.tsx` (`data-testid="hse-event-details"`, tier with tooltip, description with mobile Show more, global note, no-data state) and `ui/points-projection.tsx` (`data-testid="hse-projection"`, desktop table, mobile rows, inputs, notes for summed trackers, locked modes and the Warp Surge campaign hint); verify every scenario of `hse-event-details` and `hse-points-projection`.
- [x] 3.5 Export from `features/home-screen-event-points/index.ts`; verify `pnpm lint:fsd`.

## 4. Page, tour, i18n

- [x] 4.1 Compose details and projection in `pages/dailies/ui/hse-page.tsx` in the order and layout of the modified layout requirement; verify `hse-page.test.tsx` covers the modified empty-state scenarios.
- [x] 4.2 Add tour steps for details, milestones and projection to `hse-page.tutorial.tsx` (desktop and mobile) with `tour.hse.steps.*` keys; verify the tutorial test at one viewport below and one at or above 768px.
- [x] 4.3 Add all new copy and description templates to `dailies.json` in en, de, es and fr with real translations; verify `dailies-translations.test.ts`.

## 5. Shared verification

Data states: a synced account at High tier and one at Mid tier (or fixtures); a running and an upcoming Personal event (Psyker Boost, fixture clock); Faction Boost; Operation Imperator; Against the Tide; Arsenal of War; a null Onslaught bucket.

- [ ] 5.1 Numbers on screen match the worked examples for the fixture buckets.
- [ ] 5.2 Averages and points so far persist across reload.

## 6. Desktop verification (>= 768px)

- [ ] 6.1 Details and projection side by side; 5-column grid; table layout; tour steps.
- [ ] 6.2 Warp Surge: projection above the raid lists with the campaign hint.

## 7. Mobile verification (< 768px, 420px iframe)

- [ ] 7.1 Stacked sections, 3-column grid, collapsed description with Show more, row layout for modes; tour steps.

## 8. Gates

- [x] 8.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check`.
