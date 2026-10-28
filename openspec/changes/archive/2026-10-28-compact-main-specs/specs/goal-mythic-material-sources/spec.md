## MODIFIED Requirements

### Requirement: Every available offer is selected by default

A goal with no saved Mythic-material selection SHALL use every offer the control currently lists
for each needed material, and the control SHALL show those offers checked. This default SHALL be
resolved when the goal is estimated or displayed, not written to the goal, so a goal saved without a selection gets it
too. Unchecking or checking any offer SHALL save an explicit
selection, which is then used as-is. Unchecking every offer SHALL save an explicit empty selection,
under which no shop supplies the goal's Mythic materials.

#### Scenario: Fresh goal default

- **WHEN** a user enables a Rank goal whose range needs Venerable Battle Mark and does not touch
  the control
- **THEN** all of Venerable Battle Mark's listed offers are checked and the goal is saved with no
  explicit selection

#### Scenario: Goal without a saved selection uses the default

- **GIVEN** a Ragnar Rank Adamantine 2 goal with no saved selection
- **WHEN** Goals, Today, or Raids Plan estimate it
- **THEN** every listed Venerable Battle Mark offer supplies it, and it is not reported as
  blocked for Venerable Battle Mark

#### Scenario: Explicit selection is used as-is

- **WHEN** a user unchecks the Rogue Trader offer and saves
- **THEN** only the Guild and Crusade offers supply the goal, and reopening the goal shows only
  those two checked

#### Scenario: Explicit opt-out

- **WHEN** a user unchecks every offer and saves
- **THEN** no shop supplies the goal's Mythic materials, the material stays a blocker when it has
  no other source, and reopening shows every offer unchecked
