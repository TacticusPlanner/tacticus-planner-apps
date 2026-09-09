## Context

See `proposal.md` for the motivation and the delta spec for observable
requirements. The served `raid-bosses` payload already contains the ordered
season rotation and the complete `season -> tier -> set -> encounter` tree.
The current page instead calls entity helpers that search every season and pick
a representative encounter from the selected progression step; its generic
Library selection hook canonicalizes the bare collection path to the first
entity. Both choices prevent V1-style season orientation and can make a detail
opened from a season map describe another occurrence of the same entity.

The companion `add-raid-boss-mobile-picker` change alters only the mobile
entity-navigation control. `refine-raid-boss-detail-parity` alters detail
presentation. This change provides the season-context layer they can consume;
it must not duplicate their planned work.

## Goals / Non-Goals

**Goals:**

- Make the bare collection route a shareable season board that retains exact
  encounter identity through navigation to a detail.
- Keep direct entity URLs usable with today's catalog-wide fallback behavior.
- Make one entity-owned resolver the source of truth for both board projection
  and context validation.

**Non-Goals:**

- Do not add an API endpoint, catalog field, or a claim that a selected season
  is currently live; the payload carries order, not schedule dates.
- Do not recreate V1's tall boss portraits, NPC modal, or static styling;
  continue using V2 portrait fallbacks and detail components.
- Do not alter modifier calculation semantics, ability text resolution, or
  game data.
- Do not fold the separately scoped mobile grouped picker or detail-parity
  presentation changes into this implementation.

## Decisions

### 1. The base collection route owns season selection; the entity path owns detail selection

`/library/raid-bosses` becomes the season board and owns the `season` search
parameter. It defaults from `seasonConfigRotation[0]`, retaining the parameter
only for a non-default choice. `/library/raid-bosses/:entityId` is the entity
detail route. A valid board-card navigation adds `season`, `tier`, `set`, and
`encounter`; direct details need none.

This is route-specific state, so `RaidBossesPage` (or a page-local route-state
hook) replaces `useLibraryRouteSelection` for this route. The generic hook and
other Library collections retain their existing canonicalization contract.

Alternative rejected: retain the bare route's automatic first-entity redirect
and add an in-page season tab. That makes the season reference undiscoverable
and creates two competing default selections.

### 2. The raid-boss entity slice validates and resolves exact encounter context

Add a public entity type representing the complete location
`{ seasonId, tier, set, encounterIndex }` and a pure resolver that only returns
a location when every level exists and its encounter targets the requested
unit-set ID. Add a pure board projection that starts from a selected served
season and returns tiers in descending numeric order, sets in descending set
order, and unmodified encounter order. The page converts resolved units to
display items using the existing catalog hook's names and portraits.

Existing encounter consumers receive an optional resolved location/slot. When
present, `buildModifierContext`, `fieldNpcIdsForStep`, and `buildAdjustedView`
use it rather than calling the catalog-wide picker. The page initializes a
contextual detail to `progressionIndex - 1`, clamped; without context it keeps
`maxKnownProgressionIndex`. Context is dropped as a whole whenever the user
navigates via the all-entity chooser.

This keeps season-shape traversal out of page components and avoids maintaining
independent board, modifier, and adjusted-stat lookup paths.

Alternative rejected: pass raw query parameters independently to each display
component. It invites partial validation and divergent context selection.

### 2a. Entity details expose an explicit return to the season reference

Every valid entity detail renders a localized **View season reference** action.
It navigates to the bare collection route, retains a valid selected `season`,
and clears exact `tier`, `set`, and `encounter` parameters. This makes the
board/detail relationship discoverable on desktop and mobile without changing
the existing all-entity chooser or direct-link fallback behavior.

### 3. Board and detail are different responsive forms with route-aware tours

Desktop displays a compact selector and tier sections containing horizontal
set rows. Mobile keeps every card reachable in the vertical document flow,
without requiring horizontal scrolling. Existing desktop and mobile detail
components remain the owners of their respective detail layouts. The active
route selects the tour steps: season selector + board for landing, and entity
navigation + detail controls for detail. This avoids Joyride targets that are
not mounted.

The existing mobile picker change remains the owner of the mobile entity
chooser. During integration it replaces the current mobile `RaidBossList`; this
change only requires the chooser to clear an exact board context when choosing
a different entity.

### 4. Season availability and URL recovery are explicit

Season IDs are validated against the intersection of `seasonConfigRotation`
and `seasons`. A bad or omitted ID selects the first valid ID; no valid ID
renders a dedicated no-season-reference state. A bad entity route returns to
the validated season board. A context is accepted only if all four fields parse
and refer to the path entity, otherwise the detail uses its non-contextual
fallback. Query canonicalization preserves unrelated parameters while removing
or replacing invalid context as one unit.

## Risks / Trade-offs

- [Two active deltas modify `raid-boss-library`] -> Integrate after reviewing
  both artifacts; keep component ownership separate and reconcile the combined
  delta before archive.
- [The first rotation entry can be mistaken for a live-season claim] -> Label
  it as the default season, not "current," until a dated source exists.
- [A direct link contains stale or tampered context] -> Validate all location
  levels plus unit identity, then fall back atomically.
- [The full season board is long on phones] -> Use vertical tier sections and
  preserve semantic headings; do not hide sets behind a horizontal-only strip.
- [Existing tests expect bare-route entity canonicalization] -> Replace those
  route assertions and retain direct-detail fallback coverage rather than
  broadening the generic Library route-hook tests.

## Migration Plan

1. Deploy as a frontend-only change after the synced catalog provides at least
   one valid rotation season (the current catalog already does).
2. Existing `/library/raid-bosses/:entityId` bookmarks continue to resolve as
   details with representative context when they have no new query parameters.
3. Existing bare `/library/raid-bosses` bookmarks change intentionally to the
   season reference; users can still select any entity from a detail.
4. Roll back by restoring the prior page route-state behavior; no persisted
   player data, API contract, or migration is involved.
