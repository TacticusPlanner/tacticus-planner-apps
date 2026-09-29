## MODIFIED Requirements

### Requirement: The detail view shows progression-stepped stats

The detail view SHALL provide a control to choose a progression step across the entity's `statProgression`, and SHALL display for the chosen step: health, damage, fixed armor, rank, star level, base rarity, and ability level, plus block chance/damage and crit chance/damage when the data carries them. Faction and movement SHALL be shown. Changing the step SHALL update the stat block without navigation.

Each option in the step control SHALL be labelled with the step's in-game rarity tier name — the step's base rarity followed by its 1-based position among the steps that share that base rarity (e.g. `Legendary 2` for the second Legendary step) — and with that step's total health, so a reader can identify and compare steps without selecting each one. A step count MAY also be shown; the rarity tier name and health SHALL be present.

#### Scenario: Stat block reflects the selected step

- **WHEN** the user picks a later progression step
- **THEN** the displayed health/damage/armor and other stats update to that step's values

#### Scenario: Optional stats appear only when present

- **WHEN** a step has no crit or block values in the data
- **THEN** those rows are omitted rather than shown as zero or blank

#### Scenario: Step options are labelled by rarity tier and health

- **WHEN** the step control lists an entity's progression steps and several steps share the base rarity Legendary
- **THEN** those options read `Legendary 1`, `Legendary 2`, … in rarity order, and each option also shows its step's total health

### Requirement: The detail view previews stats adjusted by active modifiers

The detail view SHALL let the user choose an HP-lost point across the resolved encounter's modifier schedule — `0` (full HP) plus each modifier's activation threshold — with each point labelled as a percentage of the unit's HP lost, using the same framing as the Prime Modifiers panel's threshold labels (`0` shown as a full-HP label, the rest as `… % HP lost`). It SHALL show, for the modifiers active at or below the chosen point:

- the boss's or prime's **stat block** listing the full stat set — health, damage, fixed armor, movement, and the crit/block stats when the step carries them — with each row showing its unadjusted value and its recomputed value side by side, whether or not a modifier changes that row. Affected stats are recomputed by summing percentage and flat `bossStat*Decrease` modifiers additively per stat, applied as `round(base × (1 + pct/100) + flat)`, clamped at 0; a stat with no active modifier has an adjusted value equal to its base;
- **ability variables and constants** for each affected ability recomputed by the same additive rule (`bossAbilityAllStatsPctDecrease` applies to every variable of its target ability; per-variable percent and flat modifiers apply to the named variables), clamped at 0;
- the **field-enemy list** with `unitAmountDecrease` removals applied (up to N copies of each targeted unit-set id removed, progression suffix ignored for matching), noting how many of which enemy were removed.

The modifier thresholds SHALL be rescaled to the currently displayed total HP so the schedule stays proportional to the selected progression step and the final threshold lands exactly at 0 HP remaining. When no modifiers are active at the chosen point (including the `0` / full-HP point), the adjusted values SHALL equal the base values. When the entity has no resolved encounter, the adjusted-stats view SHALL NOT render.

#### Scenario: Stats recompute at an HP-lost point

- **WHEN** the user moves the HP-lost control to a point where a `bossStatPctDecrease` of `dmg` by 45 and a `bossStatDecrease` of `movement` by 1 are active
- **THEN** the damage row shows `round(baseDamage × 0.55)` next to the base damage, the movement row shows `base − 1`, and every other stat row (health, armor, …) still renders with its adjusted value equal to its base

#### Scenario: Full-HP point shows base values

- **WHEN** the HP-lost control is at `0` (full HP)
- **THEN** every adjusted value equals its base value

#### Scenario: HP-lost points labelled consistently with the panel

- **WHEN** the Prime Modifiers panel lists a prime's thresholds as `At 13% HP lost … At 100% HP lost` and the user opens that prime's HP-lost control in the adjusted-stats view
- **THEN** the control's points read with the same percentage framing (a full-HP label plus `13% … 100% HP lost`), not an absolute HP amount

#### Scenario: Enemy removals applied

- **WHEN** a `unitAmountDecrease` modifier targeting a field npc is active and the encounter lists two copies of that npc
- **THEN** the adjusted enemy list shows one copy and a note that one was removed

#### Scenario: Desktop shows both sides, mobile one panel

- **WHEN** the page renders at ≥768px
- **THEN** the adjusted-stats view shows a panel per fight side / prime, each with its own HP-lost slider
- **WHEN** the page renders below 768px
- **THEN** a single panel with an HP-lost stepper is shown, with a toggle that reveals the adjusted values inline in the stat list
