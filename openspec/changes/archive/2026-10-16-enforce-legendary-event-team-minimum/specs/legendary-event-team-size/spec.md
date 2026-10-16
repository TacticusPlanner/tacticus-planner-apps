# Spec Delta

## Purpose

Defines the minimum size of a Legendary Event team (three characters), how the team editor enforces it, how a stored team below the minimum is shown and kept out of every calculation, and how a skipped V1 team is explained.

## ADDED Requirements

### Requirement: A team needs at least three characters

The team editor SHALL keep Save unavailable until the team has at least three non-reserve members. The count SHALL read "n/5 · at least 3", and below three the editor SHALL show "A team needs at least 3 characters" beside Save. A reserve does not count. A save the API rejects for size SHALL leave no team saved and show the existing save failure.

#### Scenario: Two members

- **GIVEN** the editor has two members and a reserve
- **WHEN** it renders
- **THEN** the count reads "2/5 · at least 3", the message shows and Save is unavailable

#### Scenario: Third member enables Save

- **GIVEN** the editor has two members
- **WHEN** the user adds a third member
- **THEN** the message disappears and Save is available

#### Scenario: Removing a member below three

- **GIVEN** a valid three-member team opened for editing
- **WHEN** the user removes one member
- **THEN** Save becomes unavailable with the message

### Requirement: A stored team below three characters is incomplete

A stored team with fewer than three non-reserve members (written before the minimum, or imported) SHALL show on its card the warning "Needs at least 3 characters", keep its Edit and Delete actions and its place in the lane order, and hide its clear-depth stepper. Opening it in the editor SHALL show its members with Save unavailable until a third member is added.

#### Scenario: Uthar's two-member team

- **GIVEN** Uthar Alpha holds a team of `ultraApothecary` and `bloodIntercessor` with a stored depth of 5 for run 2
- **WHEN** the Alpha Teams section renders
- **THEN** the card shows both portraits, the "2/5" count and "Needs at least 3 characters", no depth stepper, and Edit and Delete

#### Scenario: Completing it

- **WHEN** the user edits that team and adds a third member
- **THEN** Save becomes available, and after saving the card shows its depth again (the stored depth for run 2 is kept)

### Requirement: Incomplete teams are ignored by every calculation

An incomplete team SHALL NOT be used by the token plan, lane reachable points, upgrade impact, team suggestions (neither as an existing team nor in gains), clear estimates, the master table's In teams set and estimated points, or the clear-depth read of any card. The Next token card's "Add a team" and "Set how far … clears" prompts SHALL treat the lane as having no team when every team on it is incomplete.

#### Scenario: Plan ignores the short team

- **GIVEN** Uthar Alpha has the two-member team (depth 5, covering Max 2 Hits and Melee) and no other team
- **WHEN** the token plan is computed
- **THEN** no token uses that team, and the Next token card reads "Add a team on Alpha to get a plan"

#### Scenario: Master table

- **GIVEN** the two-member team is the only team containing `bloodIntercessor`
- **WHEN** the master table renders in the In teams set
- **THEN** `bloodIntercessor` does not appear because of that team

### Requirement: The V1 import result explains skipped short teams

The V1 import result SHALL list a team skipped with the issue `team_too_small` under the legendary events part, with a localized reason that names the team and how many units remained, in en, de, es and fr.

#### Scenario: Two-unit team in the result

- **GIVEN** an import outcome with issue `team_too_small` for team "Melee" and value 2
- **WHEN** the result renders
- **THEN** the legendary events part lists "Melee" with a reason that says only 2 units remained and a team needs 3
