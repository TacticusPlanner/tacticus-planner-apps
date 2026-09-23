## Context

See proposal.md — Why. Relevant current state:

- `/library/npcs` and `/library/npcs/:entityId` already exist in `pages/library/route.tsx`, rendered by the generic `LibraryCollectionPage` placeholder; `useLibraryRouteSelection` (`pages/library/model`) owns first-entity canonicalization and unknown-id replacement for every Library collection.
- The served `npcs` dataset (after the companion API change) is a flat list of 534 variation records with `id`, `name`, `factionId`, `alliance`, `kind`, weapons, ability/trait ids, and an unsorted, non-unique `stats` ladder. It carries no icon. V1's raw data maps each variation id to a portrait file (`ui_image_portrait_<slug>_01.png`); 212 of the 220 distinct files already ship in `apps/web/public/game_catalog/characters/`.
- The raid-boss library is the closest sibling: orchestrator + `desktop/` + `mobile/` sub-pages, a `*.view-model.ts` props contract, a `use-*-catalog.ts` Dexie hook, `RaidBossPortrait` initials fallback, `raid-bosses.tutorial.tsx`. The in-flight `add-raid-boss-mobile-picker` change moves its mobile list to a `Popover + Command` combobox — the same control this page uses on mobile from day one.
- Existing id-keyed namespaces: `factions`, `damageTypes`, `traits`. V1 ships `npc_names.json` (variation id → `{name, shortName}`) for en/de/es/fr, so real translations exist to port.

Companion change: `add-npc-library-page` in `tacticus-planner-api`. Shared contract: `GET /api/v1/game-catalog/npcs` record shape (`factionId`, `alliance`, `kind` ∈ `unit | machineOfWar | object`).

## Goals / Non-Goals

**Goals:**

- One owning slice for the NPC model so the page (and any future consumer — e.g. raid-boss field-NPC display) reads groups/variations/levels through a public API.
- Zero page-to-page imports: nothing from `pages/library/ui/raid-bosses` or `character` is imported; shared bits already live in `shared/ui` or `@workspace/game-catalog`.
- Keep the URL contract identical to Characters / Raid Bosses so `useLibraryRouteSelection` is reused unchanged.

**Non-Goals:**

