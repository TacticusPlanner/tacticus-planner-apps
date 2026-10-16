## Why

The Machines of War Library page shows nothing: `/library/machines-of-war` and every
`/library/machines-of-war/:id` render a "not available yet" placeholder (beta feedback LIB-04, #42). Players
also lost V1's MoW Lookup, the only place that totalled what a MoW's ability upgrades cost. Collection
Stage 4 (#203) brings both back on the unit page that `add-character-unit-details` built for characters.
This is change 2 of three in the design handoff (`tacticus-planner-docs/ux/wireframes/library-unit-details-handoff.md`,
section 8).

## What Changes

- `/library/machines-of-war` becomes a **Machines of War list**: the characters list's tile grid and name
  search with MoW portraits, ordered by alliance, faction and name; each tile links to the unit page.
- `/library/machines-of-war/:id` becomes a **MoW unit page** on change 1's components: navigation bar
  (back, breadcrumb, prev/next by origin), header (round portrait without a rank badge, Your unit / Starting
  | Custom with rarity and stars only, the three header states), and a tab bar with `?tab=`.
- **Details tab**: Primary and Secondary ability panels (stepper 1–60, rules text, next-level line, growth
  chart). No MoW has rules text in the catalog yet (0 of 22, #204), so every panel shows the missing-text
  state until the data lands, plus the Mythic panel below; no stats, radar, relic or mythic quests (the catalog
  has none for MoWs).
- **Ability upgrades tab** (`?tab=upgrades`, V1's MoW Lookup): From/To level per ability, Include owned
  materials, Total needed (gold, salvage, components, badges and forge badges per rarity), Upgrade
  materials, and a per-level table; recalculates on every change.
- The unit header is shared between character and MoW pages instead of being character-only.
- Mobile (< 768px): accordions, sticky tab bar, stacked fieldsets, horizontally scrolling per-level table.
- Page tours for the MoW list and unit page; en/de/es/fr strings.
- **Mythic panel**, built without data: the catalog has no MoW mythic ability yet (#204), so the panel shows
  "Mythic ability" with the missing-text state. Its level follows the blue stars of the values shown, and below
  Mythic it says "Unlocks at Mythic". When the catalog gains a MoW's `mythicAbility`, the panel shows its name
  and text with no UI change.

## Capabilities

### New Capabilities

- `mow-unit-details`: the Machines of War list and the MoW unit page — navigation, header and values,
  tabs, ability panels, the Ability upgrades calculator, mobile form, tours and localisation.

### Modified Capabilities

- `library-entity-routes`: `/library/machines-of-war` shows the MoW list instead of redirecting to the
  first MoW (builds on change 1's "Collection routes without an entity resolve safely").
- `library-detail-placeholder`: its only requirement (Machines of War placeholder) is removed; no Library
  collection shows the placeholder any more.

## Impact

- Apps only (`apps/web/src/fsd/pages/library`): new `ui/mows/` (list) and `ui/mow-unit/` (unit page,
  Ability upgrades), shared header moved into `ui/unit/`, `route.tsx`, `LibraryCollectionPage` retired.
- Reuses `features/goal-farming` (`mowAbilityUpgradeIds`, `mowAbilityTrackLevel`, base-material
  expansion) and `@workspace/game-catalog` (`getMows`, `getMowUpgradeCosts`, badge, forge badge and
  component icons). No new dependency.
- Locales: `library` namespace in en/de/es/fr; `mows` and `abilities` namespaces for names.
- No companion API change: all data used is already in the catalog. The missing MoW texts and mythic
  abilities are data work tracked in #204.
- Depends on `add-character-unit-details` (same branch, archived first).
