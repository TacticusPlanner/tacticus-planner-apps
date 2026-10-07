# legendary-event-eligibility Specification

## Purpose
Which units a Legendary Event lane allows, which of its objectives each unit satisfies, how a unit's potential points and slots are computed, and how the eligibility leaderboard presents that on the event page, on desktop and mobile.

## Requirements

### Requirement: A lane's allowed units follow its allowed-units filter

A unit SHALL be allowed on a lane when it passes every filter in the lane's `allowedUnitsFilter`, where a filter `{ kind, target, exclude }` matches a unit as defined in the objective-matching requirement below and `exclude: true` inverts the match. The catalog's served `availableUnitIds` SHALL equal this evaluation; a mismatch is a catalog defect surfaced by a test, not in the UI.

#### Scenario: Alliance exclusion

- **GIVEN** Lysander Alpha has `allowedUnitsFilter: [{ kind: "Alliance", target: "Xenos", exclude: true }]`
- **WHEN** allowed units are computed
- **THEN** every Imperial and Chaos character is allowed and no Xenos character is

#### Scenario: Faction exclusion on top of alliance

- **GIVEN** Farsight Gamma excludes alliance Chaos and faction Orks
- **WHEN** allowed units are computed
- **THEN** Imperial characters and non-Ork Xenos characters are allowed; Chaos and Ork characters are not

### Requirement: Objective matching per filter kind

A unit SHALL satisfy an objective when its filter matches, per `kind`:

| kind | matches when |
| --- | --- |
| `Alliance` | the unit's alliance equals `target` |
| `Faction` | the unit's faction equals `target` |
| `Trait` | the unit's catalog `traits` contains `target` |
| `DamageType` | the unit's dealt damage types contain `target`: melee type, ranged type when present, active and passive ability damage types, minus the unit's damage-profile exclusions |
| `MinHits` | the unit's hits are at least `target`, where hits are `rangedHits` when the unit has a ranged attack, else `meleeHits` |
| `MaxHits` | the unit's hits are at most `target`, same hits definition |
| `AttackType` with `target: "Ranged"` | the unit has a ranged attack (`rangedHits` is not null) |

`exclude: true` inverts the match. An unknown `kind` SHALL match no unit and SHALL be reported by a test over the real catalog, so a new game objective kind fails CI rather than silently emptying an objective.

Damage-profile exclusions (ability damage a unit reduces or reacts to, not damage it deals), ported from V1: `votanChampion` excludes `Psychic` and direct damage (`Direct` / `DirectDamage`); `thousSekhetar` excludes `Psychic`.

#### Scenario: Damage type via melee weapon

- **GIVEN** `votanChampion` has `meleeDamage: "Eviscerate"`, `rangedDamage: "Bolter"`, `activeAbilityDamage: ["DirectDamage", "Physical"]`
- **WHEN** evaluated against Lysander Alpha's Eviscerate objective (`DamageType`, `Eviscerate`, include)
- **THEN** the unit satisfies it

#### Scenario: Damage-profile exclusion removes a false positive

- **GIVEN** the same unit and an objective `{ kind: "DamageType", target: "DirectDamage", exclude: false }`
- **WHEN** evaluated
- **THEN** the unit does not satisfy it

#### Scenario: Excluded trait

- **GIVEN** `astarLysander` has traits `TeleportStrike, TerminatorArmour, Resilient, CrushingStrike`
- **WHEN** evaluated against No Resilient (`Trait`, `Resilient`, exclude)
- **THEN** the unit does not satisfy it; `bloodDante` (no `Resilient`) does

#### Scenario: Hits use the ranged value when a ranged attack exists

- **GIVEN** `votanChampion` has `meleeHits 2`, `rangedHits 2`, and `bloodDante` has `meleeHits 4`, `rangedHits null`
- **WHEN** evaluated against Min 5 hits (`MinHits`, `5`) and Max 2 hits (`MaxHits`, `2`)
- **THEN** `votanChampion` satisfies Max 2 hits and not Min 5 hits; `bloodDante` satisfies neither

#### Scenario: Melee-only objective

- **GIVEN** an objective `{ kind: "AttackType", target: "Ranged", exclude: true }` (labelled Melee)
- **WHEN** evaluated against `bloodDante` (no ranged attack) and `votanChampion` (ranged attack)
- **THEN** Dante satisfies it and the Champion does not

