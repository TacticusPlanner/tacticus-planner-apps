## MODIFIED Requirements

### Requirement: The detail view shows field enemies and prime modifiers

For the selected entity at the viewed progression step, the detail view SHALL resolve a representative encounter (exact step match, else the nearest lower step, else any) and show its field enemies, with each `fieldNpcId` resolved to an npc name by fuzzy-matching the `npcs` catalog dataset on the faction abbreviation (falling back to a humanized token). It SHALL then show a modifier section:

- for a **boss**: a **Prime Modifiers** panel listing the primes fought alongside it in that encounter's set (its two `Crystal` encounters), each with its prime name and its modifier list;
- for a **prime**: a **Modifiers** panel listing its own modifiers.

Each modifier row SHALL show its activation threshold (`hpLost`, as a percentage) and its effect: a genuine stat-percent or flat-stat decrease renders with its value (`−15% dmg`, `−1 movement`); every other modifier type — which scales an ability's internal variables by an amount that is only meaningful once the full modifier math is applied — renders as a direction plus target only (`Reduces Massive Scything Talons`). Turning those definitions into concrete adjusted values is covered by the **detail view previews stats adjusted by active modifiers** requirement.

#### Scenario: Prime modifiers for a boss

- **WHEN** a boss is selected and its set has two `Crystal` prime encounters
- **THEN** the Prime Modifiers panel lists each prime by name with its modifiers, ordered by `hpLost`

#### Scenario: Modifier effect rendering

- **WHEN** a modifier is a `bossStatPctDecrease` of `dmg` by 15 and another is a `bossAbilityAllStatsPctDecrease` of `MassiveScythingTalons`
- **THEN** the first renders as `−15% dmg` and the second as `Reduces Massive Scything Talons` (no raw amount)

#### Scenario: Entity with no encounter data

- **WHEN** the selected entity has no season encounter referencing it
- **THEN** the modifier section shows an explicit "no encounter data" state, not an empty gap

## ADDED Requirements

### Requirement: The detail view previews stats adjusted by active modifiers

The detail view SHALL let the user choose an HP-lost point across the resolved encounter's modifier schedule — `0` (full HP) plus each modifier's activation threshold — and SHALL show, for the modifiers active at or below that point:

- the boss's or prime's **stat block** with each affected stat recomputed (percentage and flat `bossStat*Decrease` modifiers summed additively per stat, applied as `round(base × (1 + pct/100) + flat)`, clamped at 0), shown alongside its unadjusted value;
- **ability variables and constants** for each affected ability recomputed by the same additive rule (`bossAbilityAllStatsPctDecrease` applies to every variable of its target ability; per-variable percent and flat modifiers apply to the named variables), clamped at 0;
- the **field-enemy list** with `unitAmountDecrease` removals applied (up to N copies of each targeted unit-set id removed, progression suffix ignored for matching), noting how many of which enemy were removed.

The modifier thresholds SHALL be rescaled to the currently displayed total HP so the schedule stays proportional to the selected progression step and the final threshold lands exactly at 0 HP remaining. When no modifiers are active at the chosen point (including the `0` / full-HP point), the adjusted values SHALL equal the base values. When the entity has no resolved encounter, the adjusted-stats view SHALL NOT render.

#### Scenario: Stats recompute at an HP-lost point

- **WHEN** the user moves the HP-lost control to a point where a `bossStatPctDecrease` of `dmg` by 45 and a `bossStatDecrease` of `movement` by 1 are active
- **THEN** the damage row shows `round(baseDamage × 0.55)` next to the base damage and the movement row shows `base − 1`, and stats with no active modifier are unchanged

#### Scenario: Full-HP point shows base values

- **WHEN** the HP-lost control is at `0` (full HP)
- **THEN** every adjusted value equals its base value

#### Scenario: Enemy removals applied

- **WHEN** a `unitAmountDecrease` modifier targeting a field npc is active and the encounter lists two copies of that npc
- **THEN** the adjusted enemy list shows one copy and a note that one was removed

#### Scenario: Desktop shows both sides, mobile one panel

- **WHEN** the page renders at ≥768px
- **THEN** the adjusted-stats view shows a panel per fight side / prime, each with its own HP-lost slider
- **WHEN** the page renders below 768px
- **THEN** a single panel with an HP-lost stepper is shown, with a toggle that reveals the adjusted values inline in the stat list

### Requirement: The page tour covers the adjusted-stats view

The page's Joyride tour (desktop and mobile step sets) SHALL include a step anchored to the adjusted-stats area, with title/content sourced from `tour.raidBosses.steps.*` i18n keys present in every supported locale.

#### Scenario: Tour includes the adjusted-stats step

- **WHEN** a user runs the page tour on desktop and again on mobile
- **THEN** a step anchored to a present element in the adjusted-stats area runs on each platform with localized copy
