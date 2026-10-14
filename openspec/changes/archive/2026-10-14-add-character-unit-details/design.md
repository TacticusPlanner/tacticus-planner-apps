## Context

- `/library/characters` and `/library/characters/:entityId` both render `CharacterLookupPage`
  (`pages/library/ui/character/`): a picker plus the rank-up calculator, with `UnitProfile` on top.
  `useLibraryRouteSelection` redirects the bare collection URL to the first character.
  `useLookupSelection` owns the calculator state in the URL (`rankStart`, `rankEnd`,
  `progressionStart`, `progressionEnd`, `pointFive`), with "url" vs "generated" range authority and
  the synced-player seed (`character-lookup-range-defaults`).
- The NPC page (`pages/library/ui/npcs/`) is the reference detail page: list tiles
  (`npc-list.tsx`), desktop and mobile pages, ability chips that expand to level-resolved rules text
  via `useNpcAbilityText` (`entities/npc/lib/use-npc-ability-text.ts`) and `AbilityText`
  (`shared/ability-text`), and a tour.
- Character ability ids in the catalog (`activeAbilityNames`, `passiveAbilityNames`) are keys of the
  `npcAbilityText` namespace (checked: `StormOfWrath`). Entries carry `variables` (65 per-level
  values), `constants` and `scaled` (variables multiplied by `RARITY_FACTOR` for the unit's rarity).
  Checked against the API's catalog source (119 characters): 100 resolve both abilities, 18 resolve
  neither (Lhykhis, Weirdboy, Bile, and every Custodes, Emperor's Children and Votann character), and
  Azrael resolves his active but not his passive. 39 of the 41 traits characters use have text.
- Stats: `statAtRank(base, rank, progression)` in `packages/game-domain/src/progression.ts`
  (already used by `UnitProfile`). V1's `calculateStat` differs above Diamond III and in rounding; the
  radar keeps V1's (D5), every other stat on the page uses `statAtRank`.
- No charting library is installed in `apps/web` or `packages/ui`.
- The visual and layout source of truth is the docs handoff
  `tacticus-planner-docs/ux/wireframes/library-unit-details-handoff.md`; this design records the
  technical decisions only.

## Goals / Non-Goals

**Goals:**

- Characters list page and a character unit page with Details and Rank-up materials tabs, desktop and
  mobile, per the handoff.
- Components the Machines of War page (change 2) can reuse without forking: navigation bar, header
  and value states, tab bar, ability panel, level chart.
- The calculator moves into a tab with its behaviour and tests intact.

**Non-Goals:**

- Machines of War, Collection click-through, the real round portrait (changes 2 and 3).
- Porting relic text or MoW text (separate data issues); serving mythic quests from the API.
- Changing calculator results UI or its range rules.

## Decisions

### D1. Slice layout: everything stays inside the `pages/library` slice, except true generics

All Library routes are one page slice, so the list, unit page and shared unit components live in
`pages/library/ui/unit/` (shared by characters now and MoWs in change 2) and
`pages/library/ui/character/` (character-specific). No page-to-page imports arise.

- Pure game rules go to `packages/game-domain`: `pierceRatio(damageType)` (ported from V1
  `5-shared/model/pierce-ratio.ts`, including its `HeavyRound` and `Gauss` aliases; unknown → `undefined`,
  callers treat it as 0). Values follow the Tacticus wiki's "Damage Types and Pierce Ratio" table, the
  community-tested reference: it corrects V1 for Chain (20%, V1 15%) and Plasma (65%, V1 60%). The
  wiki's Las bonus (+50% for Emplacement or Heavy Weapon units) is unit-specific and not modelled; chips
  show the damage type's base ratio and `startingProgression(rarity)` (first `progressionOrder` step of the
  rarity).
- `LevelChart` is generic (series, marker, hover, click, figcaption) with no game knowledge, so it goes
  to `shared/ui/level-chart/`. The radar is character-specific and stays in the page slice.
- `useNpcAbilityText` / `useNpcTraitText` are not NPC-specific. Move them to `shared/ability-text` as
  `useAbilityText` / `useTraitText`; `entities/npc` re-exports the old names so NPC and raid boss code
  keeps working, with a regression test for the NPC page.

Alternative rejected: a new `entities/character` slice. Nothing outside `pages/library` needs these
models in this change; promote later if Collection or goals need them.

### D2. Unit page state and its owners

| State                                                  | Owner                                                                        | Persistence                                                   |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Character id                                           | route `:entityId`                                                            | URL path                                                      |
| Tab                                                    | `useUnitTab()` over `useSearchParams` (`tab` = `details` / `rankup`)         | URL, keeps other params                                       |
| Calculator range                                       | existing `useLookupSelection(characterId)`                                   | URL params (unchanged)                                        |
| Shown values (Your unit / Starting / Custom + selects) | `useUnitValues(unit, playerRecord)`                                          | component state; reset when `:entityId` changes (keyed by id) |
| Ability and relic levels                               | per panel state seeded from player record                                    | component state; reset on unit change                         |
| Origin (back target, prev/next order)                  | `location.state.unitOrigin` = `{ kind: "list" \| "collection", ids, label }` | router history state                                          |

- Tab switching calls `setSearchParams` with only `tab` changed (`details` removes the key). The
  calculator stays mounted only while its tab is active; its state lives in the URL, so remounting
  reproduces it.
- The calculator currently picks its character from `draft.characterId`; the page passes the route id
  and the picker (`character-lookup-controls`' unit combobox) is removed from both desktop and mobile
  controls.
- Prev/next navigate to `/library/characters/{id}` with the current search params (existing
  `library-entity-routes` rule) and the same origin state. Without origin state (direct link), the
  page builds the list's default order (alliance → faction → name) from the catalog.
- The list writes the origin with its current filtered order when a tile is activated. Change 3 adds
  the Collection origin.

### D3. Value states derive from one roster check

`rosterState` = `available` when the player-data `characters` chunk has synced (same rule as
Collection: `getPlayerCharacters()` defined), else `notSynced`; signed out is `notSynced` too.
`owned` = available and the player has a record. The header state (a owned / b not owned / c no
roster) and the values control's first segment (Your unit / Starting) follow from these two. Shard
progress for b reads `getInventoryShard(unitId)` and the `unlock-shard-costs` entry for the unit's
`initialRarity`. Relic level = the `equippedItems` entry whose equipment `isRelic`.

### D4. Ability series and charts come from the same text entry as the rules text

A pure `buildAbilitySeries(entry, rarity)` returns, for each variable referenced in the description in
text order: its 60 values (levels 1–60, with the rarity factor applied to `scaled` variables, exactly
as `resolveVariable` does), and whether it is constant. A `{[minX]}-{[maxX]}` pair adjacent in the
parsed AST (`parseAbilityText`) becomes one band series. Charted = the first two non-constant series;
constant ones produce the "stays at" line. Rules text, next-level line, chart marker and stepper all
read the same `level`, so they cannot disagree. Values are scaled by the shown rarity, so Custom
rarity changes the text and charts (V1 behaviour).

### D5. Radar model is a pure function over the catalog

`buildStatRadar(characters, unitId)` → six `{ axis, value, percentile }` at the fixed reference
(MythicWings progression, Adamantine2): health and armour via V1's `calculateStat` formula and
rounding (base × 133.5178, rounded; task 1.4 found V2's `statAtRank` floor reorders 3 of 36 checked
values); damage × hits and
damage × hits × pierce for melee and ranged; ranged 0 without a ranged attack. Percentile = strictly
lower count / population × 100. Population = all catalog characters, computed once per catalog load
(`useMemo` on the catalog). Test: Tigurius Health 8,679 → 6 of 119 lower → 5%; and parity with V1's
`buildRadarStats` for several characters using V1's data file as a fixture.

### D6. Charts are plain SVG

`LevelChart` and the radar are hand-written SVG with HTML labels, per the handoff (no new dependency).
Hit areas are full-height column `rect`s; the plot is `aria-hidden` and wrapped in a `<figure>` with a
visually hidden `<figcaption>` summary built by a pure `describeSeries()` helper (testable). No
animation, so reduced motion needs nothing extra.

### D7. Desktop and mobile are separate components with separate tour targets

As on the NPC page: `character-unit-desktop.tsx` (card rows) and `character-unit-mobile.tsx`
(At a glance + accordions, sticky tab bar, 44px controls), chosen with `useIsMobile()`. Section bodies
(traits list, ability panel, radar, stats) are shared components; only the containers differ. Tour
steps target `data-testid`s that exist in each form: desktop targets the cards; mobile targets the
accordion headers (`unit-section-<name>`). `character-unit.tutorial.tsx` returns `{ desktop, mobile }`
and filters out steps whose target is absent (no relic, missing text) the same way Collection's tour
does. The list page gets `characters-list.tutorial.tsx`. The old `character-lookup.tutorial.tsx` is
replaced; its calculator steps move into the unit tour's Rank-up step.

### D8. Filler portrait

Until #200 merges, the header uses `EntityIcon` with `characterIcon(id)` inside a `rounded-full`
frame with a ring in `var(--rarity-<rarity>)` (those tokens exist on main). Tokens that only exist on
the #200 branch (`--faction-*`, `--portrait`, `--progress`, `--info-bg`, overlay tokens) are not
used: the faction chip uses the existing `factionIcon` and neutral chip styling, and the banner and
progress bar use existing `muted`/`primary` utilities. `UnitPortrait` is one component, so change 3
swaps in the real portrait and the Collection tokens in one place.

### D9. Tokens

Add `--chart-grid` and `--hl` (light and dark) to `packages/ui/src/styles/globals.css`, registered in
`@theme`. Reuse `--chart-1` (on main) and `--rarity-*` (on main); `--faction-*` arrives with #200
and is adopted in change 3. Check `--chart-1` against `--card` (≥ 3:1) in both themes and record the
ratio in tasks.

### D10. Deviations from the handoff, decided during implementation

- **Sync banner has no button yet.** The sync action lives in the app layer (`app/providers`), which
  pages may not import; #200 moves it to `features/player-data-sync`. Until then a signed-in player
  without a synced roster is pointed at the header's Sync with Tacticus control. Change 3 adds the
  button, alongside the real portrait.
- **Calculator layout unchanged.** The handoff turns the calculator's left column into a control bar.
  This change moves the calculator into its tab as it is (sticky left column on desktop, existing
  mobile layout); every control, Share and the URL behaviour are kept. The bar is a later layout pass.
- **Tour button stays in the app header**, where every page's tour starts, instead of a second one in
  the unit navigation bar.
- **Custom values** use the existing progression select (rarity and stars as one ladder, as the
  calculator does) plus a Rank select limited to the ranks that rarity allows.
- **Tour copy** lives in the `library` namespace (`charactersList.tour.*`, `characterUnit.tour.*`),
  the NPC tour's pattern; the old `tour.lookup` keys are removed.

### D11. Mythic quests ported as English game text

Decided during implementation (the handoff left the card out until data existed). V1's static
`4-entities/mythic_quests/data/mythic-quests.json` (117 characters) is split into two English
namespaces, the same pattern as ability and trait text: `mythicQuests` (character id -> quests:
number, reward strings, tasks with loca key, target and parameters) and `mythicQuestTasks` (loca key ->
template). Other languages fall back to English. A pure module (`pages/library/model/mythic-quests.ts`)
parses rewards and builds V1's template variables (`TARGET_AMOUNT`, `HERO_NAME`, one per parameter);
the shared `AbilityText` renders the template, including its i2p plural. Characters V1 doesn't cover
(Weirdboy, Bile) show no card. A later change can serve the data from the API instead.

### V1 parity checklist

| V1 element (`who-you-own/unit-details-page.tsx`)               | Decision                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Prev/next and close (✕)                                        | Keep as prev/next + back button labelled by destination                        |
| 192×280 framed rectangular portrait                            | Redesign: round portrait (filler now)                                          |
| Rarity / stars / rank selects                                  | Keep inside Custom; default from the player (V1 did the same)                  |
| 2×2 stat grid                                                  | Keep as At a glance (4 boxes + attacks + slots)                                |
| Trait cards with descriptions                                  | Keep; name only when text missing                                              |
| Stats-by-rank chart (desktop) / table (mobile)                 | Redesign desktop to three charts; keep mobile table                            |
| Ability panels: level select 1–60, next level, variables chart | Keep; stepper instead of select; band for min–max; constant values not charted |
| Stat percentile radar                                          | Keep model and axes; add median outline and percentile list                    |
| Relic panel (level 1–10, text, chart)                          | Keep; missing-text state until relic text exists                               |
| Mythic quests                                                  | Keep: up to five quest cards with task text and reward chips (D11)             |
| Ability/trait icons                                            | Reuse V2 `abilityIcon`, trait icons, `characterIcon`                           |
| Copy-SVG button on the radar                                   | Drop                                                                           |
| Tooltips on axis icons                                         | Redesign: text labels + percentile list                                        |
| Empty state for unknown unit                                   | Redesign: Library not-found state                                              |

## Risks / Trade-offs

- **Calculator move breaks its tests** → keep `useLookupSelection` and results components unchanged;
  only the page shell and controls change; adapt page tests, delete picker tests.
- **BREAKING `/library/characters` redirect** → old shared calculator links with an id still work;
  links without an id land on the list (accepted, V2 is pre-production).
- **Catalog base stats differ from V1's for one unit** (checked in task 1.1: Tzaangor Health 75 in V2,
  65 in V1; V2 also has Weirdboy and Bile, which V1 lacks). Percentiles on V2's catalog therefore
  differ slightly from V1's for some units. Parity is tested by running the V2 model on V1's data file
  (formula parity); live values follow V2's catalog.
- **Relic text is almost entirely absent** (task 1.1: 1 of 35 relics has rules text). Relic panels
  ship with the missing-text state; every relic has per-level stats (`levels[].stats`), which a later
  change could show without text.
- **Relic ability text likely absent** → relic panel ships with the missing-text state; verified in
  task 1.
- **Page size** → the Details tab renders up to four charts and a radar; all SVG and memoised by level,
  no measurable cost expected; check on mobile.
