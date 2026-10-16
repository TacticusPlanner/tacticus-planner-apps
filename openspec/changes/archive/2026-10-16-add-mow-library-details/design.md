## Context

`add-character-unit-details` (same branch, committed, archived before this change) built the character list
and unit page inside the `pages/library` slice: shared pieces in `ui/unit/` (`UnitNavBar`, `UnitTabs` +
`useUnitTab`, `UnitPortrait`, `AbilityPanel`, `LevelStepper`, `unit-origin`), character-specific ones in
`ui/character-unit/` (header, details, view-model) and `ui/characters/` (list). Machines of War still render
`LibraryCollectionPage`, a placeholder, for both routes.

Data available today, checked against the catalog:

- `mows` (11 records): `id`, `name`, `faction`, `alliance`, `primaryAbility` / `secondaryAbility` with
  `name` (an ability key such as `DutyEternal`) and `recipes` (60 entries of 3 upgrade ids each). No stats,
  no starting rarity, no mythic ability.
- `mow-upgrade-costs` (59 rungs, levels 2–60, mapped by level): gold, salvage, `badges {rarity, amount}`,
  `forgeBadges` (null at low levels), components.
- Game text: names in the `mows` and `abilities` namespaces; rules text for 0 of 22 MoW abilities (#204).
- Player data: `mows` chunk (`progressionIndex`, `abilities[]` by position); `inventory` (ability badges and
  components per alliance, forge badges per rarity); `inventory-upgrades`.
- Existing logic: `features/goal-farming` has `mowAbilityUpgradeIds(recipes, from, to)` (recipe `i` = the
  step to level `i + 2`, confirmed against V1 and the API's denormaliser) and `mowAbilityTrackLevel`;
  `features/rank-lookup` has `aggregateBaseUpgrades` / `aggregateOwnedBaseUpgrades` (crafted → base).

## Goals / Non-Goals

**Goals:**

- MoW list and unit page that reuse change 1's components without forking them.
- An Ability upgrades calculator whose numbers equal V1's MoW Lookup.
- Panels that switch on by themselves when MoW rules text lands (#204).

**Non-Goals:**

- MoW stats, radar, relic, mythic quests (none exist for MoWs).
- Mythic ability data (#204); only the panel is built.
- Collection tiles linking here (change 3), owned/unowned marks on list tiles (optional in the handoff).
- Ranges in the URL or a Share button on Ability upgrades (the handoff specifies neither).

## Decisions

### D1. Slice layout

Everything stays in `pages/library`:

- `ui/mows/`: `mows-list-page.tsx`, its view-model (order alliance → faction → name, search over localized
  names) and tour. It reuses the characters list's tile grid: the grid and search box are lifted from
  `ui/characters/` into `ui/unit/unit-list.tsx` (props: items, href builder, origin label, test-id prefix)
  so both lists render the same component.
- `ui/mow-unit/`: `mow-unit-page.tsx` (loading, failure, not found, tabs), `mow-unit-details.tsx`
  (Primary/Secondary panels, desktop grid or mobile accordions), `mow-upgrades-tab.tsx` (+ cards),
  `mow-upgrades.model.ts` (pure calculator), `mow-unit.view-model.ts`, `mow-unit.tutorial.tsx`.
- `LibraryCollectionPage` and its test are deleted; `route.tsx` maps both MoW routes to the new pages.

Alternative rejected: a `features/mow-lookup` slice. Goals only shares the two helpers already exported
from `features/goal-farming`; nothing else needs the calculator.

### D2. One header for both unit kinds

`CharacterUnitHeader` becomes `ui/unit/unit-header.tsx` (`UnitHeader`). The rank-specific parts move to
props: `customControls` (the selects shown in Custom: character passes progression + rank, MoW passes
progression only), `kindLine` ("<alliance> · Machine of
War"), and the info-line strings. Ownership, sign-in/sync banner and shard bar stay inside. The character
page passes its current content, so its tests must pass unchanged (regression check).

### D3. MoW values and ownership

`useMowUnitValues(mow, playerMow)`:

- `rosterState` = available when the player-data `mows` chunk has synced, as Collection checks it;
  `owned` = available and the player has a record.
- Base values: owned → `progressionIndex`, primary/secondary from `mowAbilityTrackLevel`; otherwise
  `Common` (V1's `initialRarity` for every MoW; V2's catalog lacks it), levels 1.
- Shards for not owned: `getInventoryShard(id)` and the `unlock-shard-costs` entry for Common.
- Custom holds a progression only; ability levels are separate per-panel state. All of it resets on id
  change (page keyed by id).

With no stats, Custom today changes the portrait's rarity ring, the ability icon frames, the rarity used to
scale rules text once it exists, and the Mythic panel's level (D10).

### D4. Ability panels

`AbilityPanel` is reused as is: `kind` "Primary"/"Secondary", `name` from `abilities:<key>` (fallback: the
key split into words), `text` from `useAbilityText(key)`, `maxLevel` = highest rung level in
`mow-upgrade-costs` (60), `playerLevel` when owned. Missing text produces the existing missing-text state,
so #204 needs no UI work.

### D5. The calculator is one pure function with derived views

`calculateMowUpgrades({ mow, costs, upgradesById, ranges, owned? })` returns the canonical structure:

```
steps: { ability: "primary" | "secondary", from, to, rung, recipe: UpgradeId[] }[]
totals: { gold, salvage, components, badges: Partial<Record<Rarity, n>>, forgeBadges: Partial<Record<Rarity, n>> }
materials: { id, needed, owned, remaining }[]   // base materials, crafted expanded
```

- Steps come from the range: for L in [from, to), rung = costs by level L + 1, recipe =
  `mowAbilityUpgradeIds(recipes, L, L + 1)`. Totals sum the rungs; the per-level table renders `steps`;
  materials = `aggregateBaseUpgrades(all recipe ids)`.
- Owned: badges of `inventory.abilityBadges[alliance]`, `inventory.forgeBadges`,
  `inventory.components[alliance]`, subtracted per rarity and floored at 0; materials owned =
  `aggregateOwnedBaseUpgrades([], inventoryUpgrades)` (crafted stock expands to base). Gold and salvage are
  not in the inventory and are never reduced.
- Totals, materials and table never get computed separately, so they cannot disagree.
- Recalculation is `useMemo` over the inputs; no Calculate button (cheap: at most 118 steps).
- Unit tests: the two worked examples in the spec, To < From clamping, the owned subtraction example, and
  V1 parity for three MoWs (Galatian, Biovore, Forgefiend) over fixed ranges, using numbers taken from V1's
  `MowLookupService` and `MowsService.getMaterialsList` as a fixture.

### D6. Range state

`useMowUpgradeRanges(base)` keeps `{ primary: {from, to}, secondary: {from, to} }` in component state:
From defaults to the player's level (owned) or 1, To = min(From + 10, max). Changing From above To raises
To to From. Page state only (not in the URL), per the spec; reset on id change.

### D7. Desktop and mobile forms

|              | Desktop (≥ 768px)                                                                      | Mobile (< 768px)                                                                |
| ------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Details      | Primary and Secondary panels in a grid `repeat(auto-fit, minmax(min(400px,100%),1fr))` | Accordions (Primary open, Secondary closed), header meta "Lv N", sticky tab bar |
| Ranges       | Two fieldsets side by side                                                             | Stacked                                                                         |
| Totals       | `repeat(auto-fit, minmax(150px,1fr))`                                                  | 2 columns                                                                       |
| Per level    | Table in an `overflow-x-auto` box                                                      | Same box, scrolls horizontally                                                  |
| Tour targets | `mow-panel-primary`, `mow-upgrades-ranges`, `mow-upgrades-totals`                      | `unit-section-primary` (accordion header), same calculator ids                  |

The tour (`mow-unit.tutorial.tsx`) returns `{ desktop, mobile }` and drops steps whose target is absent, as
the character tour does. Steps: header/values, tabs, Primary panel, ranges, totals (the last two only when
Ability upgrades is the active tab; otherwise one step pointing at the tab).

### D8. Icons and names

`mowIcon(id)` in `UnitPortrait`; `abilityBadgeIcon(rarity, alliance)`, `forgeBadgeIcon(rarity)`,
`mowComponentIcon(alliance)`, `goldIcon()` and the upgrade icons the character calculator uses. Rarities are
always named in text next to icons.

### D9. Archive order

The `library-entity-routes` delta modifies a requirement that only `add-character-unit-details` introduces,
so that change must be archived first (`openspec validate` reports this as an archive precondition). The
`library-detail-placeholder` spec has no requirements after this change; delete the capability when
archiving.

### D10. Mythic panel without data

The catalog has no MoW mythic ability (V1 keeps it in `new-mows-data2.json` as `mythicAbilities[0]`). The
panel is built now and reads an optional `mythicAbility: { name }` on the MoW record (added to `mowSchema` as
optional, so today's payloads still parse). Without it the panel is titled "Mythic ability" with no icon and
shows the missing-text state; with it, the name, icon and text resolve like Primary and Secondary.

- Level = blue stars of the values shown (V1: `mythicStars − OneBlueStar + 1`): `Mythic:OneBlueStar` 1,
  `TwoBlueStars` 2, `ThreeBlueStars` 3, `MythicWings` 4; maximum 4. Below Mythic the level is 1 and the header
  shows an "Unlocks at Mythic" pill (24px, 1px border, 12px semibold) where the stepper would be.
- No stepper: `AbilityPanel` gains an optional `levelControl` that replaces its stepper, and the chart does not
  set a level. Custom → Rarity and stars is how the level changes.
- No "Yours: level N": the synced MoW has no confirmed mythic ability entry, so the panel does not guess one.
- Desktop: the third card in the abilities grid. Mobile: a third collapsible section, collapsed, whose header
  meta is "Lv N" or "Unlocks at Mythic". The tour does not target it.

### V1 parity checklist

| V1                                                                                                        | Decision                                                                                |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| MoW Lookup route with an autocomplete picker                                                              | **Redesign**: no picker; the calculator is a tab of the unit page reached from the list |
| Start/End number inputs per ability                                                                       | **Redesign**: From/To selects, To ≥ From enforced                                       |
| `mow`, `pStart`, `pEnd`, `sStart`, `sEnd` query params                                                    | **Drop** (spec: page state only)                                                        |
| "Upgrades Needed for Selected Levels" total (badges, components, forge badges, gold as icons with counts) | **Keep** as the Total needed card, adding salvage, with rarity named in text            |
| Badge and forge badge tooltips ("Epic Imperial Badges")                                                   | **Keep** as visible labels instead of tooltips                                          |
| Orbs total                                                                                                | **Drop**: the catalog's MoW costs have no orbs                                          |
| Upgrades table (base materials, sorted rarity desc then count)                                            | **Keep** as Upgrade materials, same sort                                                |
| "Complete Upgrade Table" (1 → 60 for both, ×2) accordion                                                  | **Drop**: the range 1 → 60 gives the same answer                                        |
| Per-level materials table                                                                                 | **Keep** as the Per level card                                                          |
| No inventory awareness                                                                                    | **Add** Include owned materials (handoff)                                               |
| Icons: `BadgeImage`, `ForgeBadgeImage`, component `MiscIcon`, coin                                        | Reuse V2's `abilityBadgeIcon`, `forgeBadgeIcon`, `mowComponentIcon`, `goldIcon`         |

## Risks / Trade-offs

- [Ability levels read by array position] → Same assumption Goals already makes; noted in the spec's
  assumptions. If a real sync shows a different order, fix `mowAbilityTrackLevel` once for both.
- [Custom changes little today] → Accepted (D3); it drives the Mythic panel's level and will scale rules text.
- [Extracting the header and list could regress the character page] → Character tests run unchanged after
  the extraction, before MoW code uses them.
- [Mythic panel has no data] → Built ready (D10); it needs the API half of #204 to add `mythicAbility` to
  `mows` under that name, or the field read here must change.
