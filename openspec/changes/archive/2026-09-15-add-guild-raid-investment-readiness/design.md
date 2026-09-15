## Context

See `proposal.md`. Exact readiness (`guild-raid-exact-meta-readiness`)
currently reports each hero as owned/missing and classifies a recommendation
as Ready/Partial/Unavailable purely from that count; it explicitly avoids
comparing investment against any minimum. `add-dailies-guild-raid-playable-variants`
was designed (never implemented) to fill missing slots from owned candidates
using a bounded constrained-assignment search, tie-broken by the existing
`characterCombatPower` estimate, and to add a four-state
Exact/Playable/Partial/Unavailable label — explicitly treating combat power as
"never an effectiveness value."

Two pieces of already-synced data now make an investment _threshold_ possible
without inventing one:

- `raid-bosses`' `GameCatalogRaidBossView.StatProgression` — each boss's fixed
  27-step ladder; each step already carries its own `ProgressionIndex` (0–19)
  matching the character `Progression` ladder's vocabulary exactly (confirmed:
  `BaseRarity`/star values at a step reconstruct the same `Progression` entry
  `progressionAt` would return).
- `GuildRaidBossStatus.progressionIndex` — the guild's live current step on
  that boss (already shipped by `add-dailies-guild-raid-status`), a 1-based
  index into `StatProgression` (`StatProgression[progressionIndex - 1]`,
  mirroring the API's own `StatStepAt`).

Chaining these gives a `Progression` value with no authored or fabricated
number anywhere in the chain.

## Goals / Non-Goals

**Goals:**

- Compute a 0–100% investment-readiness value per hero/Machine-of-War slot and
  one weighted team percentage, derived only from already-synced catalog and
  live-status data.
- Show, for a flex slot, every owned candidate's percentage so the player can
  compare alternatives, not just the one auto-selected.
- Reuse the assignment-matching design already written for
  `add-dailies-guild-raid-playable-variants` for _which_ candidate fills a
  slot, replacing its combat-power tie-break with the new percentage.
- Consume the companion API's widened contract: a boss may now carry more
  than two recommendations, `kind` is a free-form archetype id, and primes
  carry their own curated comps.

**Non-Goals:**

- A per-slot or per-boss authored investment target. Every dimension the
  percentage compares against is derived from synced data, never authored.
- Damage prediction, turn-order/mechanic modeling, or any performance claim
  beyond the sourced `efficiency` figure the companion API change already
  adds.
- A server-computed value. This is entirely a client calculation over data the
  client already has.

## Decisions

### Derive the required threshold from the boss's own progression, not an authored number

For the boss currently active in `GuildRaidBossStatus`, resolve
`StatProgression[status.progressionIndex - 1].ProgressionIndex` and pass it to
`progressionAt()` to get a `Progression` value. This one derived value is the
**boss-wide** required threshold — the same for every hero slot in every
recommendation for that boss; there is no per-slot or per-role difficulty data
to justify anything finer. From it:

- `requiredRank = maxRankForProgression(required)`
- `requiredAbilityLevel = abilityCapForProgression(required)`
- `requiredProgressionIndex = progressionIndex(required)`

### Score a hero as the average of three independently-capped ratios, not one combat-power ratio

Per hero slot, for an **owned** hero:

```
rankRatio        = requiredRankIndex <= 0 ? 1 : min(1, rankIndex(actual.rank) / requiredRankIndex)
progressionRatio = requiredProgressionIndex <= 0 ? 1 : min(1, progressionIndex(actual.progression) / requiredProgressionIndex)
abilityRatio      = requiredAbilityLevel <= 0 ? 1 : min(1, avg(actual.activeAbilityLevel, actual.passiveAbilityLevel) / requiredAbilityLevel)
heroReadiness     = round((rankRatio + progressionRatio + abilityRatio) / 3 * 100)
```

An **unowned** hero is `0%`. Rejected: a single `characterCombatPower(actual) /
characterCombatPower(required)` ratio. It reads naturally from the existing
formula, but it lets one dimension's overshoot mask another's shortfall (a
heavily-ranked-up but ability-starved hero could clear 100% while genuinely
short on abilities), it requires assuming an arbitrary `appliedUpgradeCount`
for the "required" reference character (nothing to derive that from), and it
folds three legible numbers into one opaque one. The independently-capped
average matches "rank AND progress AND abilities each at or above the boss's"
directly, degrades smoothly instead of cliff-editing at each dimension, and
each of its three components is meaningful to show on its own in the UI.

### `kind` resolves through the same readable-fallback pattern as `roleId`, not a translation table keyed to a fixed set

Since `kind` is now a free-form archetype id (`lavistodes`, `neuro`,
`battlesuit`, `admech`, and whatever a future source adds), the presentation
layer resolves it exactly like an unknown `roleId` already is: a known id maps
to a localized label; an unknown one falls back to a readable
id-to-words conversion rather than a broken or blank label. No closed
translation-key enum is added, since the set is expected to grow as sources
add archetypes.

### Recommendation cards render however many recommendations a boss/prime has

The card list for a boss's (or prime's) recommendations already iterates the
authored array; nothing in the matching, scoring, or ordering logic assumed
exactly two. The only UI change beyond what was already planned is that the
desktop/mobile layouts must handle 1–4 cards gracefully (verified by a
component test with three recommendations, not just the two used elsewhere in
this doc's examples).

### Primes get curated-comp display, not the investment-readiness engine

A prime's `primes[].recommendations` (when present) renders with the same
roster/role/Machine-of-War/`efficiency` presentation already built for boss
recommendations, reusing `resolveRecommendation`. It does **not** run the
percentage-readiness calculation, the constrained-assignment matcher, or the
flex-candidate comparison — primes are meaningfully easier than the boss they
accompany (`add-raid-boss-mobile-picker`'s design and the source data both
treat them as secondary), and the existing "no curated comp → roster-agnostic,
any owned team" fallback already covers a prime with no `primes[]` entry.
Extending the full engine to primes is left for a future change if player
demand shows it's worth the added surface.

### Machine-of-War readiness is one dimension, not three

`GameCatalogMachineOfWar`/player MoW records have no `rank` field (confirmed:
`playerMowSchema` is exactly `playerUnitBaseSchema`, no rank, no equipped
items). MoW readiness is therefore `progressionRatio` alone, using the same
`requiredProgressionIndex` derived above — not padded with a fabricated
second or third dimension.

### Team score weights essential slots higher than flex

`teamReadiness = Σ(weight_i × heroReadiness_i) / Σ(weight_i)` across the five
hero slots plus the Machine-of-War, with `weight = 2` for a slot where
`essential` is `true` and `weight = 1` otherwise (flex slots and the Machine
of War). This is a plain weighted average, not a new coefficient system —
adjustable later without a schema change since weights are a display-layer
constant, not authored data.

### Reuse the playable-variants matcher; replace its ranking signal and label

Port the bounded constrained-assignment search designed for
`add-dailies-guild-raid-playable-variants` (lock owned ideal heroes; search
missing slots' explicit `replacementCharacterIds`; maximize filled essential
slots, then total filled slots) into `entities/guild-raid-meta` unchanged in
structure. Two things change:

1. The tie-break/ranking signal is investment-readiness percentage instead of
   `combatPowerOf`.
2. The result is `teamReadiness` (a percentage, with each slot's percentage
   and every owned candidate's percentage attached) instead of the four-state
   `Exact/Playable/Partial/Unavailable` label. A UI badge MAY still bucket the
   percentage into ready/partial/unavailable-style copy, but that bucketing is
   presentation, not the underlying signal, and boundary values are a UI
   decision made during implementation, not part of this data contract.

`add-dailies-guild-raid-playable-variants` is removed outright (proposal,
design, spec delta) rather than left to coexist — none of its tasks were
implemented, and shipping both a percentage and a four-state label for the
same underlying comparison would be confusing, not complementary.

### Flex-slot candidates show every owned option's percentage

For a slot with `essential: false` (or any slot, when the ideal hero is
missing), the presentation resolves `heroReadiness` for every id in
`replacementCharacterIds` that the player owns, not only the one the matcher
selected to fill the lineup. The matcher's pick is still shown as the
recommended lineup; the additional candidates are supplementary comparison
data, matching the explicit ask that flex slots show "readiness of other
characters."

### Investment data needs three fields exact-readiness already fetches but doesn't use

`use-guild-raid-exact-readiness.ts` currently builds
`GuildRaidExactReadinessInvestment` maps with only `{xpLevel, rank}` per
character and `{xpLevel}` per Machine of War, even though the roster query it
reads from already carries `progressionIndex`, `activeAbilityLevel`, and
`passiveAbilityLevel`. This change extends those maps to carry the three
additional fields the ratios above need — no new data source, just wiring
already-fetched fields through.

### Absent live status falls back to ownership-only display, not a fabricated percentage

When `GuildRaidBossStatus` is absent, stale, or the guild has no observed
season (`GuildRaidObservationState !== "active"`), there is no
`progressionIndex` to derive a threshold from. The feature falls back to the
prior ownership-only Ready/Partial/Unavailable display for that recommendation
— the same "signal unavailable, don't infer" precedent already used for an
absent/older Meta rules payload — rather than defaulting to 0%, 100%, or the
Stone1 floor.

## Risks / Trade-offs

- [Risk] Redefining "Ready" to require investment, not just ownership, changes
  what returning users see for teams they already consider ready. → State this
  plainly in the modified spec requirement and the PR description; it is a
  deliberate behavior change, not a regression.
- [Risk] The three-ratio average can still look generous (e.g. 67% average
  from one maxed and two zeroed dimensions looks like meaningful progress when
  two dimensions are untouched). → Show the three component ratios alongside
  the combined percentage in the UI so the breakdown is never hidden behind
  one number.
- [Risk] A boss-wide (not per-role) threshold may under-demand support/utility
  roles and over-demand pure-damage roles relative to real difficulty. →
  Documented as a known simplification; no per-role difficulty data exists to
  do better, and it is easy to move to per-slot thresholds later without a
  breaking schema change if such data appears.
- [Risk] Porting the unimplemented matcher design carries forward any latent
  design gaps in it (e.g. its tie-break edge cases) without the benefit of it
  ever having shipped. → Its existing table-driven test plan (locked heroes,
  duplicate-candidate conflicts, impossible-completion reservation) is reused
  as the base test list here, adapted for the new ranking signal.

## Migration Plan

Apply only after the companion API change (`efficiency`, `primeUnitSetIds`,
sourced rosters). Remove `add-dailies-guild-raid-playable-variants` first (no
implementation to preserve). Extend the investment maps, add the derivation
and scoring functions with unit tests, then the matcher, then presentation and
UI. Verify live against the running API before UI work, as prior Meta-catalog
changes have. Rollback removes the percentage calculation and UI; exact
ownership readiness (owned/missing) remains intact underneath it throughout,
since the percentage is additive to that existing signal, not a replacement
data source.
