## MODIFIED Requirements

### Requirement: Minimum team size and pool widening

Every recommended team SHALL contain at least three characters whenever the
mode-eligible roster holds at least three. For the Plan team the engine SHALL
start from the highest-priority pool and, while the current candidate set holds
fewer **eligible** characters than the requested team size, widen it one pool at
a time down the configured priority order, ending with the full mode-eligible
roster. Once the candidate set holds at least the requested number of eligible
characters — or every pool has been consumed — the team SHALL be generated from
it per the mode and the requested size, with higher-priority-pool members ranked
ahead of characters pulled in only by the widening. When the delivered team drew
on a pool below its primary pool, the team SHALL be marked as broadened.

Assumptions:

- "Eligible" depends on the mode (XP-eligible in XP mode; every owned character
  in Power mode) and on the active preference filters (see "Preference filters
  narrow eligibility").
- Pool widening chases the requested team size and never stops short of the
  three-character minimum: the pool widens until it holds at least the requested
  number of eligible characters or the full roster has been reached. A requested
  size the full roster still cannot fill with eligible characters yields a
  smaller delivered team.
- Widening to reach the requested size does not override the mode rules — XP
  mode still never pads past three with XP-capped characters (see "XP mode
  ordering").
- The Random team draws from the full mode-eligible roster and is never
  broadened.

#### Scenario: Thin primary pool is widened

- **WHEN** the highest-priority pool holds only two eligible characters and the
  requested team size is three
- **THEN** the candidate set expands down the priority order until at least three
  eligible characters are available, and the Plan team is marked broadened

#### Scenario: Pool widens to fill the requested size

- **WHEN** the requested team size is five, the configured priority pools
  together supply four eligible characters, and the full mode-eligible roster
  supplies more
- **THEN** the Plan team is delivered with five characters — the four
  higher-priority-pool members plus the strongest eligible character from the
  wider roster — and is marked broadened

#### Scenario: Roster smaller than the minimum

- **WHEN** the mode-eligible roster holds fewer than three characters
- **THEN** the engine reports this to the caller rather than padding the team
  from outside the roster
