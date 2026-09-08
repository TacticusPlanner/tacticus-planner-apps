# dailies-arena-recommendations Specification

## Purpose

Recommends Arena team compositions on the Dailies → Arena page so that a
player's daily Arena battles also advance their current priorities — active
project, active goals, and roster — rather than being played blind. The aim is
progress-while-playing, not the objectively strongest possible team (though
that is available on demand).

## Requirements

### Requirement: Arena page replaces the placeholder

The `/dailies/arena` route SHALL render the Arena recommendations page for a
signed-in user, instead of the shared "Under Construction" placeholder. The
Arena primary tab SHALL stay highlighted as active while the page is shown.

#### Scenario: Opening the Arena tab

- **WHEN** a signed-in user navigates to `/dailies/arena`
- **THEN** the Arena recommendations page is rendered and the Arena tab is
  highlighted as active

#### Scenario: Direct navigation to the Arena URL

- **WHEN** a user loads `/dailies/arena` directly (fresh load, bookmark, or
  shared link) without first visiting `/dailies`
- **THEN** the Dailies tab bar renders with the Arena recommendations page
  shown and the Arena tab highlighted as active

### Requirement: Recommended team categories

The page SHALL present recommended teams in these categories, each as its own
labeled section:

- **Plan Team** — tuned to the player's selected project first, then widened to
  all active goals and the full roster as needed (see "Active-project and
  active-goal basis").
- **Random Team** — drawn from the owned roster, filtered by the selected mode
  (see "Random Team and Regenerate").

The separate **Active Project Team** and **Overall Goals Team** categories of
the previous version are REPLACED by the single **Plan Team**. The **Home Screen
Event (HSE) Team** category SHALL NOT be shown in this version (deferred to
issue #111). Absence of any home-screen-event data SHALL NOT prevent the two
supported categories from rendering.

#### Scenario: All three categories render for a player with a project and goals

- **WHEN** a signed-in user with a selectable project, at least one active goal,
  and at least three owned characters opens the Arena page
- **THEN** the Plan Team and Random Team sections are each shown, and no
  Active Project Team, Overall Goals Team, or HSE Team section is shown

#### Scenario: No home screen event data

- **WHEN** the Arena page renders and no home-screen-event data is available
- **THEN** the two supported categories render without error and no HSE section
  appears

### Requirement: Active-project and active-goal basis

The Arena page SHALL provide a project selector whose current value is the
"selected project" that drives the **Plan Team**. "Active goal" SHALL mean a
goal whose status is `Active`. A character SHALL be considered a contributor to
a goal when it is that goal's target character, and a contributor to a project
when it is the target character of any active goal that belongs to that project.
Machines of War SHALL never appear in a recommended team.

The **Plan Team**'s primary candidate pool SHALL be the selected project's owned
contributing characters, widening as specified in "Minimum team size and
candidate-pool expansion". The Plan Team SHALL always produce a team for a
player with at least three owned characters; it has no "no basis" empty state.
Selected-project contributors SHALL be ranked ahead of characters that
contribute only to active goals outside that project.

Assumptions:

- The project selector is the shared Dailies project selector; its default value
  and cross-tab persistence are specified in "Arena project selector".
- If the player has no project available to select, the Plan Team's primary pool
  is the active-goal contributors, widening to the full roster.

#### Scenario: Active Project Team basis

- **WHEN** the selected project P contains active goals targeting owned
  characters A, B, and C (all owned)
- **THEN** the Plan Team is built from candidates {A, B, C} before any pool
  expansion

#### Scenario: Overall Goals Team basis

- **WHEN** the selected project contributes only characters A and B, and the
  player has active goals targeting owned characters C and D in other projects
- **THEN** the Plan Team pool widens to include {C, D}, with A and B ranked
  ahead of C and D

#### Scenario: Switching the selected project re-tunes the Plan Team

- **WHEN** the player changes the project selector from project P to project Q
- **THEN** the Plan Team is rebuilt with project Q's contributing characters as
  its primary pool

#### Scenario: No active plan

- **WHEN** the player has no project marked as their active plan
- **THEN** the project selector falls back to the player's default project (or,
  if none is selectable, to no project), and the Plan Team still renders a team
  drawn from active goals then the full roster rather than a "no active project"
  message

#### Scenario: No active goals

- **WHEN** the player has no goals with status `Active` and no selectable
  project
- **THEN** the Plan Team widens to the full roster and recommends a team drawn
  from it, flagged as broadened, rather than showing a "no active goals" message

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

### Requirement: XP Mode team selection

XP Mode SHALL be the default team-generation mode. In XP Mode the engine SHALL:

- treat a character as **XP-eligible** when it is owned/unlocked and its synced
  character level is below the level cap for its current progression tier
  (a character at that cap cannot earn further XP until it is ascended into the
  next rarity tier);
- rank contributors to the Plan Team's basis ahead of non-contributors, and
  XP-eligible characters ahead of XP-capped characters;
- rank selected-project contributors ahead of other active-goal contributors;
- include an XP-capped character only when fewer than three XP-eligible
  characters are available in the (possibly expanded) pool, and then only up to
  the three-character minimum — never to pad the team beyond three;
- deliver a single Plan Team at the requested team size (see "Team size is a
  single page-level control"), reduced below the requested size only when the
  expanded pool cannot fill it — with XP-eligible characters, or below three
  with capped fillers. A requested size above three SHALL NOT pull in an
  XP-capped character.

XP Mode ranks and selects characters only; it does not display a numeric XP
projection.

Assumptions:

- A character's level cap is a function of its current progression tier's
  rarity, not its rank. The caps used are:
  Common 8, Uncommon 17, Rare 26, Epic 35, Legendary 50, Mythic 60.
  "XP-capped" means synced level ≥ the cap for the character's current
  progression tier.
- The progression tier's rarity is read from the character's synced progression
  step; ascension into the next tier raises the cap.
- A battle's shared XP is divided among the characters deployed, so a smaller
  team advances each of its characters faster; the Team size control lets the
  player trade roster coverage for per-character XP (see "Team size is a single
  page-level control").

#### Scenario: XP-capped character is deprioritized

- **WHEN** the Plan Team pool contains four XP-eligible contributors and one
  contributor that is an un-ascended Epic character already at level 35 (its
  tier cap), and the requested team size is three
- **THEN** the recommended team is filled from the four XP-eligible characters
  and the capped Epic character is not selected

#### Scenario: Three-character variant is the primary recommendation

- **WHEN** the player sets the Team size control to three
- **THEN** each team is built for three characters — the smallest team, which
  concentrates a battle's shared XP among the fewest characters

#### Scenario: Requested size above three is not padded with capped characters

- **WHEN** the requested team size is five and the fully expanded pool holds
  only four XP-eligible characters plus some XP-capped characters
- **THEN** the Plan Team is delivered with those four XP-eligible characters and
  the section notes that fewer than the requested five were available

#### Scenario: Too few XP-eligible characters

- **WHEN** the fully expanded pool has only two XP-eligible characters
- **THEN** XP-capped characters fill the remaining slots so the team still has
  three characters, and the section indicates that capped characters were
  included

### Requirement: Power Mode team selection

When Power Mode is selected the engine SHALL ignore XP eligibility and rank the
Plan Team's (possibly expanded) candidate pool by each character's combat-power
estimate (see the `character-combat-power` capability), selecting the
highest-power characters. Power Mode SHALL deliver the Plan Team at the
requested team size (see "Team size is a single page-level control"), or fewer
only when the expanded pool holds fewer owned characters than the requested
size. Power Mode also governs the Random Team's draw (see "Random Team and
Regenerate").

#### Scenario: Strongest characters are chosen

- **WHEN** Power Mode is selected, the requested team size is five, and the Plan
  Team's expanded pool has six owned characters with distinct combat-power
  estimates
- **THEN** the recommended team is the five with the highest combat power, in
  descending combat-power order

#### Scenario: Power Mode ignores the level cap

- **WHEN** the Plan Team's pool includes a character at its progression tier's
  level cap whose combat power is among the requested-size strongest
- **THEN** Power Mode includes that character despite it being XP-capped

#### Scenario: Requested size larger than the pool

- **WHEN** the requested team size is five and the expanded pool holds only four
  owned characters
- **THEN** the Plan Team is delivered with those four characters and the section
  notes that fewer than the requested five were available

### Requirement: Mode selection is a single persisted control

The XP/Power mode SHALL be chosen with one page-level control that applies to
every category at once. It SHALL default to XP Mode on a first visit. The
chosen mode SHALL persist, per browser, across navigating away from and back to
the Arena page and across a full page reload.

#### Scenario: First visit defaults to XP Mode

- **WHEN** a user opens the Arena page for the first time in a browser
- **THEN** the mode control shows XP Mode selected

#### Scenario: Mode survives navigation

- **WHEN** the user switches to Power Mode, navigates to another Dailies tab,
  and returns to the Arena page
- **THEN** Power Mode is still selected

#### Scenario: Mode survives reload

- **WHEN** the user switches to Power Mode and reloads the page
- **THEN** Power Mode is still selected

### Requirement: Random Team and Regenerate

The Random Team SHALL be composed of characters drawn at random from the owned
roster, filtered by the selected mode, at the requested team size (or fewer when
the filtered pool is smaller). The Random Team's draw SHALL respect the selected
mode:

- In **XP Mode** the draw pool is the XP-eligible characters only; XP-capped
  characters are added to the pool only when fewer than the requested size are
  XP-eligible.
- In **Power Mode** the draw pool is the whole owned roster and the random draw
  is weighted by each character's combat-power estimate, so stronger characters
  are more likely to be drawn while the result is still randomized.

The section SHALL provide a **Regenerate** control that replaces the current
Random Team with a different composition whenever the unlocked slots can differ.
Regenerate SHALL affect only the Random Team. A character the player has
**locked** (see "Random Team character locks") SHALL be kept in place across
Regenerate; only the unlocked slots are re-drawn. Regenerate SHALL be disabled
when every slot is locked. The Random Team SHALL be generated afresh on each
page load and on each Regenerate; neither it nor its locks SHALL be persisted.

Assumptions:

- Combat-power weighting uses the same `character-combat-power` estimate as
  Power Mode's Plan Team ranking; it changes draw probability only and is not
  displayed as a number.
- The draw is deterministic for a given roster, mode, lock set, and regenerate
  count, so the same inputs reproduce the same team.

#### Scenario: Regenerate produces a different team

- **WHEN** the player owns at least six characters, has no locked slots, and
  uses Regenerate
- **THEN** the Random Team is replaced with a composition that differs from the
  previous one, and the other category section is unchanged

#### Scenario: XP Mode random draw excludes capped characters

- **WHEN** XP Mode is selected, the roster has at least the requested team size
  of XP-eligible characters, and the player uses Regenerate
- **THEN** the Random Team contains only XP-eligible characters

#### Scenario: Power Mode random draw favors stronger characters

- **WHEN** Power Mode is selected and the player regenerates the Random Team
  many times
- **THEN** higher-combat-power characters appear in the Random Team more often
  than lower-combat-power ones, without any character being guaranteed or
  excluded

#### Scenario: Locked characters survive Regenerate

- **WHEN** the player locks two characters in the Random Team and uses
  Regenerate
- **THEN** those two characters remain in the Random Team and only the other
  slots change

#### Scenario: Random Team is not persisted

- **WHEN** the player reloads the Arena page
- **THEN** a newly randomized Random Team is shown, with no locks retained,
  rather than the team from before the reload

### Requirement: Team presentation and rationale

Each recommended team SHALL identify every character by its in-game name and
portrait, resolved from the character id through the shared catalog and
translations used elsewhere in the app, and SHALL show each character's current
rarity and rank. The rarity icon, the rank icon, and the Random Team's lock
toggle SHALL each expose their meaning as a text label on hover/focus (a
tooltip), so the icon-only presentation stays legible. For each selected
character the team SHALL convey why it was chosen — the active goal(s) or
project it contributes to, that it was chosen for combat strength, that it was
included to meet the minimum team size, or that it was drawn at random. Team
members SHALL be presented as a single vertical list (one character per row).

#### Scenario: Contributing character shows its rationale

- **WHEN** a character is selected because it is the target of an active goal
- **THEN** the team entry for that character references that goal (or its
  project) and shows the character's rarity and rank

#### Scenario: Filler character shows a neutral rationale

- **WHEN** a character is selected only to reach the three-character minimum
- **THEN** the team entry for that character indicates it was added to meet the
  minimum team size rather than referencing a goal

#### Scenario: Team is a single column

- **WHEN** a recommended team of four or five characters is shown at any
  viewport
- **THEN** the characters are listed one per row in a single column

#### Scenario: Icon controls carry a tooltip

- **WHEN** the player hovers or focuses a team row's rarity icon, rank icon, or
  the Random Team's lock toggle
- **THEN** a tooltip names the rarity, the rank, or the lock/unlock action
  respectively

### Requirement: Distinct loading, failure, and empty states

The Arena page SHALL present a distinct state for each of: required data still
loading; required data failed to load; and the signed-in player has too few
characters for any team. A load failure state SHALL offer a retry. There is no
per-category "no basis" empty state — the Plan Team always builds a team by
widening its pool (see "Active-project and active-goal basis").

#### Scenario: Data is loading

- **WHEN** the roster, goals, projects, or catalog data needed for
  recommendations has not finished loading
- **THEN** the page shows a loading state rather than empty or partial category
  sections

#### Scenario: Data fails to load

- **WHEN** any of the data needed for recommendations fails to load
- **THEN** the page shows an explicit failure state with a retry action rather
  than appearing empty

#### Scenario: Category with no basis

- **WHEN** the page renders for a player who has an owned roster of at least
  three characters but no selectable project and no active goals
- **THEN** the Plan Team section renders a full-roster team flagged as broadened
  and the Random Team section renders normally — neither shows a "no basis"
  empty state

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

### Requirement: Team size is a single page-level control

The Arena page SHALL provide one page-level **Team size** control — a radio
group offering the values 3, 4, and 5 — that sets the requested size for both
the Plan Team and the Random Team. It SHALL default to 5 on a first visit (a
full Arena team), which the player can narrow to 4 or 3. The chosen size SHALL
persist, per browser, across navigating away from and back to the Arena page and
across a full page reload, in the same way as the XP/Power mode. A size the
current data cannot deliver (for example, a value above the owned roster size)
SHALL be shown as an unavailable option rather than being hidden, and selecting
an undeliverable size SHALL yield the largest deliverable team with a note
explaining the shortfall.

Assumptions:

- The control replaces the previous per-category three/four/five-character
  variant switcher; there is no per-category size control.
- "Deliverable" is mode-dependent: XP Mode counts XP-eligible characters (plus
  capped fillers only up to three), Power Mode counts owned characters in the
  pool.
- The default of 5 is also clamped to the owned roster size for a player with
  fewer than five characters.

#### Scenario: First visit defaults to a five-character team

- **WHEN** a user opens the Arena page for the first time in a browser
- **THEN** the Team size control shows 5 selected and both teams are built for
  five characters (clamped to the roster size for a smaller roster)

#### Scenario: Changing team size resizes both teams

- **WHEN** the user selects team size 3
- **THEN** the Plan Team and the Random Team are both rebuilt targeting three
  characters

#### Scenario: Team size survives navigation and reload

- **WHEN** the user selects team size 4, navigates to another Dailies tab and
  back, then reloads the page
- **THEN** the Team size control still shows 4 selected

#### Scenario: Undeliverable size is offered but clamped

- **WHEN** the user owns four characters and selects team size 5
- **THEN** the option for 5 is shown as unavailable, the teams are delivered
  with four characters, and a note explains fewer than five were available

### Requirement: Arena project selector

The Arena page SHALL let the player choose which project drives the Plan Team,
using the shared Dailies project selector. Its initial value SHALL be the
player's active plan, falling back to the player's default project when there is
no active plan. The selected project SHALL be shared with the other Dailies
sub-tabs for the session — changing it on the Arena page changes it for the
Raids tabs and vice versa — and SHALL reset to the derived default on a full
page reload (it is not persisted).

#### Scenario: Default selection

- **WHEN** the player opens the Arena page and has a project marked as their
  active plan
- **THEN** the project selector shows that active-plan project selected

#### Scenario: Default selection without an active plan

- **WHEN** the player opens the Arena page, has no active plan, but has a
  default project
- **THEN** the project selector shows the default project selected

#### Scenario: Selection is shared across Dailies tabs

- **WHEN** the player changes the project on the Arena page and then opens the
  Raids tab
- **THEN** the Raids tab shows the same project selected

### Requirement: Random Team character locks

Each character in the Random Team SHALL have a lock toggle. Locking a character
SHALL keep it in the Random Team across every subsequent Regenerate until it is
unlocked. Locks SHALL apply only to the Random Team, SHALL NOT be persisted
(cleared on reload), and SHALL be cleared when the underlying roster changes. A
locked character SHALL be retained even if a mode change would otherwise remove
it from the draw pool (for example, an XP-capped locked character in XP Mode).

#### Scenario: Locking then regenerating

- **WHEN** the player locks a character and uses Regenerate
- **THEN** that character stays in the Random Team and the unlocked slots are
  redrawn

#### Scenario: All slots locked

- **WHEN** the player locks every character in the Random Team
- **THEN** the Regenerate control is disabled

#### Scenario: Locked character kept against the mode filter

- **WHEN** the player locks an XP-capped character in Power Mode, then switches
  to XP Mode
- **THEN** the locked XP-capped character remains in the Random Team even though
  new XP-Mode draws would exclude it

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
