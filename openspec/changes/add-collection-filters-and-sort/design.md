## Context

The Collection page (`pages/my-game`) builds everything it renders from one pure function, `buildCollectionView(catalog, roster, labels)` in `model/collection-view.ts`. It turns catalog units and the synced roster into `CollectionRow`s (with `progression`, `rank` and `unlock` sort keys), groups them by faction, sorts them with one fixed comparator (`compareRows`) and derives the summary and faction counts from the groups. `useCollectionView` reads the catalog (`characters`, `mows`, `unlock-shard-costs`, `equipment`) and the player chunks (`characters`, `mows`, `inventory-shards`). A catalog failure blocks the page; a roster failure lists the catalog greyed out.

The building blocks this change needs already exist:

- `useSearchParamState` (`shared/lib/browser`) holds one validated value in a URL query parameter, replaces history and drops invalid values. `usePersistedSelection` and `safeStorage` handle remembered per-browser preferences.
- `features/rank-lookup` already exposes `rankUpUpgradeIds`, `appliedUpgradeIds` and recipe aggregation (`aggregateBaseUpgrades`, `aggregateOwnedBaseUpgrades`), plus mappers from catalog storage to its `Character` / `UpgradeWithFarmLocations` types. The goal composer's `computeMissingUpgrades` already uses them for the same "required vs owned base materials" comparison.
- `@workspace/game-domain` has `progressionOrder`, `maxRankForProgression` (Mythic → Adamantine 2), `levelCapForProgression` and `rankIndex`. The catalog serves `ascension-costs` (shards and mythic shards per progression step), and the player chunks include `inventory-upgrades`. Each roster character carries `appliedUpgradeSlots`.
- Shared UI has `MultiSelect` / `SearchableSelect` (`option-select`), `RankSelect`, `ResponsiveDialog` (a centred dialog at 768px and wider, a bottom sheet below that) and `FILTER_CHIP_CLASS_NAME` for toggle-group chips. The NPC library's collapsible filter panel (`pages/library/ui/npcs/npcs-filter-panel.tsx`) is the visual reference for the desktop panel, but it cannot be imported across pages.

## Goals / Non-Goals

**Goals:**

- One canonical result. Filtering and sorting are steps inside `buildCollectionView`, so the groups, summary, faction counts and the Library origin order all come from the same rows.
- Quick-filter rules are pure, unit-tested functions, each with the spec's worked examples as tests.
- Toolbar state lives in the URL, read through `useSearchParams` in one validation pass, with no new shared URL-state primitive.

**Non-Goals:**

