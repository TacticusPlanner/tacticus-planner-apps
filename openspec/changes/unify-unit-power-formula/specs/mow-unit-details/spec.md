## ADDED Requirements

### Requirement: Power on the MoW unit page

The MoW unit page SHALL show the Machine of War's **power** (see `unit-power`, "Machine of War power"), labelled "Power", in the page header's values area. It is computed at the shown rarity and stars (Your unit, Starting or Custom) and at the levels set on the Primary and Secondary ability panels. It SHALL update as soon as any of those changes and SHALL NOT be stored or put in the URL. While the `unit-power` dataset is loading it SHALL show a placeholder. When the dataset failed to load or has no entry for the MoW, it SHALL show "—" with the text "Power data unavailable", and the rest of the page SHALL be unaffected. Desktop and mobile show the same value in the header.

#### Scenario: Maxed MoW

- **GIVEN** a synced player whose Biovore is Mythic with mythic wings (progression index 19), primary 60, secondary 60
- **WHEN** they open Biovore's unit page
- **THEN** the header shows "Power 1,040,687"

#### Scenario: Custom stars change power

- **GIVEN** that page
- **WHEN** the user selects Custom and picks Mythic, 1 blue star (progression index 16: `abilityPowerMultiplier` 26, `mythicAbilityPower` 75,000)
- **THEN** power drops to round(10 + (17,781 + 12,932) × 26 + 75,000) = 873,548, and the ability levels are unchanged

#### Scenario: Power data unavailable

- **GIVEN** the `unit-power` dataset failed to load
- **WHEN** a MoW page renders
- **THEN** the power shows "—" and "Power data unavailable", and the ability panels and Ability upgrades tab work as usual
