## ADDED Requirements

### Requirement: Preferred trait and damage-type controls

The Arena page SHALL provide two page-level preference controls — **Preferred
trait** and **Preferred damage type** — each a single-select with an explicit
"Any" option selected by default. The options offered SHALL be limited to the
values actually present across the player's owned roster (the union of every
owned character's traits, and of every owned character's damage types), each
shown with its translated label and icon. A preference SHALL persist, per
browser, across navigating away from and back to the Arena page and across a
full page reload, in the same way as the XP/Power mode and the Team size
control. The controls SHALL appear in the page header in the same form at every
viewport.

Assumptions:

- A character's damage types are the union of its melee and ranged damage types
  and its ability damage types (the latter may be empty until populated
  server-side).
- Preferences are stored together as one JSON value; a stored value that names a
  trait or damage type the current roster no longer has SHALL be treated as
  "Any" without error.

#### Scenario: Default is Any for both controls

- **WHEN** a user opens the Arena page for the first time in a browser
- **THEN** the Preferred trait and Preferred damage type controls both show
  "Any" selected and no preference filtering is applied

#### Scenario: Options come from the owned roster

- **WHEN** the player owns characters covering three distinct traits
- **THEN** the Preferred trait control offers exactly those three traits plus
  "Any", and offers no trait the player cannot field

#### Scenario: Preference survives navigation and reload

- **WHEN** the player selects a Preferred trait, switches to another Dailies
  tab and back, then reloads the page
- **THEN** the same Preferred trait is still selected

### Requirement: Preferences apply softly to every category

A selected Preferred trait or Preferred damage type SHALL narrow candidate
eligibility for every category — Plan Team and Random Team — via the shared
`dailies-team-recommendations` engine's preference filters. When too few
characters in a category's primary pool match, the pool SHALL widen (and the
section SHALL show its existing broadened note) rather than the team shrinking.
A preference SHALL never cause a category to fail to produce a team: if the
fully widened pool still holds fewer than three matching characters, the
remaining slots SHALL be filled as if the preference were not set.

#### Scenario: Satisfiable preference restricts both teams

- **WHEN** the player selects a Preferred trait that at least five owned
  characters share and the team size is five
- **THEN** every character in the Plan Team and the Random Team has that trait

#### Scenario: Under-supplied preference widens rather than shrinks

- **WHEN** the player selects a Preferred trait that only one contributor to the
  selected project has, but four owned characters have overall
- **THEN** the Plan Team is filled with trait-matching characters from the
  widened pool and the section shows it was broadened

#### Scenario: Impossible preference still yields full teams

- **WHEN** the player selects a Preferred damage type that no owned character
  deals
- **THEN** both categories still render teams of the usual size, drawn as if no
  preference were set

## MODIFIED Requirements

### Requirement: Minimum team size and candidate-pool expansion

Every recommended team SHALL contain at least three characters. For the Plan
Team, the engine SHALL start from the selected project's contributing characters
and, only while the current candidate set has fewer than three eligible
characters, progressively widen it in this fixed priority order:

1. Selected Project (the selected project's contributing characters)
2. Overall Goals (all active goals' contributing characters)
3. Full Roster (every owned character)

Once the candidate set holds at least three eligible characters, the team SHALL
be generated from it according to the selected mode and the requested team size
(see "Team size is a single page-level control"). When the Plan Team draws on a
pool wider than the selected project, the section SHALL indicate that it was
broadened. This ordering and widening behaviour is provided by the shared
`dailies-team-recommendations` engine, which the Arena page configures with the
three pools above.

Assumptions:

- An Arena team holds up to five characters; recommendations never exceed five.
- Machines of War are excluded from every pool.
- "Eligible" is mode-dependent (see the XP Mode and Power Mode requirements) and
  is further narrowed by any active preference (see "Preferred trait and
  damage-type controls"); a preference that widens the pool is not itself a
  failure state.
- The Random Team draws from the full owned roster (mode-filtered, then
  preference-filtered) and never needs broadening.
- Pool widening is governed by the three-character minimum, not by the requested
  team size; a requested size the widened pool still cannot fill with eligible
  characters yields a smaller delivered team (see the mode requirements).

#### Scenario: Thin project pool is broadened

- **WHEN** the selected project has only two owned contributing characters
- **THEN** the Plan Team pool expands to include active-goal contributors, then
  the full roster if still short, until at least three eligible characters are
  available, and the section shows that it was broadened beyond the project

#### Scenario: Roster too small for any team

- **WHEN** a signed-in user owns fewer than three characters
- **THEN** the page shows a single explicit "not enough characters" state and
  renders no team-category sections

### Requirement: Category presentation adapts to viewport

The category sections SHALL be laid out for the viewport: on desktop the two
category sections MAY sit side by side; on mobile they stack vertically. The
page-level controls — the XP/Power mode toggle, the project selector, the
**Team size** radio group, and the **Preferred trait** and **Preferred damage
type** selectors — SHALL be the same controls in the same form at every viewport
(no separate compact variant). The set of categories, the recommended
characters, and every rationale SHALL be identical across viewports.

#### Scenario: Desktop layout

- **WHEN** the Arena page is viewed at or above the 768px breakpoint
- **THEN** the two category sections are laid out side by side and the mode
  toggle, project selector, Team size radio group, and preference selectors are
  shown in the page header

#### Scenario: Mobile layout

- **WHEN** the Arena page is viewed below the 768px breakpoint
- **THEN** the category sections stack vertically, and the mode toggle, project
  selector, Team size radio group, and preference selectors appear in the same
  form as on desktop, with the same categories and recommendations
