## Why

Exact readiness only reports whether the five ideal heroes are owned — it says
nothing about whether an _owned_ hero is actually leveled enough for the boss
the guild is currently fighting, and there is no signal at all for how one
authored recommendation compares to another. The companion API change adds a
sourced per-recommendation `efficiency` figure and confirmed primes; this
change adds the investment side: a percentage readiness per hero and Machine
of War, derived entirely from data already synced to the client (the boss's
own catalog stat-progression and the live current Guild Raid step), combined
into one weighted team score.

`add-dailies-guild-raid-playable-variants` (unimplemented, 0/14 tasks) set out
to solve a related but narrower problem — which owned character fills a
missing slot — with a constrained-assignment matcher and a four-state
Exact/Playable/Partial/Unavailable label. This change reuses that matcher's
assignment logic but replaces its combat-power tie-break and discrete label
with the new percentage, and supersedes it outright rather than shipping both.

## What Changes

- Add `efficiency`, `primeUnitSetIds`, and a `primes[]` array (curated comps
  for primes, reusing the boss recommendation shape) to the client
  `guild-raid-meta` schema, storage, and query surface, matching the
  companion API contract. Widen `kind` from a closed `meta`/`alternate` enum
  to a free-form archetype id — a boss may now author more than two
  recommendations.
- Add curated-comp display for primes (roster, roles, Machine of War,
  `efficiency`), resolved the same way boss recommendations are, but without
  the investment-readiness percentage engine below — primes are
  meaningfully easier than the main boss and stay a simple ownership-based
  display, matching their existing roster-agnostic fallback for primes that
  have no curated comp.
- Add an investment-readiness percentage per hero slot, for boss
  recommendations only: `0%` when the hero is unowned, otherwise the average
  of three independently-capped ratios (rank, progression, and ability level,
  each capped at 100% of the required value), where the required
  rank/progression/ability level is derived from the boss's own catalog
  `StatProgression` step at the guild's live current `progressionIndex`
  (`GuildRaidBossStatus`, already shipped) — no authored or invented
  threshold.
- Add the same percentage for a Machine of War, using the progression ratio
  alone (Machines of War have no rank field).
- Combine the five hero percentages and the Machine-of-War percentage into one
  team readiness percentage, weighting essential slots higher than flex slots.
- For a flex slot, resolve and display the percentage for every owned
  candidate in `replacementCharacterIds` (not only the one selected to fill
  the slot), so the player can compare alternatives at a glance.
- Reuse `add-dailies-guild-raid-playable-variants`' constrained-assignment
  design (lock owned ideal heroes, bounded search over explicit replacements,
  essential-slots-first objective) to choose which owned candidate fills each
  open slot, ranking candidates by investment-readiness percentage instead of
  raw combat power.
- Remove `add-dailies-guild-raid-playable-variants` (its proposal, design, and
  spec delta) — this change supersedes it before any of its tasks were
  implemented.
- Update responsive UI, tutorial, and translations for the percentage
  readiness and per-candidate flex-slot display.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `guild-raid-meta-catalog`: Adds `efficiency`, `primeUnitSetIds`, and a
  `primes[]` curated-comp array to the synced/queried Meta contract, and
  widens `kind` to a free-form archetype id (a boss/prime may have more than
  two recommendations), matching the companion API dataset.
- `guild-raid-exact-meta-readiness`: Replaces the pure ownership-count
  Ready/Partial/Unavailable classification with an investment-readiness
  percentage per hero/Machine of War and a weighted team percentage, and
  removes the prior "SHALL NOT compare investment with an invented minimum"
  and "SHALL NOT calculate a readiness score" constraints — the threshold this
  change compares against is derived from already-synced catalog/live data,
  not invented. A fully-owned but under-leveled team is no longer classified
  the same as a fully-owned, sufficiently-leveled one.

## Impact

- Affects `packages/game-catalog` (schema/storage/queries),
  `entities/guild-raid-meta` (the percentage calculator, candidate ranking,
  prime-comp presentation, and boss presentation), the Dailies Guild Raid page
  (desktop/mobile), tutorial steps, and all four locale files.
- `add-dailies-guild-raid-playable-variants` is removed as a standalone change;
  its matcher design is carried forward here, not discarded.
- Does not add damage prediction, boss-mechanic/turn-order scoring, or any
  server-computed player-specific value — the percentage is computed entirely
  client-side from already-synced data.
