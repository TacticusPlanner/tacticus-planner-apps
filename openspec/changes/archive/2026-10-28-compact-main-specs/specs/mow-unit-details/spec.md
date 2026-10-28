## MODIFIED Requirements

### Requirement: MoW ability panels

The Details tab SHALL show a **Primary** and a **Secondary** ability panel, behaving as the character unit
page's ability panels: icon, kind and localized name, a level stepper from 1 to the highest MoW ability
level the catalog's upgrade costs reach (60 today), rules text at that level, a next-level line with
"· Yours: level <n>" for an owned MoW, and growth charts. A panel without complete rules text SHALL show the character unit page's missing-text state. The Details tab SHALL NOT show
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