- Ability **rules text** — see D12. (Ability names and icons ARE shown; an earlier draft of this
  design wrongly stated the data carries "ids only", which is not true: every NPC ability id has a
  name and a description in V1's localization.)
- Crit/block stats (declared in V1's model, present in no NPC record).
- A Machines of War page (#42) — but the `entities/npc` slice and the detail components are shaped so a MoW page could reuse the stat/attack/trait presentation.
- Changing the raid-boss library's field-NPC resolution.

## Decisions

**D1 — Owning slice: `entities/npc`, public API via `entities/npc/index.ts`.**
Exports: `buildNpcGroups(records) → NpcGroup[]` (grouping by `name`, `kind === "unit"` only, availability filter, group slug, default variation), `orderLevels(variation) → NpcLevelOption[]` (rank → stars, stable; `tie: boolean` for health disambiguation; `servedIndex`), `matchesNpcFilters(variation, filters)`, `variationModeLabelKey(id)` (suffix → i18n key), `npcSlug(name)`, `useNpcLabels()` (id → localized name via `npcs` namespace with catalog-name fallback), and `NpcPortrait` (wraps `EntityIcon` with initials fallback, mirroring `RaidBossPortrait` rather than importing it — entities must not import sibling entities' UI). Types follow the naming-conventions skill: `NpcStorageModel` (package) → `NpcGroup` / `NpcVariation` / `NpcLevelOption` (domain, in the entity) → `NpcsPageViewProps` (page view-model).
_Alternative:_ keep everything page-local under `pages/library/ui/npcs`. Rejected — grouping and availability are domain rules the raid-boss page will want when it names field NPCs, and the FSD rule forbids importing them from a page.

**D2 — Group id is a slug of the catalog `name`, computed client-side.**
`npcSlug("Makhotep") === "makhotep"`, `npcSlug("Sy-gex") === "sy-gex"`, `npcSlug("From Golden Light Power-up") === "from-golden-light-power-up"`. Names are unique across the dataset (verified: no name spans two factions), and `name` is a datamine constant, not a translation, so the slug is stable across locales. _Alternative:_ API-emitted `groupId`. Rejected — grouping is presentation; the API stays raw (see the API design's non-goals).

**D3 — Default variation = shortest available id in the group, ties by served order.**
Every mode suffix (`LHE`, `LEG`, `Surv`, `CE`, `C1`, `Tut`, `FTUEtest`, fleet names) lengthens the id, so the base roster entry (`necroNpcWarden`, `necroNpc1Warrior`) is always the shortest. Where a group has no base entry (e.g. only `Surv` + `LHE`), the shortest is still the least-specialised. Cheap, deterministic, no suffix registry needed for the default. The suffix registry (D6) is only for labels.

**D4 — Level identity in the URL is the _served_ index; ordering is display-only.**
The ladder is neither sorted nor unique on `(rank, stars)` (38 variations have duplicate pairs; 31 are unsorted; `progressionIndex` repeats), so a semantic key doesn't exist. `orderLevels` returns options carrying `servedIndex`; the selector's value and `?level=` are that index. _Alternative:_ index into the sorted array. Rejected — an upstream row insert would silently re-point every shared link; the served index only changes if the catalog changes that variation, which the dataset hash already signals.

**D5 — Availability: a variation is unavailable when every row has health = armour = damage = 0.**
Covers `genesDecoy`, `astarNpc1HaywireMine`, and the tutorial dummies with junk ladders, without an API `kind` for them (API design D3). `Tut` variations with real numbers remain visible — the label (D6) makes them self-explanatory.

**D6 — Variation labels come from a suffix registry in the entity, resolved through `library:npcs.variation.<key>`.**
Ordered regex list: `_SyncPvp_(Leviathan|Kronos|Gorgon)$`, `(Leviathan|Kronos|Gorgon)$`, `FTUEtest$`, `Tut`, `LHE$`, `LEG$`, `Surv$`, `CE\d*$`, `C1`, else `standard` when the id has no recognised suffix and is the group's default, else `unknown` (label = raw id). The raw id is always shown as secondary text, so a wrong guess is recoverable by the user. Localized in `library.json` (4 locales), not in `npcs.json`, because these are page labels, not entity names.

**D7 — Filters are page-local React state, not URL state.**
The Library route contract reserves the query for per-entity secondary state (`variation`, `level`); Characters keeps `rank`/`tab` there. Filters describe the _list_, and putting four multi-value filters in the URL would make every NPC link carry them. Owned by the orchestrator (`npcs-page.tsx`); reset on unmount by construction.

**D8 — Desktop/mobile split (per config rule).**

|                                                                                                                                                   | Desktop (≥768)                                                                               | Mobile (<768)                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| NPC picker                                                                                                                                        | Tile grid (`NpcList`, portrait + name + faction icon, `aria-pressed`) in the left column     | `NpcCombobox` (Popover + Command; trigger = portrait + name; rows = portrait, name, faction) above the detail |
| Filters                                                                                                                                           | Stacked at the top of the sticky left column, above the tile list                            | Same controls stacked full-width, collapsed under a "Filters (n)" toggle                                      |
| Variation / Level                                                                                                                                 | Two `Select`s in the detail header row                                                       | Two full-width `Select`s at the top of the detail card                                                        |
| Stats                                                                                                                                             | 4-up stat card row                                                                           | 2×2 stat card grid                                                                                            |
| Tour targets                                                                                                                                      | `npcs-filter-panel`, `npcs-list`, `npcs-variation-select`, `npcs-level-select`, `npcs-stats` | `npcs-combobox`, `npcs-variation-select`, `npcs-level-select`, `npcs-stats`                                   |
| The orchestrator computes `NpcsPageViewProps` once and renders `isMobile ? <NpcsMobilePage/> : <NpcsDesktopPage/>`; sub-pages take no `isMobile`. |

**D9 — Portraits: ported id → file map in `@workspace/game-catalog`.**
`game-entities/npc-portrait-overrides.ts` (generated once from V1 `new-npc-data.json`: 534 ids → bare file name) + `icons/npc.ts` exporting `npcPortrait(id)`; `NpcPortrait` falls back to initials when the map has no entry or the image 404s. The two missing files with real units (`ui_image_portrait_adept_warsuit_01.png`, `ui_image_portrait_darka_watcher_01.png`) are copied from V1 `src/assets/images/`. _Alternative:_ derive `camelCase → snake_case` like `characterIcon`. Rejected — NPC file slugs don't follow the id (`necroBossWarden` → `necro_warden`), so the derivation would need ~200 overrides anyway.

**D10 — `npcSchema` tightened to require `factionId`, `alliance`, `kind`.**
The catalog sync re-downloads `npcs` when its hash changes, so after the API deploys every client converges on the new shape; a stale IndexedDB row failing the tightened schema is handled by the existing per-dataset re-sync path. Verified in `schemas.test.ts`.

**D11 — Stat cards / attack rows / trait chips are page-local components under `pages/library/ui/npcs/`,** built on `shared/ui` primitives (`EntityIcon`, `RankBadge`, `RarityIcon`) and `@workspace/game-catalog` icon helpers (`statIcon`, `damageTypeIcon`, `traitIcon`, `rankIcon`). The raid-boss page has its own equivalents; extracting a shared `StatCard` to `shared/ui` is a candidate follow-up once a third consumer (#42) exists, not part of this change.

**D12 — Abilities are shown as name + icon only; no rules text, and no per-ability damage type.**
The served record carries `activeAbilities` / `passiveAbilities` (307 distinct ids across 396 and 440
of the 467 unit records). All 307 have a localized name **and** a description in V1's
`ability_names.json` / `ability_descriptions.json` (12 locales), and 293 of 307 ability icons already
ship in `game_catalog/abilities/` (8 more copied from V1 here; 6 exist nowhere and render name-only).
Names are therefore ported into a new id-keyed `abilities` namespace, exactly like `traits`.

Layout: an Active / Passive **column pair** (stacked on mobile), labelling the kind once per column
rather than per chip. 81% of units are exactly 1 active + 1 passive and only 5 exceed two abilities
total, so per-chip kind labels or stacked sub-headed groups cost more space than the content needs;
a column whose list is empty is omitted, which makes a one-sided unit read as a single labelled list.

Rules text **is** rendered, on demand. The descriptions are Unity rich-text templates whose
`{[minDmg]}`, `{[nrOfHits]}`, `{[range]}` tokens need per-ability-level values; those live in V1's
`4-entities/abilities/data/new-ability-data.json` (582 abilities, 481 with variable tables up to 65
levels deep). An earlier draft of this design claimed no such source existed — that was wrong; only
the V2-ported `raidBossAbilityText` subset and the l10n files had been checked.

Of the 306 ability ids on listable NPCs, **302 resolve completely** and are ported into a new
`npcAbilityText` namespace (all four locales, mirroring `raidBossAbilityText`). The four that do not
are the same unnamed internal markers the UI already drops, so in practice every ability the page
displays carries rules text.

Two earlier drafts of this design understated that badly. The first claimed no variable source
existed at all. The second put coverage at 94, because it checked each placeholder only against the
ability's `variables` table and never looked at its `constants` — which is where `nrOfHits`, `range`
and `damageProfile` live (456 of 582 abilities have them). `DamageProfileType(Style)` is derived
from the `damageProfile` constant by the renderer, exactly as V1's `resolveVariable` /
`resolveDynamicStyle` do. No value is inferred from the unit's weapon profile, and none needs to be.

Presentation is a disclosure, not always-on text: 81% of units have exactly two abilities, and six
paragraphs of rules text would bury the stats. A resolvable ability is an expand control, and the
chip itself is the card that grows — header, divider and body inside one border — rather than
dropping a second box beneath it, so an open ability still reads as one object in its column. The
text renders through the existing `shared/ability-text` component at the selected level's `abilityLevel`,
so it rescales with the Level selector — the same component and contract the raid-boss detail uses.

74 of the 94 entries carry rarity-affected variables, which `AbilityText` multiplies by a per-rarity
factor, but NPC stat rows have a star index and no rarity. `entities/npc` therefore ports V1’s
`NpcService.resolveRarityFromStars` (`rarityFromStars`): the star bands 0-2/3-4/5-6/7-8/9-11/12-14 map
to Common..Mythic, exactly the `RarityMapper.toMaxStars` walk V1 wrote for this same problem. Passing
a fixed rarity instead would misscale 79% of the expandable abilities.

Per-ability damage types are excluded because `activeAbilityDamage` / `passiveAbilityDamage` are
**not positionally aligned** with the ability arrays — 32 unit records have differing lengths (e.g.
`admecBossBelisarius`: 3 active abilities, 2 damage entries). Pairing them by index would confidently
mislabel an ability's damage type, so the arrays are left unrendered.

_Alternative considered:_ show the raw templated description with placeholders stripped. Rejected —
it silently changes what an ability does ("deals damage per hit"), which is worse than omitting it.

**D13 — Layout verified against the data extremes, not just a happy path.**
Audited at 1280px and 390px over the widest real records: longest name (26 chars, “Corpuscarii
Electro-priest”), most variations (7, Winged Prime), most levels (57, Hormagaunt), most traits (7,
Mortarion), most abilities (6, Belisarius Cawl and Lion El’Jonson) and the longest ability name (31
chars, “Invocation of Machine Vengeance”). No horizontal overflow and no clipped text in any of the
16 configurations; the 57-option Level dropdown stays inside the viewport at both widths with the
selected row scrolled into view; a single-variation NPC disables its selector.

Two defects the audit caught, fixed here: trait chips hid their name below 640px (`hidden sm:inline`)
which left icon-only chips whose names could only be read by hovering a tooltip — impossible on
touch; and the desktop tile grid declared `role="listbox"` / `role="option"` while implementing no
arrow-key navigation between options, over-promising the listbox contract. The grid now uses plain
`aria-pressed` buttons, matching `raid-boss-list`.

**D14 — Attacks are chips on one line, not a full-width row each.**
45% of listable units are melee-only and 55% have exactly two weapons, so a row per attack spent a
tall, mostly-empty band on one or two short facts. Chips match the ability and trait rows below and
halve the vertical cost. The ranged chip carries its range as a number on the attack icon, as the
game and V1's `AttackProfileRow` do, instead of a separate “Range n” label.

**D15 — One column rhythm for every two-column block in the detail.**
The panel had four competing horizontal grids: stat cards on 4 columns, attacks and traits packing
content-width chips to a ragged edge, and abilities on a 2-column grid whose origins matched none of
them. The Variation/Level selectors, the attack chips and the ability columns now share one 2-column
grid with the same column gap, so every block starts at the same two x-origins and chips stretch to a
common width; hit counts are pushed to the chip trailing edge so the two attack chips align
internally. Traits stay a wrapping tag row on purpose: they are an unordered set of varying-length
labels, which is what a tag cloud is for, and forcing them into columns would either pad short names
or truncate long ones. Mobile collapses every block to one column.

**D16 — Filters live above the tile list, not in a bar across the page.**
They narrow the list only, so spanning the full width overstated their scope and pushed the detail
down; Character Lookup already puts its controls in a sticky `w-80` left column beside its results,
so this matches an established sibling rather than inventing a placement. Within that column the
filters are fixed and only the tiles scroll — the roster is 178 entries and a direct link can select
one far down it, so a single scroll container would carry the filters off-screen exactly when a user
wants them.

**D17 — Five filters, collapsed; search is not one of them.**
Faction and alliance (Imperial 170 / Xenos 204 / Chaos 91), attack type (ranged 257 / melee-only
208), damage type and trait — each a one-line predicate over data already served, and each
answering a question the roster actually poses. A sixth, game mode (Standard 251, LHE 90, Survival
69, Legendary 29, …), was built and then dropped before this change shipped: the modes are inferred
from id suffixes and nothing in the served data names them, so the buckets are a guess and a player
could filter confidently into a wrong answer. It is tracked separately in
[apps#156](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/156), pending
confirmation of the taxonomy. Options are derived from the listed catalog so a control
never offers a value that matches nothing, and a blank id is dropped: two non-combat units
(`Watcher`, `Spore Mine`) are served with an empty damage profile, which otherwise rendered as an
unlabelled row at the top of the damage-type list. The same two exposed a second bug — the attacks
section rendered a melee chip unconditionally, inventing an attack for units that have none; it now
shows an explicit no-attacks state.

Name search sits outside the collapsible group and outside the active-filter count: it is how you
reach a unit you already have in mind, not a way to narrow a roster you are browsing. Each
multi-select carries its own clear, because resetting one facet should not discard the others, and
that X replaces the chevron rather than sitting beside it — two trailing affordances on one control
read as clutter, and the trigger body still opens the list. Every option shows its game icon
(`factionIcon`, `damageTypeIcon`, `traitIcon`), which is how the rest of the page identifies these
same ids.

## V1-parity checklist

**V1 source:** `tacticusplanner/src/fsd/1-pages/learn-npcs/npc-info.tsx`, `4-entities/npc/{npc-service,npc-stats,npc-select,progression-index-select,npc-portrait}.tsx`, `4-entities/npc/data/new-npc-data.json`, `5-shared/l10n/data/*/npc_names.json`.

**Assets / icon ids reused:**

- Portraits: V1 `Icon` per variation → `npc-portrait-overrides.ts` (534 entries, 220 distinct files; 212 present, 2 copied, 6 loot/power-up files not needed).
- Stat icons: V1 `MiscIcon` `health` / `armour` / `damage` / `movement` → `statIcon(...)`.
- Rank + stars: V1 `RankIcon` / `StarsIcon` → `rankIcon` / `RarityIcon` + `RankBadge`.
- Traits: V1 `NpcService.getTraitIcon` map → existing `traitIcon` (`icons/trait.ts`); NPC-only entries V1 mapped differently (`Boss` → `boss_adjutant`, `Unstoppable` → `mounted`, `GetStuckIn` → `beast_snagga`) are added to `traitIconOverrides` so they stop resolving to `unknown`.
- Damage types: V1 `AttackProfileRow` → `damageTypeIcon` + `damageTypes` namespace.
- Faction icons: **gap** — V2 has no `game_catalog/factions/` folder and no helper. Copy V1 `src/assets/images/factions/*.png` (22 files, display-name file names) to `apps/web/public/game_catalog/factions/<FactionId>.png` and add `factionIcon(factionId)` to `@workspace/game-catalog` icons (V1's `faction.icon.tsx` gives the display-name → id mapping, e.g. `Adepta Sororitas.png` → `Sisterhood`). Existing `factions` namespace for the name.

**V1 navigation / layout pattern:** V1 is a single card with three MUI selects in one row (Faction → NPC → NPC Level) and stats below; faction is a _selector_ that drives the NPC list. **Redesigned:** faction becomes a _filter_ in a filter bar; NPC picking moves to a list/combobox; Variation is split out of the NPC selector (V1 listed `Makhotep (necroBossWardenLHE)` as separate NPC options); Level stays a select but disambiguates ties. Desktop/mobile are separate layouts (V1 was one responsive grid).

**V1 secondary states:**

| V1 state                                                                       | Decision                                                                                                                                                   |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trait hover tooltip (CSS-only, raw trait id)                                   | **Redesign** — Radix tooltip with localized trait name, keyboard-focusable                                                                                 |
| Crit / block stat cards (conditional)                                          | **Drop** — no NPC record has these values                                                                                                                  |
| `NpcDetailModal` (used by other V1 pages, not by learn/npcs)                   | **Drop** — out of scope; the detail panel is the V2 equivalent                                                                                             |
| Active/passive abilities (parsed by `NpcService`, rendered by no V1 component) | **Add** — V2 lists ability names + icons, with expandable level-scaled rules text where it resolves; see D12. Not a V1 parity item: V1 never displays them |
| Zero-valued stats for MoWs / objects rendered as `0`                           | **Redesign** — excluded by `kind`; all-zero variations hidden                                                                                              |
| Empty traits → section omitted                                                 | **Redesign** — Library empty-state treatment                                                                                                               |
| Faction select defaulting to `Necrons`                                         | **Drop** — first listed NPC per route contract; no faction preselected                                                                                     |
| No URL state (selection lost on refresh)                                       | **Redesign** — path + query state per spec                                                                                                                 |
| Melee / ranged multi-weapon arrays (`meleeAttacks[]`)                          | **Keep behavior** — the served dataset has one melee + optional ranged; a chip renders per weapon                                                          |

## Risks / Trade-offs

- [Suffix registry mislabels a new datamine suffix] → falls back to the raw id as label; raw id is always visible as secondary text.
- [Name-slug collision after a future datamine rename] → `buildNpcGroups` asserts slug uniqueness in a unit test over the real fixture; a collision fails CI rather than silently merging groups.
- [Mobile combobox pattern diverges from `add-raid-boss-mobile-picker` if that change lands with a different component shape] → `NpcCombobox` is built on the same `shared/ui/unit-combobox` primitives; if a shared `EntityCombobox` emerges from that change, migrate in a follow-up.
- [534-row `npcs.json` namespace per locale adds ~60 KB per locale] → lazy-loaded only on this page via `useTranslation(["library", "npcs", …])`.
- [Filter reset on navigation may surprise users returning from Characters] → matches Characters' rank/tab behaviour (also not persisted across collections); revisit if feedback asks for it.

## Migration Plan

1. API change deployed (companion, applies first); clients re-sync `npcs`.
2. This change ships behind no flag — the placeholder route is replaced outright; the `library-detail-placeholder` spec delta documents the removal.
3. Rollback: revert this change; the route falls back to the placeholder and the tightened schema reverts to loose.
