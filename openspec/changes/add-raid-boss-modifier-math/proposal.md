## Why

The Raid Bosses library detail (`/library/raid-bosses`) currently shows encounter
**modifier definitions** — each modifier's activation threshold and a
target-plus-direction label — but never applies them. V1's guild-boss detail lets
a player pick an HP-lost point on a slider and see the boss's stats, ability
variables, and field-enemy counts as they actually are at that point in the
fight. Without it a player reading the modifier list has to do the math in their
head, and the `raid-boss-library` spec scenario _"Adjusted stats reflect active
modifiers"_ is unmet.

This is the first of three separable follow-ups tracked in
`tacticus-planner-apps#122`. It ports V1's modifier math and the adjusted-stats
compare UI. Ability-text interpolation (`add-raid-boss-ability-text`) and portrait
assets (`add-raid-boss-portraits`) are the other two.

## What Changes

- Port `tacticusplanner` `src/fsd/4-entities/guild_boss/guild-boss-modifiers.ts`
  as pure functions into the raid-boss slice: `scaleModifierHpLost`,
  `getActiveModifierDefinitions`, `computeStatAdjustments` /
  `applyStatAdjustment`, `computeAbilityVariableAdjustments` /
  `applyAbilityAdjustments` / `applyAbilityConstantAdjustments`,
  `getUnitRemovals` / `applyUnitRemovals`, and the `hpLost` option builder.
- Add an **adjusted-stats view** to the detail: an HP-lost selector across the
  selected encounter's modifier thresholds (0 = full HP through each threshold),
  showing the boss's stat block, ability variables, and field-enemy list
  recomputed for the modifiers active at that point, side by side with the
  unadjusted values.
  - **Desktop:** dual panel — one per fight side / prime — with an HP-lost
    slider each (V1 `prime-modifier-panel.tsx`).
  - **Mobile:** a single panel with an HP-lost stepper and a toggle to show the
    adjusted values inline in the existing stat list.
- Carry over V1's `guild-boss.service.spec.ts` modifier cases as the unit tests
  for the ported math.
- Fold in the outstanding **sync-failure state** for the page (a distinct error
  state with a retry affordance): the `raid-boss-library` spec already requires
  it, only the implementation has loading / absent / ready today. _(If
  `add-raid-boss-ability-text` or `add-raid-boss-portraits` lands first, this
  item moves to that change — it is a small self-contained gap, not a dependency
  of the modifier math.)_
- i18n: new `library` namespace keys for the HP-lost selector, the
  adjusted/base column labels, and the unit-removal note, plus the tour step for
  the adjusted-stats area — full de/es/fr parity.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `raid-boss-library`: the "field enemies and prime modifiers" requirement drops
  its `#122` out-of-scope caveat; a new requirement covers the adjusted-stats
  view (HP-lost selection, recomputed stats/ability-variables/enemy counts,
  desktop dual-panel vs mobile single-panel, and the tour step).

## Impact

- `apps/web/src/fsd/entities/raid-boss/lib/` — new `modifier-math.ts` (+ test)
  ported from V1; `encounters.ts` / `format-modifier.ts` gain the active-set and
  scaling helpers; barrel re-exports.
- `apps/web/src/fsd/pages/library/ui/raid-bosses/` — `raid-boss-detail.tsx`
  gains the adjusted-stats section; `desktop/` and `mobile/` sub-pages wire the
  HP-lost control per platform; `raid-bosses-page.tsx` /
  `raid-bosses-page.view-model.ts` thread the selected HP-lost point;
  `hooks/use-raid-bosses-catalog.ts` unchanged.
- `raid-bosses.tutorial.tsx` — the `primeModifiers` step gains / is joined by an
  adjusted-stats step (desktop + mobile).
- `apps/web/public/locales/{en,de,es,fr}/library.json` — new `raidBosses.*` and
  `tour.raidBosses.steps.*` keys.
- `apps/web/src/fsd/pages/library/ui/raid-bosses/raid-bosses-page.tsx` — the
  sync-failure branch (if it lands here).
- Depends on no API change.
