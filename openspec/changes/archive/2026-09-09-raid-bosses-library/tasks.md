## 1. Client game-catalog package: dataset layer

- [x] 1.1 `raid-bosses` added to `servedDatasetKeys` (dataset key, sync participation — the sync/store pipeline is key-driven). Covered by `queries.raid-bosses.test.ts` (mocked `replaceGameCatalogDataset` writes + reads back).
- [x] 1.2 `raidBossesPayloadSchema` in `schemas/raid-bosses.ts` (validates `seasonConfigRotation`, `bosses[]`, `primes[]`, `seasons{}` + nested per the API companion's `specs/raid-bosses-dataset`), registered in `datasetPayloadSchemas`. Non-array payload, like `events-calendar`.
- [x] 1.3 `catalogDbVersion` bumped 5 → 6 (the `.stores()` block is derived from `servedDatasetKeys`, so it now lists `raid-bosses`; Dexie's version cascade creates the store for older clients, preserving other datasets — same mechanism as the shops v4→v5 bump).
- [x] 1.4 `getRaidBosses()` (single-row payload, `null` when never synced) and `getRaidBossRoster()` (bosses/primes split + `byId`) added to `@workspace/game-catalog/queries`. Covered by `queries.raid-bosses.test.ts`: split lists, known-id lookup, unknown-id `undefined`, `null` before sync.

## 2. Client game-catalog package: id resolution helpers

- [~] 2.1 **Deferred to [#122](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/122).** Portrait/icon path helpers ported from V1 `guild-boss-portraits.ts` — the referenced `snowprint_assets` files are not in V2 `public/` yet, so shipping the map now would only resolve to broken paths. The page renders an initials badge via `EntityIcon` fallback in the meantime.
- [~] 2.2 Deferred with 2.1.

## 3. App entity slice: `entities/raid-boss`

- [x] 3.1 Structural TS types in `model/types.ts` (`RaidBoss`, `RaidBossSeason`, `RaidBossStatStep`, `RaidBossEncounter`, `RaidBossEncounterModifier`, `RaidBossListItem`), decoupled re-exports over the package wire types. `pnpm typecheck` green.
- [x] 3.2 `useRaidBossLabels()` (`bossName` / `abilityName` / `traitName`) resolving `raidBosses` / `raidBossAbilities` / `raidBossTraits` with a `defaultValue` fallback. en-only namespaces (like `traits`), other locales fall back to en via i18next `fallbackLng`.
- [x] 3.3 `RaidBossPortrait` component — `EntityIcon` when a `src` resolves, initials badge otherwise. Also `describeModifier`/`formatModifierAmount`/`humanizeToken` (`lib/format-modifier.ts`) and `findEncountersForUnit`/`maxKnownProgressionIndex` (`lib/encounters.ts`). Covered by `format-modifier.test.ts` + `encounters.test.ts`.

## 4. App feature slice: `features/raid-boss-detail`

- [x] 4.1 Encounter-lookup helpers (`findEncountersForUnit`, `maxKnownProgressionIndex`) — placed in `entities/raid-boss/lib/encounters.ts` (pure, structural), consumed by the page. Covered by `encounters.test.ts`.
- [~] 4.2 **Deferred to [#122](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/122).** The V1 `guild-boss-modifiers.ts` stat/ability _application_ math (~356 lines) + the "adjusted stats" compare UI. This PR displays the inlined modifier **definitions** (`describeModifier`: threshold + effect) but does not compute adjusted stat/ability values. Separable and the highest-risk item; tracked with its V1 spec cases.
- [~] 4.3 Deferred with 4.2 (no `features/raid-boss-detail` slice created this PR — the calc it would hold is deferred; `lint:fsd` is green without it).

## 5. App page: `pages/library/ui/raid-bosses`

- [x] 5.1 `hooks/use-raid-bosses-catalog.ts` — reactive `useLiveQuery(getRaidBosses)`, returns `{ status: loading|absent|ready, payload, bosses, primes, byId }` with labels resolved. Covered by `raid-bosses-page.test.tsx` (absent + ready paths).
- [x] 5.2 Orchestrator `raid-bosses-page.tsx` — owns selected entity (route param via `useLibraryRouteSelection`) and progression-step state (reset to max-known on entity change); renders `isMobile ? <Mobile/> : <Desktop/>` via a flat `RaidBossesPageViewProps`. Unknown `:entityId` → first entity, covered by test.
- [x] 5.3 `desktop/raid-bosses-desktop-page.tsx` — sticky two-section list beside the detail (side-by-side stat/ability panels via `md:grid-cols-2` in the detail). `data-testid`s for the tour. Renders unauthenticated in the test.
- [x] 5.4 `mobile/raid-bosses-mobile-page.tsx` — stacked list, detail in a bordered card with `compact` single-column layout and a `− N/M +` stepper. `data-testid`s for the tour.
- [x] 5.5 Detail sub-components (`raid-boss-detail.tsx` + `raid-boss-list.tsx`): progression stepper, stat block (crit/block rows omitted when absent), weapons (ranged vs melee line), ability/trait **name** badges (id-resolved), field-enemies + encounter-modifiers list with explicit "no encounter data" / "no modifiers" empty states. Ability-text interpolation and the prime dual-panel compare are deferred (4.2 / [#122](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/122)).
- [x] 5.6 `loading` / `absent` / `ready` states wired in the orchestrator (feature-unavailable message reuses `collections.raidBossesNoRecords`). A distinct sync-**failure**/retry state is deferred to [#122](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/122) (matches the other Library collections today).
- [x] 5.7 `pages/library/route.tsx` now lazy-loads `RaidBossesPage` for `raid-bosses` and `raid-bosses/:entityId`. Canonicalization + both routes covered by `raid-bosses-page.test.tsx`.

## 6. i18n

- [x] 6.1 `en/raidBosses.json` (45), `en/raidBossAbilities.json` (154), `en/raidBossTraits.json` (35) generated from the V1 datamine by `apps/web/scripts/generate-raid-boss-i18n.mjs` (keyed by unitSet / ability / trait id).
- [x] 6.2 de/es/fr for the three id-keyed **game-data** namespaces are intentionally **not** created — they are en-only like the existing `traits` / `characters` / `factions` namespaces (i18next `fallbackLng: "en"`). Only `en` files exist for those in the repo today; matching that convention.
- [x] 6.3 New UI copy added under `library.raidBosses.*` (section headers, stat labels, progression/weapon/encounter/modifier strings, tour steps) with **real de/es/fr translations** in all four `library.json` files.
- [x] 6.4 `raidBosses` / `raidBossAbilities` / `raidBossTraits` registered as `Record<string, string>` resources in `i18next.d.ts`. `pnpm typecheck` green.

## 7. Onboarding tour

- [x] 7.1 `raid-bosses.tutorial.tsx` exports `useRaidBossesTutorial(): TourPageSteps` with distinct `desktop`/`mobile` step sets (Bosses section, Primes section, progression control, encounters+modifiers), registered via `useTourPageSteps`. Steps target the page's `data-testid`s.
- [x] 7.2 `library.raidBosses.tour.steps.*` title/content keys added to all four locales with real translations.

## 8. Assets

- [~] 8.1 **Deferred to [#122](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/122).** Bulk copy of the V1 `snowprint_assets` raid-boss / prime / field-npc portraits into `apps/web/public/game_catalog/**`.
- [x] 8.2 `RaidBossPortrait` renders a readable initials badge for every unit until 8.1 lands; the `EntityIcon` error fallback path is exercised by the component.

## 9. Gates & verification

- [x] 9.1 `pnpm --filter web test:run` — new suites pass (14 new tests: `format-modifier`, `encounters`, `raid-bosses-page`); `@workspace/game-catalog` 89 pass. Two full-suite tests (`dailies-layout` shops-page, `onslaught-page`) time out only under full parallel load — both pass in isolation on this branch and are unrelated to this change.
- [x] 9.2 `pnpm --filter web typecheck` / `lint` / `lint:fsd` clean; `git diff --check` clean.
- [ ] 9.3 Manual browser verification via the Aspire stack — **blocked on the API companion being deployed/synced** (PR TacticusPlanner/tacticus-planner-api#46). Until `raid-bosses` is in a running catalog the page shows the (correct) feature-unavailable state. Tracked below.

## 10. V1-parity pass (post-live-comparison)

Live comparison against V1 `learn/guildBosses` + `guildBossDetail` on the running Aspire stack surfaced parity gaps; addressed here (deferred items in D.1 untouched):

- [x] 10.1 **Prime names from the roster.** `entities/raid-boss/lib/unit-name.ts` — `resolvePrimeName` (strip `MiniBoss/Minion` prefix → lowercase → `getCharactersMap()` lookup) + `unitDisplayName` (V1 `getUnitDisplayName` port). `use-raid-bosses-catalog.ts` resolves a prime to its playable-character name (`GuildBoss4MiniBoss1OrksBigMek` → "Gibbascrapz"), falling back to the id-keyed i18n name. 22/29 primes now show their real name. Covered by `unit-name.test.ts`.
- [x] 10.2 **Field-enemy npc names.** `resolveFieldNpcName` fuzzy-matches the `npcs` catalog dataset by faction abbreviation, dropping the hive-fleet suffix (`GuildBoss1Npc1TyranTermagantLeviathan` → "Termagant"); humanized-token fallback. Page pulls `getNpcs()` and passes resolved names into the detail.
- [x] 10.3 **Ability grouping + hidden ids.** Detail renders Active / Passive / Relic groups. `GuildBossRunAway` filtered via a local `HIDDEN_ABILITY_IDS` set (V1 parity). The generator drops the `formatWords` fallback for **traits** so an unresolved id (`Boss`, `Hero`) has no entry and the detail skips it via `hasTraitName` (`i18n.exists`). `raidBossTraits.json` 35 → 33.
- [x] 10.4 **Modifier rendering.** `describeModifier` returns a discriminated `ModifierDescription`: genuine stat-percent / flat-stat types keep their value (`−15% dmg`, `−1 movement`; the old ×100 bug that produced `−1500%` is fixed); ability-scaling types render as `Reduces <target>` / `Increases <target>` with no raw amount. `atHpLost` copy now `At {{hpLost}}% HP lost`. New `modifierReduces` / `modifierIncreases` UI keys ×4 locales.
- [x] 10.5 **Encounters section → Prime Modifiers.** Flat repeated-encounter list replaced (`entities/raid-boss/lib/encounters.ts` `buildModifierContext` / `fieldNpcIdsForStep`): a boss shows the primes of its representative set with each prime's modifier list; a prime shows its own. `data-testid` `raid-boss-encounters` → `raid-boss-prime-modifiers`; tour step + copy updated. New `primeModifiers` / `modifiers` / `noPrimeModifiers` keys ×4 locales.
- [x] 10.6 **Progression annotation.** The stepper now shows the selected step's `baseRarity` + `starLevel`.
- [x] 10.7 Gates re-run: web `test:run` 1067 pass (166 files), `typecheck` / `lint` (eslint + knip) / `lint:fsd` clean, `git diff --check` clean. i18n regenerated; all 4 `library.json` locales structurally aligned.
- [ ] 10.8 Re-verify live against V1 on the Aspire stack (see D.2).

## Deferred / out-of-session

- [ ] D.1 Modifier-application math + "adjusted stats" compare UI, ability-text variable interpolation, portrait assets, distinct sync-failure state — [TacticusPlanner/tacticus-planner-apps#122](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/122).
- [ ] D.2 Manual full-stack browser verification at <768px and ≥768px once the API companion (tacticus-planner-api#46) is deployed and the `raid-bosses` dataset syncs — see 9.3.
