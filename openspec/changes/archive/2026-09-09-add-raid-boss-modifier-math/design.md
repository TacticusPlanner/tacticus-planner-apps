## Context

See proposal.md — Why. The V2 detail already resolves the encounter, its
modifier definitions, and the per-step stat ladder
(`entities/raid-boss/lib/encounters.ts`, `format-modifier.ts`,
`use-raid-bosses-catalog.ts`). What is missing is the arithmetic that turns a
modifier definition + an HP-lost point into adjusted numbers, and the UI to pick
that point. V1 has both, split across
`4-entities/guild_boss/guild-boss-modifiers.ts` (~356 lines of pure functions,
already fully covered by `guild-boss.service.spec.ts`) and
`1-pages/guild-boss-detail/` + `prime-modifier-panel.tsx` (the slider UI).

Prior work established that raw `hpLost` values are an `i/N` fraction of an
authoring-time HP baseline, not a usable absolute — V1's `scaleModifierHpLost`
rescales them to the displayed total HP. The V2 modifier list already renders
positional thresholds for this reason.

## Goals / Non-Goals

**Goals:**

- Port V1's modifier math verbatim as pure, separately tested functions — same
  clamping, same additive summation, same rounding — so the numbers match V1.
- One HP-lost selection model shared by desktop and mobile; one canonical
  "adjusted result" structure that both the stat block, the ability variables,
  and the enemy list read from.
- Reuse V1's spec cases as the V2 tests.

**Non-Goals:**

- Ability rules-**text** rendering (variable interpolation into sentences) —
  that is `add-raid-boss-ability-text`. This change recomputes ability
  _variable values_; it does not render ability descriptions.
- Portrait assets — `add-raid-boss-portraits`.
- Absolute-HP slider (a real HP number rather than a threshold pick) — stays
  deferred; the control steps through the modifier schedule, matching V1.

## Decisions

- **New `entities/raid-boss/lib/modifier-math.ts`**, a direct port of
  `guild-boss-modifiers.ts`'s pure helpers, minus the V1 icon/portrait
  resolution (which belongs to `add-raid-boss-portraits`). Exposed through the
  slice barrel. Rationale: the math is entity-level domain logic reused by the
  detail (a page); it must not live in the page. Alternative — a `features/`
  slice — rejected as premature; no second consumer.
- **Canonical result shape:** `buildAdjustedView(unit, encounter, step, hpLost)`
  returns `{ hpLostPoints: number[], stats: {key, base, adjusted}[],
abilities: {abilityId, variables: {key, base, adjusted}[]}[], enemies:
{ids: string[], removed: {unitSetId, count}[]} }`. The stat block, ability
  panel, and enemy list all derive from this one object — no parallel
  recompute paths (per the design rule).
- **Thresholds rescaled once**, via the ported `scaleModifierHpLost`, against
  the currently displayed total HP for the selected progression step, so moving
  the progression dropdown re-scales the HP-lost control's stops.
- **Desktop vs mobile split (documented per the tutorial/layout rule):**
  - Desktop (`desktop/raid-bosses-desktop-page.tsx`): a panel per fight side —
    for a boss, one per `Crystal` prime; for a prime, a single panel — each
    with a range `<input>`/slider bound to that panel's `hpLost`. Joyride
    target `[data-testid="raid-boss-adjusted-stats"]` on the panel container.
  - Mobile (`mobile/raid-bosses-mobile-page.tsx`): one panel, an HP-lost
    stepper (`− / +` across `hpLostPoints`), and a "show adjusted" toggle that
    swaps the existing stat list cells to `base → adjusted`. Joyride target
    the same `data-testid` on the mobile panel.
  - The HP-lost point is ephemeral exploration state (like the progression
    step): held in the orchestrator, reset when the selected entity changes,
    not URL-backed.
- **i18n:** all new copy in the `library` namespace under `raidBosses.*`
  (`hpLostAt`, `adjustedColumn`, `baseColumn`, `enemyRemoved`, …) and
  `tour.raidBosses.steps.adjustedStats.*`; de/es/fr authored in the same task.

## Risks / Trade-offs

- [Ported math silently diverges from V1 (rounding order, clamp placement)] →
  Port the `guild-boss.service.spec.ts` modifier cases as-is and run them
  against the V2 functions; treat any diff as a port bug.
- [Dual-panel desktop UI competes for width with the existing stat/ability
  grid] → The adjusted-stats view is its own full-width section below the
  Prime Modifiers panel, not a third column; each panel stacks its own stat
  rows.
- [HP-lost control and progression dropdown interact confusingly] → The
  adjusted-stats section header states the total HP it is scaled to; changing
  progression visibly re-labels the control's stops.

## Migration Plan

Additive UI + new pure module. No data migration. Ship independently of the
other two `#122` changes; no ordering constraint between them.

## Open Questions

None that affect the specs or the task breakdown. Whether the desktop slider is
a native `range` input or a shadcn `Slider` is an implementation choice for the
apply phase.
