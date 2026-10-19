## MODIFIED Requirements

### Requirement: MoW ability panels

The Details tab SHALL show a **Primary** and a **Secondary** ability panel, behaving as the character unit
page's ability panels: icon, kind and localized name, a level stepper from 1 to the highest MoW ability
level the catalog's upgrade costs reach (60 today), rules text at that level, a next-level line with
"· Yours: level <n>" for an owned MoW, and growth charts. When the game text has no complete rules text for
the ability, the panel SHALL show icon, kind, name, the player's level when owned, and the note "Rules text
isn't in the planner yet.", with no stepper, no next-level line and no chart. The Details tab SHALL NOT show
stats, a comparison radar, stats by rank, a relic or mythic quests.

Assumptions:

- All 22 MoW primary and secondary abilities have rules text (see the `ability-rules-text` capability).
- Primary and secondary values marked rarity-affected are scaled by the shown rarity, as on character pages
  and in V1.

#### Scenario: Rules text arrives

- **GIVEN** the game text has complete rules text for all 22 MoW abilities
- **WHEN** a visitor opens Galatian's Details tab
- **THEN** the Primary panel "Duty Eternal" and the Secondary panel "Macro Plasma Incinerator" each show a
  stepper, rules text at the stepper's level, a next-level line and a growth chart, and neither shows the
  missing-text note

#### Scenario: Cooldown and munition cost resolve

- **WHEN** a visitor opens the Reanimator's Details tab
- **THEN** the Primary panel "Reanimation Beam" reads "Initial cooldown: 1 round" and "Cost: 1 munition" from
  the ability's constants (keyed `"initialCooldownTurns "` and `"munitionsCost "` in V1, with a trailing
  space), not raw tokens

#### Scenario: No MoW rules text in the data

- **GIVEN** the game text has no complete rules text for a MoW ability
- **WHEN** a visitor opens that MoW's Details tab
- **THEN** that panel shows its icon, kind and name with the missing-text note and no stepper, next-level line
  or chart

### Requirement: MoW Mythic ability panel

The Details tab SHALL show a third panel, **Mythic**, after Primary and Secondary. Its level SHALL follow the
blue stars of the values shown, with no stepper: 1 blue star is level 1, 2 blue stars level 2, 3 blue stars
level 3 and Mythic Wings level 4. Below Mythic rarity the level SHALL be 1 and the panel SHALL show "Unlocks at
Mythic" in place of the level. When the catalog names the MoW's mythic ability (`mythicAbility.name` on the
`mows` record), the panel SHALL show its localized name and resolve its rules text like the other panels,
without a stepper and **without rarity scaling** (values are shown as the game table lists them for the level);
otherwise it SHALL be titled "Mythic ability" and show the missing-text note. When the catalog names the
ability but the game text has no rules text for it, the panel SHALL show the ability's name with the
missing-text note. On mobile it SHALL be a third collapsible section, collapsed, whose header shows the level
("Lv 2") or "Unlocks at Mythic".

Assumptions:

- The catalog names one mythic ability per MoW (all 11), served by the companion API change.
- The mythic level comes from blue stars, as in V1's unit details page.
- V1 renders the mythic ability with scaling disabled (`disableScaling`), although its table marks
  `dmgReductionPct` as rarity-affected; at Mythic the rarity factor would double the value.

#### Scenario: Mythic MoW

- **GIVEN** a Galatian shown at Mythic, 2 blue stars, and Wisdom of the Ancients' `dmgReductionPct` table
  10, 13, 16, 20 for levels 1–4
- **WHEN** a visitor opens its Details tab
- **THEN** the Mythic panel is titled "Wisdom of the Ancients", shows level 2 from blue stars, and its rules
  text reads "-13% Damage" (level 2 value, rarity factor not applied; with the Mythic factor 2 it would read
  -26%), and has no stepper

#### Scenario: Below Mythic

- **GIVEN** a Galatian shown at Legendary
- **WHEN** a visitor opens its Details tab
- **THEN** the Mythic panel shows "Unlocks at Mythic" and no level

#### Scenario: Custom changes the mythic level

- **GIVEN** the Mythic panel at level 2
- **WHEN** the user selects Custom and picks Mythic Wings
- **THEN** the Mythic panel shows level 4 and its rules text reads "-20% Damage"

#### Scenario: The catalog names the mythic ability

- **GIVEN** the catalog gives Galatian the mythic ability WisdomOfTheAncients
- **WHEN** a visitor opens its Details tab
- **THEN** the Mythic panel is titled "Wisdom of the Ancients"

#### Scenario: The catalog does not name the mythic ability

- **GIVEN** a client whose synced `mows` record for Galatian has no `mythicAbility`
- **WHEN** a visitor opens its Details tab at Mythic
- **THEN** the Mythic panel reads "Mythic ability" with the missing-text note and no stepper

### Requirement: Power on the MoW unit page

The MoW unit page SHALL show the Machine of War's **power** (see `unit-power`, "Machine of War power"), labelled "Power", in the page header's values area. It is computed at the shown rarity and stars (Your unit, Starting or Custom) and at the levels set on the Primary and Secondary ability panels. It SHALL update as soon as any of those changes and SHALL NOT be stored or put in the URL. While the `unit-power` dataset is loading it SHALL show a placeholder. When the dataset is absent, failed to load or has no entry for the MoW, the header SHALL NOT show power at all, and the rest of the page SHALL be unaffected. Desktop and mobile show the same value in the header.

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
- **THEN** the header has no Power figure, and the ability panels and Ability upgrades tab work as usual
