## MODIFIED Requirements

### Requirement: Picker tiles show remaining points

Each picker tile's points figure SHALL be the unit's **remaining points** on the lane as the eligibility leaderboard defines them (`legendary-event-eligibility`), from the synced progress, read as "N pts left", with a tooltip saying it covers the whole lane, all battles (unlike a card's points left, which stops at its depth). Goals Preview never changes it.

Assumptions:

- Defeat-all stands in for the unit's kill points, as on the leaderboard.
- Without synced progress nothing is cleared.

#### Scenario: Worked example on Lysander Alpha

- **GIVEN** Lysander Alpha (18 battles, `killPoints` 32, Flying 80, No Resilient 40) with synced progress where battles 1–13 have defeat-all and No Resilient cleared and Flying open, and battles 14–18 are untouched
- **AND** Dante satisfies Flying and No Resilient
- **WHEN** the picker renders
- **THEN** battles 1–13 each add 80 (Flying only) = 1,040 and battles 14–18 each add 32 + 80 + 40 = 152, so 760; Dante's tile reads "1,800 pts left"

#### Scenario: Unit with nothing left

- **GIVEN** a unit satisfying only No Resilient and progress where defeat-all and No Resilient are cleared in every battle
- **WHEN** the picker renders
- **THEN** its tile reads "0 pts left" and sorts after units with points left under the default sort
