## MODIFIED Requirements

### Requirement: Minimum team size and candidate-pool expansion

Every recommended team SHALL contain at least three characters. For the Plan
Team, the engine SHALL start from the selected project's contributing characters
and, while the current candidate set has fewer eligible characters than the
requested team size, progressively widen it in this fixed priority order:

1. Selected Project (the selected project's contributing characters)
2. Overall Goals (all active goals' contributing characters)
3. Full Roster (every owned character)

Once the candidate set holds at least the requested number of eligible
characters — or the full roster has been consumed — the team SHALL be generated
from it according to the selected mode and the requested team size (see "Team
size is a single page-level control"), with selected-project and active-goal
contributors ranked ahead of characters pulled in only to reach the requested
size. When the Plan Team draws on a pool wider than the selected project, the
section SHALL indicate that it was broadened. This ordering and widening
behaviour is provided by the shared `dailies-team-recommendations` engine, which
the Arena page configures with the three pools above.

Assumptions:

- An Arena team holds up to five characters; recommendations never exceed five.
- Machines of War are excluded from every pool.
- "Eligible" is mode-dependent (see the XP Mode and Power Mode requirements) and
  is further narrowed by any active preference (see "Preferred trait and
  damage-type controls"); a preference that widens the pool is not itself a
  failure state.
- The Random Team draws from the full owned roster (mode-filtered, then
  preference-filtered) and never needs broadening.
- Pool widening chases the requested team size and never stops short of the
  three-character minimum: a requested size the full roster still cannot fill
  with eligible characters yields a smaller delivered team, and XP Mode still
  never pads past three with XP-capped characters (see the mode requirements).

#### Scenario: Thin project pool is broadened

- **WHEN** the selected project has only two owned contributing characters
- **THEN** the Plan Team pool expands to include active-goal contributors, then
  the full roster if still short, until at least three eligible characters are
  available, and the section shows that it was broadened beyond the project

#### Scenario: Widening fills the requested team size from the roster

- **WHEN** the requested team size is five and the selected project and active
  goals together contribute only four eligible characters, and the player owns
  more eligible characters overall
- **THEN** the Plan Team is filled to five by adding the strongest eligible
  characters from the rest of the roster, those roster additions are ranked
  after the four contributors, and the section shows it was broadened

#### Scenario: Roster too small for any team

- **WHEN** a signed-in user owns fewer than three characters
- **THEN** the page shows a single explicit "not enough characters" state and
  renders no team-category sections