- The flat-grid layout, overlay toggles, Roster/Table/Showcase views and the Unowned toggle (the rest of #199).
- Changing the Library origin contract. It already carries "the units of that kind in the order Collection showed them", which with filters is the visible, filtered order. Units the filters hide are not part of that sequence.
- Server-side preferences or any API change.
- Making `useCatalogDataset` lazy (see Decision 4).
- Filters that need data from other features: "has a goal", "used in the current Legendary Event", "in the guild-raid meta". Each needs its own read and gets its own change.
- Exclusion filters ("not Mechanical") and V1's "no forced summons", which the served character data has no field for.

## Decisions

### 1. Filter and sort inside `buildCollectionView`, driven by one `CollectionQuery`

`buildCollectionView` gains a fourth argument, `query: CollectionQuery`, with `{ search, alliance, factions, rarities, rankMin, rankMax, ownership, kind, quick, sort }`, and an optional `extras` input carrying what the quick filters need (ascension-cost ladder, rank-up readiness lookup). `CollectionRow` gains the keys the new sorts and filters read: `abilitySum`, `shardsKey` (mythic-first tier plus count), the current or starting `rarity`, the `alliance`, and the localized and catalog names for search. The pipeline is: build rows → keep rows matching the query → group → sort each group with a comparator chosen by `query.sort` (Rarity keeps today's `compareRows`) → derive counts. The view also returns `filtered: boolean` (any search, filter or quick filter applied) so the summary can say "matching", and `rosterState` keeps gating roster-dependent controls.

_Alternative:_ filter the already-built groups in the component. Rejected because the summary, faction counts and tutorial flags would then each re-derive from a second structure, which the design rule against parallel calculation paths forbids.

Without a roster, the rank range, ownership and quick-filter values are dropped from the effective query before filtering (the spec's "do not narrow the list"). The raw URL values are untouched, so they apply once the roster arrives.

### 2. Quick-filter rules live in `pages/my-game/model/collection-quick-filters.ts`; rank-up readiness lives in `features/rank-lookup`

Need to ascend, Need to level, Can ascend and Blue star ready depend only on progression, rank, XP level, shards, orbs and the ascension ladder. They are page-local pure functions over `@workspace/game-domain` plus the `ascension-costs` records, keyed by progression. The path cost covers the ladder entries strictly after the unit's current `progressionIndex` up to and including the target step, and is computed by `ascensionResourceNeed` from `features/goal-farming` (shards and mythic shards net of those held, orbs gross and bucketed by each step's `orbRarity`), so the ladder walk has one implementation. A step missing from the ladder is checked first and never covers. The targets are: for Can ascend, the first step of the next rarity, or the next `progressionOrder` step for a Mythic unit; for Blue star ready, `Legendary:OneBlueStar`. The shard arithmetic matches V1's `getTotalProgressionUntil` difference; Mythic coverage and the orb check are the agreed extensions beyond V1.

Held orbs come from the `inventory` chunk's `orbs[alliance]` (`imperial | chaos | xenos`, each `{ rarity, amount }[]`). They are read for the unit's catalog alliance, lower-cased. A unit whose alliance has no orb bucket is treated as holding no orbs, so it cannot pass a step that costs orbs. Need to ascend uses "rank equals `maxRankForProgression`, and `progressionIndex` below `Mythic:MythicWings`", which takes in Mythic units at Adamantine 2.

Ready to rank up needs rank-up recipes, which are rank-lookup's domain. A new `rankUpReadiness(character, currentRank, appliedSlotIndices, ownedBase, upgradesById): boolean` is exported from `features/rank-lookup/index.ts`, with `inventoryBaseUpgrades(inventory, upgradesById)` to build `ownedBase` once for every character. It computes required base materials as `aggregateBaseUpgrades` over the current rank's upgrade ids whose slot index is not in `appliedSlotIndices`, and compares them with `ownedBase`. The result is true when every requirement is covered or every slot is applied, and false when the catalog lists no upgrades for the rank. The page calls it once per owned character below the maximum rank for its rarity, and only while that quick filter is selected (Decision 4).

_Alternative:_ reuse `computeMissingUpgrades` from `features/goal-create`. Rejected because it lives in the goal composer's model, not that feature's public API, and its "owned" side includes all applied upgrades from earlier ranks (it compares from Stone 1), which is the wrong baseline for "can I finish this rank".

_Alternative:_ put all quick-filter rules in an entity. Not done yet; Collection is their only consumer. If a second page (for example Insights) needs them, they move to `entities/unit` then.

### 3. Toolbar state: one `useCollectionQuery` hook over `useSearchParams`, plus a remembered sort

`pages/my-game/model/use-collection-query.ts` reads every parameter from one `useSearchParams` in a single validation pass and writes every fix (invalid values removed, unknown list items dropped, a backwards rank range swapped) in one replacement, so fixes to several parameters cannot overwrite each other. The parameters are `q`, `alliance`, `faction` and `rarity` (comma-separated multi-values, validated per item against the catalog), `rankMin`, `rankMax`, `owned` (`owned` | `unowned`), `kind` (`character` | `mow`), `quick` and `sort`. Faction validity returns `undefined` while the catalog loads, so a shared link is not stripped before the data arrives (the hook's documented contract). The hook returns `{ query, update(patch), clear() }`. `clear()` removes every parameter except `sort` in one `setSearchParams` call, so Clear filters is a single history replacement.

Sort fallback: `usePersistedSelection("collection.sort", isCollectionSort, "rarity")` provides the default passed to the `sort` param. Selecting a sort writes both the param and the remembered value. The search input keeps the typed text in local state and writes the `q` param (replace) once typing pauses, so a keystroke never waits on a navigation and a list rebuild; a `q` change made elsewhere (Clear filters, Back) replaces the text.

_Alternative:_ keep filters in component state and only the sort in the URL. Rejected because the in-flight `persist-view-state-in-url` change establishes the URL as the owner of page view state, and shared filtered links are the cheapest way to answer "send me your Can ascend list".

### 4. Data reads: quick-filter data is read separately and does not block the page

`useCollectionView` keeps its blocking catalog read unchanged. It adds two groups of non-blocking reads. The first is `ascension-costs` plus the player's `inventory` chunk, for Can ascend and Blue star ready; the chunk supplies the orbs. The second is `upgrades` plus the player's `inventory-upgrades` chunk, for Ready to rank up; `characters`' `rankUpUpgrades` is already in the existing read. Each read's status is exposed per quick filter as `available | loading | needsRoster | needsInventory | failed`. The toolbar disables chips from that status, including while `loading`, and offers a retry beside a `failed` explanation. The page shows placeholders only while a quick filter selected from the URL is `loading`, as the spec requires. `buildCollectionView` returns the query it actually applied, and the toolbar shows that, so what is shown as selected and what narrows the list cannot drift apart.

The reads are always issued: `useCatalogDataset` has no `enabled` option, and these datasets are local IndexedDB reads already cached by TanStack Query for other pages. Only the readiness computation is gated: the per-character readiness map is memoised and built only when `query.quick === "readyToRankUp"`.

_Alternative:_ add `enabled` to `useCatalogDataset`. Deferred, because it is a shared API change for a cost that is not measured. Revisit if profiling shows the `upgrades` read on this page.

### 5. Desktop and mobile toolbar forms differ in structure

- **Desktop (768px and wider):** a single row with search, Sort and Filters. The Filters button toggles an inline panel below it with two labelled groups: Unit (Alliance, Faction, Rarity, Rank range, Stars range, Ownership, Kind) and Combat (Attack type, Hits, Movement, Attack range, Damage types, Traits, Shard source), then Clear filters. Each range is one cell with both ends side by side, so a pair never splits across rows; each group's grid fits as many columns of at least 10rem as the panel allows (a range takes two), rather than fixed breakpoint column counts, so it adapts to monitor width and the sidebar. In the mobile sheet every cell takes its own row. The grid starts open when a standalone filter is active, as in the NPC panel. Quick-filter chips are a single-select `ToggleGroup` below the row and wrap.
- **Mobile (below 768px):** full-width search, then Sort and Filters side by side. Filters opens a `ResponsiveDialog` (a bottom sheet at this width) holding the same controls stacked, with Clear filters and Done in its footer. Chips wrap below.
- The controls are one `CollectionFilterFields` component rendered in either container, so both forms stay in step.
- Tour targets: `collection-toolbar` (search, sort and Filters on both forms) and `collection-quick-filters`. On mobile the toolbar step points at the button row, never at the closed sheet. Faction and tile steps are left out when `groups` is empty.

_Alternative:_ use a bottom sheet on desktop too. Rejected because desktop has the room, and inline controls keep the list visible while filtering.

### 6. Search matching normalises case and diacritics on both names

The match uses `normalize("NFD")`, strips combining marks, applies `toLocaleLowerCase(locale)` and then a substring check against the localized name and the catalog (English) name. This is a small helper in the Collection model. The Library's `searchUnits` is page-local and case-only, so it is neither imported nor changed.

### 7. Combat filters read a per-character profile built from the catalog

Every character row gets a `combat` profile built once from the `characters` dataset: `meleeHits`, `rangedHits`, `rangeDistance`, `movement`, the trait set, the damage-type set (`meleeDamage`, `rangedDamage`, `activeAbilityDamage`, `passiveAbilityDamage`) and the set of shard source campaign types (from non-mythic `shardLocations[].type`). Machine of War rows have no profile, so any set combat filter rejects them. The matcher applies V1's `passesRosterFilter` rules one to one (attack type, hits with attack type, exact movement, range excluding melee-only, every damage type, every trait with Mechanical also met by `LivingMetal`). Shard source matches any picked type.

The options come from the same catalog read (`use-collection-factions` grows into a `use-collection-options` hook): sorted distinct hit counts, movements and ranges, and the damage types, traits and campaign types that occur. Labels and icons reuse `damageTypes:`/`traits:` translations and `damageTypeIcon`/`traitIcon`.

URL parameters: `attack` (`melee` | `ranged`), `hitsMin`, `hitsMax`, `move`, `rangeMin`, `rangeMax`, `damage`, `trait` and `source` (comma lists), plus `starsMin`/`starsMax` (progression ids) for the stars range. They go through the same single validation pass as the rest: each value is checked against the catalog option lists, and while those are still loading the raw value is kept and not applied, as `faction` already works. Backwards hits, range and stars ranges are swapped like the rank range.

Missing equipment compares the roster's `equippedItems` count with the catalog's `equipmentSlots` length; Abilities behind level compares each `abilities[].level` with `xpLevel`. Both only need the roster, so their availability is `available` or `needsRoster`, like Need to level.

_Alternative:_ derive the combat profile in `entities/unit` for reuse by the Library and team pages. Not done yet; Collection is the only V2 consumer.

## Risks / Trade-offs

- [The `ascension-costs` dataset could disagree with V1's table, which the worked examples quote] → The rule tests use the catalog fixture's ladder. Implementation checks the served dataset against the spec's numbers and stops to report any difference rather than editing the examples silently.
- [Orbs are shared across units, like upgrade materials: two units needing the same alliance's Legendary orbs can both show as Can ascend although only one can ascend] → This follows the spec's per-unit evaluation rule, which is the same trade-off as Ready to rank up.
- [Catalog alliance values might not map one-to-one onto the inventory's `imperial | chaos | xenos` orb buckets] → A unit test pins the mapping for all three alliances. A unit whose alliance has no bucket holds no orbs (see Decision 2) rather than throwing.
- [Ready to rank up ignores XP level, so a character can be listed and still be unable to apply its bottom-row upgrades] → Stated in the spec. Need to level is the complementary filter. Revisit if players report confusion.
- [Inventory is not reserved: two characters needing the same materials can both show as ready although only one can rank up] → Stated in the spec's evaluation rule. A "plan-aware" readiness belongs to Goals, not Collection.
- [Readiness over ~100 owned characters with recursive recipe expansion on each toggle] → Memoised per inventory and roster snapshot and computed only while the chip is selected. Measure with the existing render-hot-path test harness, and cache per-upgrade base expansion if it shows up.
- [Long comma-separated URL values with many factions selected] → At most about 25 faction ids, and about 40 traits, well within URL limits.
- [Character ability damage is only partly served: 73 of 119 characters list active-ability damage and 30 passive] → The damage-type filter then sees only attack damage for the rest. Stated in the spec; filling the data server-side fixes it with no frontend change.
- [The filter panel grows to fourteen controls] → Two labelled groups on desktop and in the mobile sheet keep it scannable; the panel still starts closed unless a filter is active.
- [`persist-view-state-in-url` is still in progress] → This change only consumes the already-merged `useSearchParamState`. It touches none of that change's files.

## Migration Plan

This is frontend-only and additive. Rollback is a revert. No stored data changes; the remembered sort key is new, and an invalid value falls back to Rarity.
