## Why

My Game → Collection lists all ~130 units in one fixed order (faction groups, progression inside each group), so a player who wants to know "which Imperial Legendaries can ascend?" or "who has the most shards?" has to scan every tile. V1 Who You Own answers these questions with a name filter, predefined quick filters and an order-by control, and players keep asking for that. This change delivers issue #201 (filters and quick filters) and the sort part of issue #199. The rest of #199 (flat-grid layout, overlay toggles, Roster/Table/Showcase views, Unowned toggle) is left for a later change.

## What Changes

- A Collection toolbar above the faction cards. It has name search, a Sort control and a Filters control that collapses, plus a row of quick-filter chips.
- **Sort** inside each faction group: Rarity (the current order and the default), Rank, Abilities and Shards. Owned units always come before unowned ones. Unowned units keep their nearest-to-unlock order under every sort. Faction groups keep their alliance-then-name order. V1's power, Blackstone value and faction-total sorts are not included. V1's Unlock percentage sort is dropped too, because nearest-to-unlock is already the fixed order for unowned units.
- **Filters** that all combine: name search, alliance, faction, rarity, rank range, owned / not owned, and characters / Machines of War.
- **Quick filters** (pick at most one). They combine with the filters above:
  - **Need to ascend**, **Can ascend**, **Need to level** and **Blue star ready**, ported from V1 with each rule written into the spec. They apply only to owned units and use V2's rank and level caps. Two rules go beyond V1. Need to ascend and Can ascend also cover Mythic units up to Mythic wings. Can ascend and Blue star ready also require the ascension orbs of the unit's alliance, not just shards.
  - **Ready to rank up** is new; V1 has no such filter. An owned character qualifies when it is below its rarity's maximum rank and the player's upgrade inventory covers every base material for the rank's unfilled upgrade slots, counting already-crafted upgrades through their recipes.
- Filtering keeps the faction cards, hides any faction with no matching unit, and makes the page summary and each faction's owned/total count only the filtered set. Active filters show as a count and can be cleared in one action. A filter that matches nothing shows an empty state with a Clear filters action.
- Without a synced roster, the roster-dependent controls are disabled with an explanation: rank range, owned / not owned, and every quick filter. Ready to rank up is also disabled while the player's upgrade inventory has not synced, and Can ascend and Blue star ready while the orb inventory has not.
- The URL holds search, filters, quick filter and sort, so reload, Back and shared links restore them. The last sort used is also remembered in this browser and applies when the URL has no sort; filters are not remembered.
- The page tour gains toolbar steps for desktop and mobile. All new copy is translated into en, de, es and fr.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `player-collection`: three requirements change. Ordering inside a faction becomes the selected sort with today's order as the default. The summary and faction counts reflect the filtered set. The page tour gains toolbar steps. New requirements cover the toolbar's sort, standalone filters, quick filters (with their rules), the filtered empty state, behaviour without a roster, and where toolbar state lives (URL plus the remembered sort).

## Impact

- `apps/web/src/fsd/pages/my-game/model/collection-view.ts` and `use-collection-view.ts`: filter and sort steps on the one view structure, plus the extra reads the quick filters need (catalog `upgrades`, `ascension-costs`, characters' `rankUpUpgrades`, and the player `inventory-upgrades` and `inventory` chunks; the `inventory` chunk holds the ascension orbs).
- `apps/web/src/fsd/pages/my-game/ui/collection/`: a new toolbar (desktop and mobile forms), the empty state, the tutorial, and tests.
- `apps/web/src/fsd/features/rank-lookup`: a new public `rankUpReadiness` helper built on the existing `rankUpUpgradeIds`, `appliedUpgradeIds` and recipe aggregation.
- `apps/web/src/fsd/shared/lib/browser`: reuses `useSearchParamState` and `safeStorage`; no new shared primitives are expected.
- `apps/web/public/locales/{en,de,es,fr}/common.json`: toolbar, filter, quick-filter, sort, empty-state and tour copy.
- No API change and no companion `tacticus-planner-api` change. No new dependencies.
- No other in-flight change touches these files. `rehome-feature-logic` only trims `features/rank-lookup/@x/daily-raids`; this change adds to `features/rank-lookup/index.ts`.