#### Scenario: Unknown kind fails loudly

- **GIVEN** an objective with `kind: "NoSummons"`
- **WHEN** the catalog-wide matching test runs
- **THEN** the test fails naming the unsupported kind, and at runtime the objective matches no unit

### Requirement: Unit potential points and slots per lane

For an allowed unit on a lane, potential points per battle SHALL equal the lane's `killPoints` plus the `score` of every objective the unit satisfies; slots SHALL equal the number of objectives it satisfies. A unit not allowed on the lane has 0 points and 0 slots. Points compared across lanes are all "points per battle" and SHALL be labelled as such.

Assumptions:

- `killPoints` is awarded once per battle to any team that clears it, independent of objectives.
- An objective's `score` is per battle and constant across the lane's battles.

#### Scenario: Worked example on Lysander Alpha

- **GIVEN** Lysander Alpha has `killPoints 32` and objectives Eviscerate 75, Suppressive Fire 95, Flying 80, Min 5 hits 85, No Resilient 40, and `bloodDante` (Imperial, traits include Flying, no Resilient, melee Piercing 4 hits, ability damage Melta) is allowed
- **WHEN** potential is computed
- **THEN** Dante satisfies Flying and No Resilient only, so slots = 2 and points per battle = 32 + 80 + 40 = 152

#### Scenario: Not allowed unit

- **GIVEN** a Xenos character on Lysander Alpha
- **WHEN** potential is computed
- **THEN** points = 0, slots = 0 and the unit is absent from the leaderboard

### Requirement: Eligibility leaderboard section on the event page

The event page SHALL render an Eligibility leaderboard section after Lane overview, lane-scoped (three lanes on desktop, the selected lane on mobile). Per lane it SHALL list every allowed character with: portrait and localized name; owned state (present in the synced `characters` chunk) with the owned unit's rarity and rank, or a "locked" marker; one indicator per objective (satisfied or not, in the lane's objective order, with accessible text); potential points per battle; slots. Default order is points descending, then slots descending, then name ascending. The user SHALL be able to sort by points, slots or name and to toggle "Only unlocked" (default off). Sort and filter state are shared by the three lanes, persist while on the page and reset on leaving it. A lane with no allowed units SHALL show a "no eligible units" body. When the roster chunk is unavailable every unit SHALL render with unknown ownership (no locked marker, rarity or rank), an inline "roster not synced" note, and "Only unlocked" disabled.

#### Scenario: Default order

- **GIVEN** on Lysander Alpha, unit A has 152 points and 2 slots, unit B has 152 points and 3 slots, unit C has 207 points and 2 slots
- **WHEN** the leaderboard renders with default sort
- **THEN** the order is C, B, A

#### Scenario: Owned versus locked

- **GIVEN** the synced `characters` chunk contains `bloodDante` at rank Diamond1, progression Legendary 5 stars, and does not contain `astarLysander`
- **WHEN** the leaderboard renders
- **THEN** Dante's row shows Legendary rarity and the Diamond I rank badge, and Lysander's row shows the locked marker without rarity or rank

#### Scenario: Only unlocked

- **WHEN** the user enables "Only unlocked"
- **THEN** rows with the locked marker are removed from all three lanes, and the toggle stays on while switching lanes until the user leaves the page

#### Scenario: Roster unavailable

- **GIVEN** the `characters` chunk read failed
- **WHEN** the leaderboard renders
- **THEN** rows show no ownership, rarity or rank, the "roster not synced" note is shown and "Only unlocked" is disabled

#### Scenario: Desktop leaderboard

- **WHEN** the leaderboard renders at or above 768px
- **THEN** each lane is a table with sortable column headers (unit, rarity, rank, one column per objective, points, slots), the three lanes side by side or in two columns depending on width, never with horizontal page scroll

#### Scenario: Mobile leaderboard

- **WHEN** the leaderboard renders below 768px for the selected lane
- **THEN** each unit is a row card: portrait, name, rarity and rank badges, a row of five objective indicators, points and slots; sort and filter controls sit in one compact bar above the list

#### Scenario: Tour step

- **WHEN** the event page tour runs on either form
- **THEN** a step highlights the leaderboard after the Lane overview step
