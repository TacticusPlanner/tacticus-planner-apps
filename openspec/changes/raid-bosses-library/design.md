## Context

See `proposal.md`. This is the frontend half of the `raid-bosses-library` pair; the `tacticus-planner-api` companion adds the served `raid-bosses` dataset and applies first. The served shape is `{ seasonConfigRotation, bosses[], primes[], seasons{} }` — self-contained, id-only, encounters carry inlined modifier definitions (see that change's `specs/raid-bosses-dataset/spec.md`).

Current V2 state:

- `pages/library/route.tsx` maps `raid-bosses` and `raid-bosses/:entityId` to `LibraryNoRecordsPage`; `nav-items.ts` and `public/locales/*/library.json` already carry `raidBosses.label`/`.description` and `raidBossesNoRecords`.
- The built-out reference for the pattern is `pages/library/ui/character/**` (orchestrator `character-lookup-page.tsx` → `desktop/` + `mobile/`, `hooks/use-*-catalog.ts` reactive Dexie reads, `*.tutorial.tsx`). MoW/NPC currently use the thin `LibraryCollectionPage` selector — raid bosses need the fuller pattern, not that.
- `game-catalog` package: served datasets sync via manifest diff into Dexie stores created through a version-cascade upgrade; `queries.ts` exposes promise getters; `game-entities/icons.ts` holds id→icon helpers.

V1 source (`tacticusplanner`, `develop`):

- `1-pages/guild-boss-list/guild-boss-list.tsx` (~90 lines) — the list.
- `1-pages/guild-boss-detail/guild-boss-detail.tsx` (446) + `use-guild-boss-detail.ts` (192) — the detail.
- `3-features/guild-boss-reference/components/**` (13 components) — progression selector, prime modifier dual-panel, battlefield enemies, stat table, sections.
- `4-entities/guild_boss/**` — `guild-boss.service.ts` (id parsing, display names, encounter lookup), `guild-boss-modifiers.ts` (356 lines of stat/ability adjustment math), `guild-boss-portraits.ts` (unit-set id → asset path maps).

## Goals / Non-Goals

**Goals:**

- Consume the `raid-bosses` dataset through the package's normal sync/store/query path — no bespoke fetch.
- One reactive read hook per page; one canonical in-memory model (`{ bosses, primes, byId, seasons }`) that both desktop and mobile render from.
- Port V1's modifier-application math verbatim as pure, catalog-type-decoupled functions in a feature slice; unit-test it against V1's own test cases.
- Redesign the UI: portrait grid + dense detail on desktop, sectioned list + stacked accordions on mobile.

**Non-Goals:**

- V1's `learn/guildBossReference` season/tier-ladder view — the `seasons` data is available for a later change.
- Any signed-in user data (owned roster, progress) — this is a public reference page.
- Re-deriving names/icons on the server — all resolution is client-side from ids.
- A new route contract — `library-entity-routes` already covers `/library/raid-bosses/{entityId}`.

## Decisions

**1. FSD slices: `entities/raid-boss`, `features/raid-boss-detail`, `pages/library/ui/raid-bosses`.**

- `entities/raid-boss` — structural TS types (decoupled from catalog wire types), id→label helpers (`raidBosses`/`raidBossAbilities`/`raidBossTraits` namespace resolution), and id→icon mapping (re-exporting the `game-catalog` package helpers per the `tp-reimplement-v1-page` rule — no pure re-export slice; add app logic only where V1 has it, e.g. the unit-set-id → portrait-path map ported from `guild-boss-portraits.ts`). Public API: types, `getRaidBossLabel(id)`, `raidBossIcon(id)`, `fieldNpcIcon(id)`.
- `features/raid-boss-detail` — the modifier-application calc (`applyModifiers(statStep, activeModifierDefs)`, `applyAbilityAdjustments(...)`) ported from `guild-boss-modifiers.ts`, plus encounter-lookup helpers ported from `guild-boss.service.ts` (`findEncountersForUnit`, `maxProgressionIndex`). Pure functions over structural shapes. Public API: the calc functions + their result types.
- `pages/library/ui/raid-bosses/` — `raid-bosses-page.tsx` (orchestrator) → `desktop/raid-bosses-desktop-page.tsx`, `mobile/raid-bosses-mobile-page.tsx`; `hooks/use-raid-bosses-catalog.ts` (reactive Dexie read + id→label mapping); `raid-bosses.tutorial.tsx`.
  FSD direction: page → feature → entity → package. No page-to-page or feature-to-feature imports; the ability-text renderer currently under `3-features/character-details` in V1 has a V2 equivalent that the detail feature consumes through its public API (confirm during apply; if it's page-local, promote it).

**2. One canonical page model, built once in the orchestrator.**
`use-raid-bosses-catalog.ts` returns `{ status, bosses, primes, byId, seasons }` where `status ∈ loading | absent | error | ready`, `bosses`/`primes` are label-resolved and portrait-resolved view rows in served order, `byId` maps `unitSetId → row`, and `seasons` is the raw season tree for encounter lookup. Desktop and mobile receive a flat props object derived from this — no `isMobile` prop, no second data path. The detail's progression-step index and active-modifier set are view state owned by the orchestrator (not the URL — see Decision 4).

**3. Desktop vs mobile is a real split, documented here.**

| Aspect                      | Desktop (≥768px)                                       | Mobile (<768px)                                        |
| --------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| List                        | Two-section portrait grid, persistent alongside detail | Two stacked sections, tap-through to detail route view |
| Detail stats                | Stat table + ability panels side by side               | Stacked cards                                          |
| Progression control         | Labeled `Select` / segmented control                   | Compact stepper (`- step N +`)                         |
| Abilities/traits/encounters | Expanded panels                                        | Accordions, collapsed by default                       |
| Prime modifiers             | Dual-panel compare (V1 parity, restyled)               | Single panel with a modifier toggle list               |
| Joyride targets             | `data-testid` on grid, step selector, modifier panel   | `data-testid` on section headers, stepper, accordion   |

Different Joyride target selectors and different layout structure per platform → two step sets in `raid-bosses.tutorial.tsx` (`{ desktop, mobile }`).

**4. Detail view state (progression step, active modifiers) is not URL-backed; only the selected entity is.**
`library-entity-routes` puts the selected `unitSetId` in the path and preserves secondary query params. Progression step and active-modifier selection are ephemeral exploration state, reset on entity change, kept in component state — consistent with how Character Lookup keeps its non-identity controls. If sharing a specific step/modifier view is later wanted, it can move to query params without a contract change.

**5. Canonical calc result structure.**
The modifier calc returns one `AdjustedUnitView { stats: StatStep, abilityVariables: Record<string, (string|number)[]>, abilityConstants: Record<string,string>, removedUnitIds: string[] }`. The stat table, ability text, and "what changed" affordances all read from that one structure — no parallel "adjusted stats" vs "adjusted abilities" computation paths (mirrors V1's `computeStatAdjustments` + `applyAbilityAdjustments` but unified at the boundary).

**6. i18n namespaces generated from reference data, `en` real, others fall back.**
`raidBosses` keys = raid-boss/prime `unitSetId`s, values from V1's `getUnitDisplayName` / `resolvePrimeDisplayName` output (or catalog character short names for primes). `raidBossAbilities` / `raidBossTraits` keyed by ability/trait id, values from V1's ability/trait data files. Generate `en/*.json`; create `de`/`es`/`fr` and translate to sibling quality as part of the i18n task (not deferred). Register TS resource types. Lazy-load via `useTranslation(["raidBosses","raidBossAbilities","raidBossTraits","library"])` in the page.

**7. Assets: copy from V1, badge-fallback the rest.**
Port the portrait maps from `guild-boss-portraits.ts` (`unitRoundIconMap`, `bossPortraitMap`, `bossPrefixPortraitMap`, `npcUnitRoundIconMap`) and copy the referenced `snowprint_assets/characters/**` files into `apps/web/public/game_catalog/**`. Everything renders through `<EntityIcon src fallback>`; a missing asset shows a text badge. Genuine gaps documented in the parity checklist.

## V1-parity checklist

**V1 asset / icon ids reused:**

- Boss/prime/minion portraits: `guild-boss-portraits.ts` maps (`unitRoundIconMap`, `bossPortraitMap`, `bossPrefixPortraitMap`) keyed by `unitSetId` — ported into `entities/raid-boss`.
- Field-npc portraits: `npcUnitRoundIconMap` + `resolveNpcUnitPortraitPath` (via `questUnitId` → V2 npc catalog icon) — ported.
- Ability icons: V1 `5-shared/ui/ability-icons` keyed by ability id — use the V2 equivalent; fall back to id text.
- Trait icons: V1 `5-shared/ui/trait-icons` — same.
- Rarity icons for tier/rarity display: V2 shared rarity icon component.

**V1 navigation / layout pattern:**

- V1 list = flat `flex-wrap` portrait buttons, "Bosses" then "Primes", click → `/learn/guildBossDetail?unit=<id>:<maxIndex>`. **Kept** in spirit (two sections, portrait entries) but **redesigned**: path-based selection (`/library/raid-bosses/{unitSetId}`), no `:index` in the identity (step defaults to max known, Decision 4), grid on desktop / stacked on mobile.
- V1 detail = single scrolling three-column page. **Redesigned**: orchestrator + desktop (side-by-side panels) / mobile (accordions).
- V1 has a separate `guildBossReference` season view. **Dropped** from this change.

**V1 secondary states — keep / drop / redesign:**

| V1 element                                                                                                               | Decision                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Progression selector (`progression-selector.tsx`)                                                                        | **Keep**, redesign — `Select`/segmented on desktop, stepper on mobile; default to max known index                                |
| Prime modifier dual-panel (`prime-modifier-panel.tsx`) — left/right encounter compare with per-side HP-lost sliders      | **Keep**, redesign — dual compare on desktop, single panel + toggle list on mobile; same underlying `scaleModifierHpLost` math   |
| `ModifiersSection` HP-lost → modifier list                                                                               | **Keep**, restyle                                                                                                                |
| Battlefield / field enemies (`battlefield-enemies.tsx`, `field-enemies-section.tsx`) — only shown when enemies are known | **Keep**, restyle; explicit "no encounter data" empty state (new)                                                                |
| Ability text with level/rarity variable interpolation (`AbilityText`)                                                    | **Keep** — reuse V2 ability-text renderer; text rescales with selected step                                                      |
| Weapons section — attack-profile rows, ranged vs melee                                                                   | **Keep**, reuse V2 `AttackProfileRow` equivalent                                                                                 |
| Traits / abilities sections                                                                                              | **Keep**, accordion on mobile                                                                                                    |
| "Boss not found" + `← Back`                                                                                              | **Redesign** — unknown id falls back to first entity (spec), no dead-end page                                                    |
| `RosterSnapshotShowVariableSettings` / roster-snapshot unit widget (V1 pulls in `2-widgets/roster-snapshots-unit`)       | **Drop** — that's signed-in roster tooling; the public detail renders the boss unit directly without the roster-snapshot wrapper |
| V1 `getImageUrl` asset helper                                                                                            | **Drop** — replaced by `<EntityIcon>` + package icon helpers                                                                     |

## Risks / Trade-offs

- [Risk] `guild-boss-modifiers.ts` is 356 lines of intricate stat/ability math with subtle rarity-bonus and unit-removal rules. A faithful port is the bulk of the effort. → Mitigation: port function-by-function with V1's `guild-boss.service.spec.ts` / `guild-boss-ability-icons.spec.ts` cases carried over as the V2 unit tests; keep the functions pure and structurally typed so they're testable in isolation.
- [Risk] V1's `AbilityText` renderer and ability/trait data files may not have a clean V2 equivalent yet. → Mitigation: audit during apply; if V2 lacks it, scope a minimal renderer or promote V1's into a shared slice — surface as added scope, don't silently drop variable interpolation.
- [Risk] Portrait asset coverage — V1's `snowprint_assets` guild-boss portraits may be large and numerous. → Mitigation: `<EntityIcon>` badge fallback means the page is functional with partial assets; copy the full set in one asset task and document any that are genuinely absent from V1 too.
- [Trade-off] Serving/consuming the whole `seasons` tree when list + detail only use it for encounter lookup. Accepted — it's one dataset, and it unblocks the season-view change as client-only later.
- [Risk] The `raid-bosses` dataset adds an IndexedDB store + a DB version bump; a botched upgrade block risks other datasets. → Mitigation: follow the version-cascade rule exactly (new complete `stores()` block), and cover "existing DB upgrades without data loss" in tests, as the shops change did.

## Migration Plan

Additive on the client: a new dataset store (version-cascade upgrade, no data loss), new query surface, new page replacing a placeholder, new i18n namespaces. No route contract change. The page only shows content once the API companion's `raid-bosses` dataset is deployed and synced; until then `use-raid-bosses-catalog` reports `absent` and the page shows the feature-unavailable state (same as today's placeholder, just wired to real detection). Rollback = revert; the DB version bump stays (a lower app version simply ignores the extra store). Apply after the API companion.

**Companion change:** `raid-bosses-library` in `tacticus-planner-api`. **Shared contract:** the served `raid-bosses` dataset shape.
