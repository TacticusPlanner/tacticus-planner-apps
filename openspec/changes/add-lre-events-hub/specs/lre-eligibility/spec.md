# Spec Delta

## Purpose

Which units an LRE track allows, which of its restrictions each unit satisfies, how a unit's potential points and slots are computed, and how the track overview and eligibility leaderboard present that, on desktop and mobile.

## ADDED Requirements

### Requirement: A track's allowed units follow its allowed-units filter

A unit SHALL be allowed on a track when it passes every filter in the track's `allowedUnitsFilter`, where a filter `{ kind, target, exclude }` matches a unit as defined in the restriction-matching requirement below, and `exclude: true` inverts the match. The catalog's served `availableUnitIds` for the track SHALL be used when present and equal to this evaluation; a mismatch is a catalog defect surfaced in tests, not in the UI.

#### Scenario: Alliance exclusion

- **GIVEN** Lysander Alpha has `allowedUnitsFilter: [{ kind: "Alliance", target: "Xenos", exclude: true }]`
- **WHEN** allowed units are computed
- **THEN** every Imperial and Chaos character is allowed and no Xenos character is

#### Scenario: Faction exclusion on top of alliance

- **GIVEN** Farsight Gamma excludes alliance Chaos and faction Orks
- **WHEN** allowed units are computed
- **THEN** Imperial characters and non-Ork Xenos characters are allowed; Chaos and Ork characters are not

### Requirement: Restriction matching per filter kind

A unit SHALL satisfy a restriction when its filter matches, per `kind`:

| kind | matches when |
| --- | --- |
| `Alliance` | the unit's alliance equals `target` |
| `Faction` | the unit's faction equals `target` |
| `Trait` | the unit's catalog `traits` contains `target` |
| `DamageType` | the unit's dealt damage types contain `target`, where dealt damage types are the melee type, the ranged type when present, and the active and passive ability damage types, minus the unit's damage-profile exclusions |
| `MinHits` | the unit's hits are at least `target`, where hits are `rangedHits` when the unit has a ranged attack, else `meleeHits` |
| `MaxHits` | the unit's hits are at most `target`, same hits definition |
| `AttackType` with `target: "Ranged"` | the unit has a ranged attack (`rangedHits` is not null) |

`exclude: true` inverts the match. An unknown `kind` SHALL match no unit and SHALL be reported by a unit test over the real catalog, so a new game objective kind fails loudly in CI rather than silently emptying a restriction.

Damage-profile exclusions: ability damage types that describe damage a unit reduces or reacts to, not damage it deals. Ported from V1: `votanChampion` excludes `Psychic` and direct damage (`Direct` / `DirectDamage`); `thousSekhetar` excludes `Psychic`.

#### Scenario: Damage type via melee weapon

- **GIVEN** `votanChampion` has `meleeDamage: "Eviscerate"`, `rangedDamage: "Bolter"`, `activeAbilityDamage: ["DirectDamage", "Physical"]`
- **WHEN** evaluated against Lysander Alpha's `Eviscerate` restriction (`DamageType`, `Eviscerate`, include)
- **THEN** the unit satisfies it

#### Scenario: Damage-profile exclusion removes a false positive

- **GIVEN** the same unit and a restriction `{ kind: "DamageType", target: "DirectDamage", exclude: false }`
- **WHEN** evaluated
- **THEN** the unit does not satisfy it, because `DirectDamage` is in `votanChampion`'s exclusion list

#### Scenario: Excluded trait

- **GIVEN** `astarLysander` has traits `TeleportStrike, TerminatorArmour, Resilient, CrushingStrike`
- **WHEN** evaluated against `No Resilient` (`Trait`, `Resilient`, exclude)
- **THEN** the unit does not satisfy it; `bloodDante` (traits without `Resilient`) does

#### Scenario: Hits use the ranged value when a ranged attack exists

- **GIVEN** `votanChampion` has `meleeHits 2`, `rangedHits 2`, and `bloodDante` has `meleeHits 4`, `rangedHits null`
- **WHEN** evaluated against `Min 5 Hits` (`MinHits`, `5`) and `Max 2 Hits` (`MaxHits`, `2`)
- **THEN** `votanChampion` satisfies Max 2 Hits and not Min 5 Hits; `bloodDante` satisfies neither

#### Scenario: Melee-only restriction

- **GIVEN** a restriction `{ kind: "AttackType", target: "Ranged", exclude: true }` (labelled Melee)
- **WHEN** evaluated against `bloodDante` (no ranged attack) and `votanChampion` (ranged attack)
- **THEN** Dante satisfies it and the Champion does not

#### Scenario: Unknown kind fails loudly

- **GIVEN** a restriction with `kind: "NoSummons"`
- **WHEN** the catalog-wide matching test runs
- **THEN** the test fails naming the unsupported kind, and at runtime the restriction matches no unit

### Requirement: Unit potential points and slots per track

