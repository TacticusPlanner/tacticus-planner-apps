# Spec Delta

## Purpose

Suggests a team for each Quest Event battle from the synced roster: the featured hero pinned, then the strongest units that pass the battle's hard rules and its bonus objectives, with every unit's power taken at the tier's rarity cap.

## ADDED Requirements

### Requirement: Unit power is taken at the tier's rarity cap

For a battle of tier rarity R, a unit's **capped power** SHALL be its `character-combat-power` with its synced state clamped to R's cap:

- progression: at most R's highest progression step (its max stars), and rank at most `maxRankForProgression` of that step; slots applied are kept only when the rank is not lowered;
- active and passive ability levels: at most `abilityCapByRarity[R]`;
- each equipped item's level: at most the maximum level of R's ladder in the served equipment data, with the item's own stats at that level.

A unit below the cap keeps its own state. The **featured hero** SHALL always use R's highest progression, its max rank, abilities at the cap and no items, with health, armour and damage multiplied by 1.2 before the power formula, whether or not the player owns it.

Assumptions:

- The game clamps stars, rank, abilities and items to the cap (confirmed by Severyn); items drop to the cap rarity's maximum item level.
- The featured hero's loaner has no items.

#### Scenario: Ability clamp

- **GIVEN** a unit with active 40 and passive 30 in an Uncommon battle
- **THEN** its capped power uses active 17 and passive 17

#### Scenario: Below the cap

- **GIVEN** a Rare unit in a Legendary battle
- **THEN** its capped power equals its normal power

### Requirement: Eligibility applies the hard rules and the objective filters

A unit SHALL be **eligible** for a battle when it is an owned character (not a MoW), it is not the featured hero, its faction is in the quest's `allowedFactionIds`, and it passes every **active** restriction:

| Objective          | A unit passes when                               |
| ------------------ | ------------------------------------------------ |
| `NotTrait` t       | it does not have trait t                         |
| `NotFaction` f     | its faction is not f                             |
| `NotDamageType` d  | `characterDealsDamageType(unit, d)` is false     |
| `HasRangedAttack`  | it has a ranged weapon                           |
| `MaxHits` n        | none of its weapons has more than n hits         |
| `MinHits` n        | at least one of its weapons has n hits or more   |
| `UseNoSummons`     | it is not in the summoner set                    |
| `DoNoHealOrRepair` | it has neither the Healer nor the Mechanic trait |

A restriction SHALL be **active** unless the featured hero fails it, in which case the objective is **unreachable** and does not filter anyone. `DamageType` and `NoDamageTakenByAnyHero` SHALL NOT filter units.

Assumptions:

- `HasRangedAttack`, `MaxHits` and `MinHits` read the unit's served weapons; `DoNoHealOrRepair` is read from traits. A unit test pins known cases for each.

#### Scenario: No Psyker

- **GIVEN** Nubari battle 11 (`NotTrait` Psyker) and an owned Ultramarines Psyker
- **THEN** that unit is not eligible, and the battle's other allowed units are

#### Scenario: Featured hero breaks a restriction

- **GIVEN** a battle with `NotFaction` Ultramarines in a quest whose featured hero is an Ultramarine
- **THEN** the objective is unreachable and Ultramarines units stay eligible

### Requirement: The team is the featured hero plus the strongest eligible units

The suggested team SHALL be the featured hero followed by the eligible units with the highest capped power, up to `deploySlots` − 1, ties broken by unit id. When the battle has a `DamageType` d objective and neither the featured hero nor any picked unit deals d, the weakest picked unit SHALL be replaced by the strongest eligible unit that deals d, if one exists. Each member SHALL show its portrait, name, capped power and "at cap" or "below cap", and the team SHALL show its total capped power.

#### Scenario: Five slots

- **GIVEN** Nubari battle 17 (Mythic, 5 slots, `NotTrait` Flying) and 10 eligible units
- **THEN** the team is Nubari and the 4 non-Flying eligible units with the highest capped power

#### Scenario: Damage type swap

- **GIVEN** a 3-slot battle with `DamageType` Bolter, a featured hero without Bolter, and the two strongest eligible units without Bolter
- **THEN** the weaker of the two is replaced by the strongest eligible Bolter unit

### Requirement: Objectives show whether the team meets them

Each objective chip in the battle detail SHALL gain a badge: "Met" when the team meets it (every member passes, or for `DamageType` one member deals the type), "Unreachable: {featured hero} {reason}" when the featured hero fails it ("skip for 100 points"), "No eligible unit" for a `DamageType` no one can meet, and "Depends on play" for `NoDamageTakenByAnyHero`. Badges SHALL carry accessible text, not colour alone.

#### Scenario: Unreachable

- **GIVEN** the featured hero has the Flying trait and the battle has `NotTrait` Flying
- **THEN** the chip reads "Unreachable: Nubari has Flying · skip for 100 points"

### Requirement: Short rosters and missing data are explained

With fewer eligible units than `deploySlots` − 1, the team SHALL show the units it has and "Only N eligible units for M slots". When the team has fewer than 3 members, it SHALL also say "A battle needs at least 3 units". When the roster is not synced, the section SHALL show the featured hero only and a sync prompt. When the unit power data is absent or failed, members SHALL show without power and the team SHALL be ordered by rarity, then rank, then id, with the notice "Power unavailable".

#### Scenario: Nobody eligible

- **GIVEN** the player owns no unit of an allowed faction
- **THEN** the team shows Nubari alone, "Only 0 eligible units for 2 slots" and "A battle needs at least 3 units"

### Requirement: Team layout and copy

On desktop the team SHALL sit in the battle detail under the header; on mobile it SHALL be in the bottom sheet under the score inputs. Copy SHALL be localized in en, de, es and fr, and the Quest tour SHALL gain a team step.

#### Scenario: Mobile

- **GIVEN** a 420px viewport
- **WHEN** the player opens battle 4
- **THEN** the team shows in the bottom sheet under the score inputs
