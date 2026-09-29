## Context

See `proposal.md` — Why. Three display gaps in the already-shipped
`/library/raid-bosses/{id}` detail view (`raid-boss-detail.tsx` +
`raid-boss-adjusted-stats.tsx`, one shared component pair for desktop and the
`compact` mobile form). No data-model, math, or routing change.

Relevant current code:

- Progression option label is `raidBosses.progressionStep` →
  `Step {{step}}/{{total}} · {{rarity}} · ★{{stars}}` (`raid-boss-detail.tsx`).
- The Prime Modifiers panel labels thresholds via `raidBosses.atHpLost` →
  `At {{hpLost}}% HP lost`, where `hpLost = round(100 * (index + 1) / total)`
  over the modifier list (`ModifierRows` in `raid-boss-detail.tsx`).
- The adjusted-stats HP-lost `<Select>` labels points via
  `raidBosses.hpLostAmount` → `{{hpLost}} / {{total}} HP lost` over
  `panel.hpLostPoints` (absolute HP values `[0, ...thresholds]`, last =
  `panel.totalHp`) in `raid-boss-adjusted-stats.tsx`.
- `affectedRows()` builds `{ dmg, fixedArmor, movement, crit*, block* }`
  candidates then `.filter(row => touched.has(row.key))` — health is not even a
  candidate; the hits row is separate and gated on `hitsDelta`.

V1 parity references (sibling `tacticusplanner` repo):
`3-features/guild-boss-reference/components/progression-selector.tsx` builds its
label as `` `${stat.BaseRarity} ${count}` `` with a running per-rarity counter and
appends `` `(${stat.Health.toLocaleString()})` ``. V1's stat tiles are a fixed
Health / Armour / Damage / Movement set, always shown.

## Goals / Non-Goals

**Goals:**

- Progression option label carries the rarity tier name (`Legendary 2`) and the
  step's total health.
- One HP-lost framing (percentage) across the Prime Modifiers panel and the
  adjusted-stats selector.
- Adjusted-stats table lists the full stat set with base + adjusted columns,
  unfiltered.

**Non-Goals:**

- No change to modifier math, `buildAdjustedView`, ability-text resolution,
  portrait resolution, the tour, or routing.
- Not matching V1's inline rarity/star/rank icons in the option row, nor V1's
  tall always-open scroll list — the V2 control stays a `<Select>`.
- Rank/Stars stay as plain stat rows (not moved onto the portrait) — decided with
  the user.
- Full boss splash art in the header stays deferred (`tacticus-planner-apps#122`,
  archived portraits change task 7.1).

## Decisions

### 1. Rarity tier index computed from `statProgression`, page-local

`statProgression` is ordered and rarity groups are contiguous
(Common → … → Mythic). The tier number for step `i` is
`i − firstIndexWithSameBaseRarity + 1`. Implement as a small pure helper that
maps the ladder once to `{ tierLabel, health }[]` (a running
`Map<baseRarity, count>`, mirroring V1's `progression-selector.tsx`).

Keep it page-local in `raid-boss-detail.tsx` unless a matching helper already
exists on the `raid-boss` entity — the entity's `statProgression` shape is the
only input and no other page needs it. Alternative (rejected): add it to the
served payload or the entity barrel — more surface for a label-only concern.

New i18n key `raidBosses.progressionStepLabelled` (or extend
`progressionStep`) → e.g. `{{rarity}} {{tier}} · ★{{stars}} · {{health}} HP`.
The `w-56` trigger already truncates; the full label shows in the open list.
Keep `{{step}}/{{total}}` out of the new label to save width — the spec makes the
step count optional and the tier name is the recognisable identifier.

### 2. Percentage as the shared HP-lost unit

Converge the adjusted-stats selector onto the panel's percentage framing rather
than the reverse. Rationale: the percentage schedule is stable across
progression steps (the absolute HP thresholds are rescaled per step by
`scaleModifierHpLost`, so the absolute label churns as you change step), it is
more compact in the 8-row panel, and the panel already uses it.

Compute the percentage from the point's **position**, not by dividing HP, so it
matches the panel exactly: for `panel.hpLostPoints[k]` with `k ≥ 1`,
`percent = round(100 * k / (hpLostPoints.length − 1))`. Dividing
`point / totalHp` would drift by a rounding unit from the panel's
`round(100 * (index + 1) / total)`.

Reuse `raidBosses.atHpLost` for the option text (drop the leading "At " by
adding a sibling key `raidBosses.hpLostPercent` → `{{hpLost}}% HP lost`; the
panel keeps `atHpLost`). `0` keeps `raidBosses.fullHp`. `raidBosses.hpLostAmount`
becomes unused → remove it and its de/es/fr entries.

`onHpLostChange` / `hpLostByPrime` still carry the **absolute** HP value
(`SelectItem value={String(point)}`) — only the visible label changes, so
`buildAdjustedView` and `getActiveModifiers` are untouched.

### 3. `affectedRows` → `allRows`, add health, drop the filter

Remove the `.filter(row => touched.has(row.key))`. Prepend a `health` row
(`base: step.health`). `applyStatAdjustment(base, key, view.statAdjustments)`
already returns `base` when a key has no pct/flat entry, so untouched rows render
`base === adjusted` with no special-casing. The `nothingActive` guard
(`activeModifiers.length === 0 && removed.length === 0`) still short-circuits to
`raidBosses.noActiveModifiers` — a full-HP / no-modifier point shows the message,
not a full base-only table, matching today's behavior and the "Full-HP point"
scenario.

Keep the separate hits row gated on `hitsDelta` (weapon hits are not a
`statProgression` field; base is shown as `—`).

## Risks / Trade-offs

- **Non-contiguous rarity groups would mislabel tiers** → In practice ladders are
  monotonic; the helper counts occurrences rather than assuming fixed group
  sizes, so a gap would restart numbering but never crash. A unit test over a
  real ladder (Tervigon: Common 1–4, …, Legendary 1–5, Mythic 1–5) covers it.
- **Wider adjusted table on mobile** (4–7 rows instead of 1) → the mobile form
  already has the show/hide toggle for the adjusted column; base-only rows are
  short and the section is below the fold.
- **Dropping `hpLostAmount`** → knip flags unused keys; removing it from all four
  locale files in the same change keeps `lint` green.