For an allowed unit on a track, potential points per battle SHALL equal the track's `killPoints` plus the `points` of every restriction the unit satisfies; slots SHALL equal the number of restrictions it satisfies. A unit not allowed on the track has 0 points and 0 slots. Points shown together across tracks are all "points per battle" and SHALL be labelled as such.

Assumptions:

- `killPoints` is awarded once per battle to any team that clears it, independent of restrictions.
- Restriction `points` are per battle and constant across the track's battles.

#### Scenario: Worked example on Lysander Alpha

- **GIVEN** Lysander Alpha has `killPoints 32` and restrictions Eviscerate 75, Suppressive Fire 95, Flying 80, Min 5 Hits 85, No Resilient 40, and `bloodDante` (Imperial, traits include Flying, no Resilient, melee Piercing 4 hits, ability damage Melta) is allowed
- **WHEN** potential is computed
- **THEN** Dante satisfies Flying and No Resilient only, so slots = 2 and points per battle = 32 + 80 + 40 = 152

#### Scenario: Not allowed unit

- **GIVEN** a Xenos character on Lysander Alpha (alliance Xenos excluded)
- **WHEN** potential is computed
- **THEN** points = 0, slots = 0 and the unit is absent from the leaderboard

### Requirement: Restriction labels are localized from the filter

A restriction's display label SHALL be built from its filter, not from the catalog's English `name`: `Trait` → the `traits` namespace entry for `target`; `DamageType` → the `damageTypes` entry; `Faction` → the `factions` entry; `Alliance` → the `alliances` entry; `MinHits` / `MaxHits` → the `lre` namespace templates "Min {{n}} hits" / "Max {{n}} hits"; `AttackType` → "Ranged", and with `exclude` "Melee". Any other `exclude: true` label is the `lre` template "No {{label}}". When a namespace has no entry for the target the catalog `name` is the fallback. Each restriction SHALL carry an icon: the trait icon, damage-type icon or faction icon for those kinds; a hits glyph for Min/Max hits; a ranged or melee glyph for attack type.

#### Scenario: Trait label in German

- **GIVEN** the UI language is `de` and `traits:Resilient` is "Widerstandsfähig"
- **WHEN** the `No Resilient` restriction label renders
- **THEN** it reads the German "No {{label}}" template applied to "Widerstandsfähig", with the Resilient trait icon

#### Scenario: Hits label

- **WHEN** the `{ kind: "MinHits", target: "5" }` restriction label renders in English
- **THEN** it reads "Min 5 hits"

#### Scenario: Fallback to catalog name

- **GIVEN** a `DamageType` target with no `damageTypes` entry
- **WHEN** the label renders
- **THEN** the catalog `name` is shown

### Requirement: Track overview section

For each track the Track overview SHALL show the track's name (its localized Alpha / Beta / Gamma label and the allowed-alliance rule derived from `allowedUnitsFilter`, for example "Alpha · No Xenos"), kill points per battle, the five restrictions as chips with icon, label and points, the count of battles, and a collapsed "how points work" disclosure explaining kill points, restriction points, defeat-all and high-score points in one paragraph.

#### Scenario: Track card content

- **WHEN** Lysander's Track overview renders
- **THEN** the Alpha card shows "Alpha · No Xenos", "32 kill points per battle", five chips (Eviscerate 75, Suppressive Fire 95, Flying 80, Min 5 hits 85, No Resilient 40), "18 battles" and the collapsed disclosure

### Requirement: Eligibility leaderboard section

For each track the leaderboard SHALL list every allowed character from the catalog with: portrait and localized name; owned state (present in the synced `characters` chunk) with the owned unit's rarity and rank, or a "locked" marker; one indicator per restriction (satisfied or not, in the track's restriction order); potential points per battle; slots. Default order is points per battle descending, then slots descending, then localized name ascending. The user SHALL be able to sort by points, slots or name, and to toggle "Only unlocked" (default off). Sort and filter state are shared by the three tracks, persist while on the page, and reset when leaving it. A track with no allowed units SHALL show an explicit "no eligible units" body. When the roster chunk is unavailable every unit SHALL render as unknown ownership (no locked marker, no rarity or rank) with an inline "roster not synced" note, and "Only unlocked" is disabled.

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
- **THEN** rows with the locked marker are removed from all three tracks, and the toggle stays on while switching tracks or sections until the user leaves the page

#### Scenario: Roster unavailable

- **GIVEN** the `characters` chunk read failed
- **WHEN** the leaderboard renders
- **THEN** rows show no ownership, rarity or rank, the "roster not synced" note is shown and "Only unlocked" is disabled

#### Scenario: Desktop leaderboard

- **WHEN** the leaderboard renders at or above 768px
- **THEN** each track is a table with sortable column headers (unit, rarity, rank, one column per restriction, points, slots) and the three tracks sit side by side or stack in two columns depending on width, never with horizontal page scroll

#### Scenario: Mobile leaderboard

- **WHEN** the leaderboard renders below 768px for the selected track
- **THEN** each unit is a row card: portrait, name, rarity and rank badges, a row of five restriction indicators, and points and slots; sort and filter controls sit in one compact bar above the list
