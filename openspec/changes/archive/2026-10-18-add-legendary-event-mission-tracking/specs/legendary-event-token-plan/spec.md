# Spec Delta

## ADDED Requirements

### Requirement: Next token card shows missions it progresses and a For missions alternative

When the Next token card shows a token, it SHALL add a **Progresses** line naming the open missions of the current run (`legendary-event-missions`) the token progresses, excluding `anyBattle` missions, or nothing when it progresses none. When another planned token that meets the Next token's eligibility (not flagged Maybe, playable now, no earlier planned token on its battle) progresses more such open missions, the card SHALL show it under **For missions** with its lane, battle, team, "+P points (−D)" against the Next token and the missions it progresses; among several, the one progressing the most wins, then the higher points, then the earlier plan position. The For missions entry SHALL carry the same Partly cleared and Couldn't clear actions. The plan order SHALL NOT change.

#### Scenario: Alternative shown

- **GIVEN** the Next token is Melee → Alpha battle 3 (+240), progressing no open mission, and Melee → Beta battle 4 is playable and planned at +210, progressing "Defeat 75 AdMechs" and "Win 5 battles without deploying any Big Target characters"
- **WHEN** the card renders
- **THEN** it shows Melee → Alpha battle 3 as the next token and, under For missions, "Beta · Battle 4 · +210 points (−30)" with both missions

#### Scenario: Next token already best for missions

- **GIVEN** the Next token progresses two open missions and no other eligible token progresses more
- **WHEN** the card renders
- **THEN** it shows a Progresses line with the two missions and no For missions entry

#### Scenario: No open missions

- **GIVEN** every mission of the current run is ticked Done
- **WHEN** the card renders
- **THEN** it shows no Progresses line and no For missions entry
