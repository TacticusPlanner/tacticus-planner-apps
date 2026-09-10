## Context

See `proposal.md` and the `raid-boss-library` delta spec. The current public
page already has a desktop/mobile orchestrator, path-backed Boss/Prime
selection, a complete `raid-bosses` payload containing season rotation, and a
Details tutorial. The companion `add-guild-raid-meta-catalog` pair adds
manifest-synced strategy data. Two planned but unimplemented page changes add
mobile picking and detail display parity.

## Goals / Non-Goals

**Goals:**

- Present seasons, strategy, and current reference details in one public Guild
  Raid Boss Library with linkable state.
- Keep Details behavior intact while adding independently recoverable Meta
  states.
- Bring the useful V1 Comp taxonomy forward without importing private guild
  roster workflows or copying V1's UI.

**Non-Goals:**

- No guild roster coverage, personal teams, API-key data, replay playback, or
  automatic recommendation analysis.
- No route/API/catalog identifier rename and no modification to encounter or
  modifier math.
- No duplication of the existing mobile-picker or detail-parity task scope.

## Decisions

### 1. One common page shell owns URL state and tab selection

The current `RaidBossesPage` becomes a common orchestrator for `tab`,
`season`, `comp`, and existing path-backed `entityId` state. `details` is the
default tab; the entity path remains canonical across every tab so browser
back/forward and switching tabs preserve the selected Boss/Prime. The shell
derives a selected season from rotation order and clears invalid URL values.

Alternative rejected: separate routes per tab. That would compete with the
existing optional `:entityId` route and makes shared Details selection more
fragile.

### 2. Keep page-specific orchestration and extract reusable Meta domain logic

`pages/library/ui/raid-bosses` owns responsive page orchestration, tab views,
and URL state. The companion's `entities/guild-raid-meta` public API provides
resolved recommendation/Comp values. Details continues to use its existing
raid-boss entity helpers; Seasons Config reads the existing payload through the
page-local catalog hook. No page imports another page or reaches into
game-catalog internals.

### 3. Use distinct responsive forms, not a reflow-only layout

Desktop places the tab list above dense season and Meta content; Details keeps
its sticky roster beside the detail. Mobile keeps a horizontally usable tab
list, uses the planned grouped entity picker for Details, and represents season
sets and Comp guidance as stacked accordions/cards. Meta uses the same facts on
both platforms but switches from a multi-card scan layout to a single-column
reading flow.

Tours select steps for the active tab: shared tabs first, then only present
controls. Desktop and mobile use separate targets where the structure differs.

### 4. Use the existing `library` namespace and source id mapping

All new public copy, including Guild Raid Boss terminology, tab labels,
empty/retry messages, source attribution, Comp labels, and tours is added to
`library.json` in all four locales. The source URL comes from the companion
entity's known source-id mapping; the page renders it as an external link and
does not fetch or embed external media.

### 5. Preserve V1 Comp content, redesign its interaction

The V1 Comp source uses seven signature ids—`admecRuststalker`, `tauCrisis`,
`custoBladeChampion`, `emperExultant`, `spaceBlackmane`, `tyranNeurothrope`,
and the `thousDaemonPrince` MoW—for AdMech, Battlesuits, Custodes, Laviscus,
Multi-Hit, Neuro, and Z'Kar. V2 reuses their ids and core/flex/MoW lists via
the new catalog dataset. It redesigns V1's dense member-table toggles as a
public Meta filter plus expandable Comp cards.

## Risks / Trade-offs

- [The Meta dataset is not yet synced] -> Meta has its own loading, unavailable,
  retry, and no-results states; Details/Seasons remain usable.
- [Three tabs widen mobile navigation] -> use a horizontal touch-friendly tab
  list rather than shrinking labels or hiding a view.
- [Concurrent page changes collide] -> apply the Meta catalog pair first, then
  integrate tabs with the mobile picker and detail parity at component
  boundaries; do not duplicate their tasks.
- [Translated text expands] -> use responsive labels/layout and verify all four
  locales at desktop and mobile breakpoints.

## Migration Plan

1. Apply the API then apps portions of `add-guild-raid-meta-catalog`.
2. Integrate the existing mobile-picker and detail-parity changes at their
   declared Details-only boundaries.
3. Deploy the tab shell with Details as the URL default, preserving existing
   `/library/raid-bosses/{unitSetId}` links.
4. Roll back by deploying the previous apps build; existing paths and catalog
   data stay backward compatible.

## V1 Comp parity checklist

- **Reuse:** the seven Comp ids, signature unit ids, and core/flex/MoW lists
  from V1's `guild-roster-snapshots.models.ts`.
- **V1 navigation/layout:** the V1 Comps column is a private dense roster table;
  V2 keeps its filter meaning but redesigns it as public Meta cards and
  accordions.
- **Keep:** toggling a Comp filters relevant information; icon/name fallbacks
  remain available.
- **Drop:** per-guild-member Comp assignment, API-key inputs, roster coverage
  sorting, and private shared-leaderboard states because the Library is public.
- **Redesign:** V1's fixed seven-icon control becomes an accessible labelled
  filter; core/flex/MoW lists become expandable guidance rather than implicit
  roster categories.
