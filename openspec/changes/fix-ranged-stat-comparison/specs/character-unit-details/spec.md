## MODIFIED Requirements

### Requirement: Compared with other characters

The Details tab SHALL show a stat comparison based on V1's: a six-axis radar and a percentile list with
the same values. The axes, clockwise from the top, SHALL be Health; Armour; Melee damage vs infinite
armour; Melee damage vs 0 armour; Ranged damage vs infinite armour; Ranged damage vs 0 armour. Every
character, including the shown one, SHALL be evaluated at one fixed reference, Mythic Wings and
Adamantine II, whatever values the page shows. The radar SHALL also draw the 50% outline. The card SHALL
link to the Tacticus wiki's damage explanation ("How damage works", opening in a new tab), which
describes the pierce ratio minimum behind the "vs infinite armour" axes.

For each axis, the percentile SHALL be the share of the compared characters whose value at the
reference is strictly lower than this character's, × 100, shown rounded to a whole percent. The compared
characters, including the shown one, SHALL be all catalog characters on the Health, Armour and melee
axes, and only the catalog characters with a ranged attack on both ranged axes.

A character without a ranged attack SHALL show "No ranged attack" instead of a percentage on both ranged
axes, in the list and in the radar's text alternative; its radar points on those axes sit at the centre.

Each ranged axis in the list SHALL have an info tooltip saying that only characters with a ranged attack
are compared. It SHALL be available for every character, and open on hover, keyboard focus and tap.

Assumptions:

- Damage vs 0 armour = damage × hits; damage vs infinite armour = damage × hits × the attack's pierce
  ratio (the Tacticus wiki's per-damage-type table, which corrects V1 for Chain and Plasma; an
  unknown type counts as 0).
- A character with a ranged attack of an unknown damage type is still compared on both ranged axes.
- Ties do not count as lower. Damage values that are equal at two decimals are ties.
- Reference stats use V1's formula and rounding: round(base × (1.252^17 + 5 × 2) × (1 + 0.1 × 14)),
  i.e. base × 133.5178 rounded; damage is rounded before multiplying by hits. With V2's own stat
  formula a few close values order differently, so V1's is kept and, for the same character data, the
  Health, Armour and melee percentiles equal V1's (apart from characters whose ratios the wiki
  corrects, and ties V1 splits through floating-point error). The ranged percentiles differ from V1,
  which counts characters without a ranged attack as 0.

#### Scenario: Worked example — Tigurius's Health percentile

- **GIVEN** 119 catalog characters, and Tigurius's base Health 65
- **WHEN** the comparison is computed
- **THEN** Tigurius's Health at the reference is round(65 × 133.5178) = round(8,678.66) = 8,679,
  6 characters have a lower reference Health, so the percentile is 6 / 119 × 100 =
  5.04, shown as **5%** in the percentile list

#### Scenario: Worked example — Daras's ranged percentiles

- **GIVEN** 120 catalog characters of which 59 have a ranged attack, and Daras with base Damage 31 and
  a ranged attack of 1 Bolter hit (20% pierce)
- **WHEN** the comparison is computed
- **THEN** the damage at the reference is round(31 × 133.5178) = round(4,139.05) = 4,139
- **AND** ranged damage vs infinite armour is 4,139 × 1 × 0.2 = 827.8; 2 of the 59 are lower, so the
  percentile is 2 / 59 × 100 = 3.39, shown as **3%**
- **AND** ranged damage vs 0 armour is 4,139 × 1 = 4,139; 14 of the 59 are lower, so the percentile is
  14 / 59 × 100 = 23.73, shown as **24%**

#### Scenario: Worked example — equal damage values tie

- **GIVEN** Celestine (base Damage 25, melee 3 Power hits, 40% pierce) and Anuphet (base Damage 25,
  melee 4 Energy hits, 30% pierce)
- **WHEN** their melee damage vs infinite armour is compared
- **THEN** the damage at the reference is round(25 × 133.5178) = 3,338 for both, and the values
  3,338 × 3 × 0.4 and 3,338 × 4 × 0.3 are both 4,005.6
- **AND** neither counts as lower than the other; with 120 catalog characters 78 are lower, so both
  percentiles are 78 / 120 × 100 = 65.00, shown as **65%**

#### Scenario: Link to the wiki's damage explanation

- **WHEN** a visitor opens a character's Details tab
- **THEN** the comparison card shows "How damage works (Tacticus wiki)", linking to
  https://tacticus.wiki.gg/wiki/HDTW_Damage in a new tab

#### Scenario: Melee-only character

- **WHEN** a character has no ranged attack
- **THEN** both ranged axes show "No ranged attack" and no percentage
- **AND** the radar's text alternative says the same for both axes

#### Scenario: Weakest shooter

- **WHEN** a character has a ranged attack and no other character with one has a lower value on a ranged axis
- **THEN** that axis shows 0%

#### Scenario: Ranged comparison tooltip

- **WHEN** the visitor hovers, focuses or taps the info button of a ranged axis
- **THEN** a tooltip says "Compared only with characters that have a ranged attack."
- **AND** the Health, Armour and melee axes have no such button

#### Scenario: Radar is independent of the shown values

- **WHEN** the user changes Custom values
- **THEN** the radar and percentile list do not change
