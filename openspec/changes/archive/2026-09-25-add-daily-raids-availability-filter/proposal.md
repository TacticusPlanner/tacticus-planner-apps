## Why

Raids Plan's Day 1 column lists nodes whose real attempts today are already
exhausted alongside nodes the player can still raid, so it is hard to see what
is left to do. Today already excludes exhausted nodes. This change addresses
that narrow part of `DAILY-06`; it does not claim full V1 parity or complete
resolution of the broader request to exclude locked or unavailable nodes.

## V1 comparison and scope

Compared against the local V1 checkout at `26e5155f`:

- `src/fsd/3-features/goals/upgrades.service.ts`, `populateLocationsData`:
  campaign progress determines unlock state; selected campaign events,
  farming preferences, and location filters determine suggested locations.
  These eligibility decisions are distinct from today's remaining attempts.
- `src/routes/tables/daily-raids.tsx`: location filters feed the planning
  calculations, rather than only hiding rendered rows.
- `src/routes/tables/today-raids.tsx`: actionable material cards are followed
  by a separate "RAIDED" section of completed material and shard cards.
  Completed raids are retained and shown separately, not hidden and not
  behind a toggle.

V2's Raids Plan adopts that V1 presentation for Day 1: exhausted nodes move
into a separate "Raided" section after the actionable ones. It is not a port
of V1's planning filters. Campaign unlocks, event eligibility, farming
strategy, energy affordability, and broader actionable-list behavior remain
outside this change. Today's existing V2 behavior is preserved rather than
replaced with V1 behavior.

## What Changes

- Raids Plan's Day 1 ("Today") column shows actionable nodes first, then a
  "Raided" divider followed by the nodes whose real attempts-left today have
  reached zero. Always on: no toggle or other control.
- Only Day 1 is split. Day 2 onward have no real synced attempts-left data —
  the simulated plan's per-day attempt caps are a projection, not a record of
  what's actually been used — so they are unaffected, matching how
  `daily-raids-today` already scopes exhaustion to "today only (not a
  multi-day plan)".
- Treat missing attempt data as unknown, not exhausted: those nodes stay in
  the actionable section.
- Keep the split independent from card presentation: both sections keep Raids
  Plan's material-oriented layout, density setting, relative ordering, and
  calculated plan totals. Reuse the existing `isLocationVisible` predicate
  without switching the card's `emphasis`.
- Omit groups with no nodes in a section, and omit the "Raided" divider when
  nothing is raided.
- Today's page keeps its current, already-specified unconditional hiding of
  exhausted nodes unchanged — this proposal does not touch or weaken that
  existing `daily-raids-today` requirement.

## Capabilities

### Modified Capabilities

- `daily-raids-plan`: gains a new requirement — Day 1 presents raided
  (exhausted) nodes in a separate section after actionable nodes, with no
  effect on Day 2 onward.

## Impact

- `apps/web/src/fsd/pages/dailies/ui/raids-plan-page.tsx` — Day-1-only
  partition of entries into actionable and raided, and the extra "Raided"
  section.
- Dailies schedule presentation and tests as needed to apply the existing
  `isLocationVisible` predicate independently of card emphasis. Passing today's
  attempt map to future days is explicitly prohibited: matching battle IDs
  would otherwise be incorrectly separated there too.
- Translation addition (`dailies.json`, all four locales) for the "Raided"
  section heading.
- No behavior changes to Today, the visibility predicate, the planning
  calculations, or the `daily-raids-today` capability.
- No backend/API changes — apps-only, no companion
  `tacticus-planner-api` change.
