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

- **Active Project Team** — tuned to the player's active project.
- **Overall Goals Team** — tuned across all of the player's active goals.
- **Random Team** — drawn from the full owned roster.

The **Home Screen Event (HSE) Team** category SHALL NOT be shown in this
version (deferred to issue #111). Absence of any home-screen-event data SHALL
NOT prevent the three supported categories from rendering.

#### Scenario: All three categories render for a player with a project and goals

- **WHEN** a signed-in user with an active project, at least one active goal,
  and at least three owned characters opens the Arena page
- **THEN** the Active Project Team, Overall Goals Team, and Random Team
  sections are each shown, and no HSE Team section is shown

#### Scenario: No home screen event data

- **WHEN** the Arena page renders and no home-screen-event data is available
- **THEN** the three supported categories render without error and no HSE
  section appears

### Requirement: Active-project and active-goal basis

"Active project" SHALL mean the project the player has marked as their active
plan; if the player has no active plan, the Arena page SHALL treat the
**Active Project Team** category as having no basis. "Active goal" SHALL mean a
goal whose status is `Active`. A character SHALL be considered a contributor to
a goal when it is that goal's target character, and a contributor to a project
when it is the target character of any active goal that belongs to that
project. Machines of War SHALL never appear in a recommended team.

#### Scenario: Active Project Team basis

- **WHEN** the player's active plan is project P and P contains active goals
  targeting characters A, B, and C (all owned)
- **THEN** the Active Project Team is built from candidates {A, B, C} before
  any pool expansion

#### Scenario: Overall Goals Team basis

- **WHEN** the player has active goals targeting characters A, B, C, and D
  across several projects
- **THEN** the Overall Goals Team is built from candidates {A, B, C, D}
  regardless of which projects those goals belong to

#### Scenario: No active plan

- **WHEN** the player has no project marked as their active plan
- **THEN** the Active Project Team section shows an explicit "no active
  project" state that points the player to activate one, while the Overall
  Goals Team and Random Team sections still render

#### Scenario: No active goals

- **WHEN** the player has no goals with status `Active`
- **THEN** the Overall Goals Team section shows an explicit "no active goals"
  state, while the Random Team section still renders

### Requirement: Minimum team size and candidate-pool expansion

Every recommended team SHALL contain at least three characters. For each
category, the engine SHALL start from that category's primary candidate pool
and, only while the current candidate set has fewer than three eligible
characters, progressively widen it in this fixed priority order:

1. Active Project (the active plan's contributing characters)
2. Overall Goals (all active goals' contributing characters)
3. Full Roster (every owned character)

Once the candidate set holds at least three eligible characters, the final team
SHALL be generated from it according to the selected mode. When a category's
team draws on a pool wider than its primary one, the section SHALL indicate
that it was broadened.

Assumptions:

- An Arena team holds up to five characters; recommendations never exceed five.
- Machines of War are excluded from every pool.
- "Eligible" is mode-dependent (see the XP Mode and Power Mode requirements).
- The Random Team's primary pool is the Full Roster, so it never needs
  broadening.

#### Scenario: Thin project pool is broadened

- **WHEN** the active project has only two owned contributing characters
- **THEN** the Active Project Team pool expands to include active-goal
  contributors, then the full roster if still short, until at least three
  eligible characters are available, and the section shows that it was
  broadened beyond the project

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
- rank contributors to the category's basis ahead of non-contributors, and
  XP-eligible characters ahead of XP-capped characters;
- include an XP-capped character only when fewer than three XP-eligible
  characters are available in the (possibly expanded) pool, and then only in
  the minimum-size (three-character) team — never to pad a larger variant;
- for each category, produce up to three team variants — of three, four, and
  five characters — always including the three-character variant and presenting
  it as the primary recommendation, and offering the four- and five-character
  variants as alternatives only when each can be filled entirely with
  XP-eligible characters.

XP Mode ranks and selects characters only; it does not display a numeric XP
projection.

Assumptions:

- A character's level cap is a function of its current progression tier's
  rarity, not its rank. The caps used are:
  Common 8, Uncommon 17, Rare 26, Epic 35, Legendary 50, Mythic 60
  (ported from V1's `maxLevelForRarity`; V1 uses 65 for Mythic — the exact
  Mythic ceiling is confirmed during implementation, see design.md — Open
  Questions). "XP-capped" means synced level ≥ the cap for the character's
  current progression tier.
- The progression tier's rarity is read from the character's synced
  progression step; ascension into the next tier raises the cap.
- A battle's shared XP is divided among the characters deployed, so a
  three-character team advances each of its characters faster than a
  five-character team — this is why the three-character variant ranks highest.

#### Scenario: XP-capped character is deprioritized

- **WHEN** a category pool contains four XP-eligible contributors and one
  contributor that is an un-ascended Epic character already at level 35 (its
  tier cap)
- **THEN** the recommended teams are filled from the four XP-eligible
  characters and the capped Epic character is not selected

#### Scenario: Three-character variant is the primary recommendation

- **WHEN** XP Mode produces the three-, four-, and five-character variants for
  a category
- **THEN** the three-character variant is shown as that category's primary
  recommendation and the four- and five-character variants are shown as
  alternatives

#### Scenario: Too few XP-eligible characters

- **WHEN** the fully expanded pool for a category has only two XP-eligible
  characters
- **THEN** XP-capped characters fill the remaining slots so the team still has
  at least three characters, and the section indicates that capped characters
  were included

### Requirement: Power Mode team selection

When Power Mode is selected the engine SHALL ignore XP eligibility and rank the
(possibly expanded) candidate pool by each character's combat-power estimate
(see the `character-combat-power` capability), selecting the highest-power
characters. Power Mode SHALL return a single team per category at the full
Arena capacity of five characters, or fewer only when the expanded pool holds
fewer than five owned characters.

#### Scenario: Strongest characters are chosen

- **WHEN** Power Mode is selected and a category's expanded pool has six owned
  characters with distinct combat-power estimates
- **THEN** the recommended team is the five with the highest combat power, in
  descending combat-power order

#### Scenario: Power Mode ignores the level cap

- **WHEN** a category's pool includes a character at its progression tier's
  level cap whose combat power is among the top five
- **THEN** Power Mode includes that character despite it being XP-capped

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

The Random Team SHALL be composed of between three and five characters drawn at
random from the full owned roster. The section SHALL provide a **Regenerate**
control that replaces the current Random Team with a different composition
whenever the roster is large enough for the result to differ. Regenerate SHALL
affect only the Random Team. The Random Team SHALL be generated afresh on each
page load and on each Regenerate; it SHALL NOT be persisted.

#### Scenario: Regenerate produces a different team

- **WHEN** the player owns at least six characters and uses Regenerate
- **THEN** the Random Team is replaced with a composition that differs from the
  previous one, and the other category sections are unchanged

#### Scenario: Random Team is not persisted

- **WHEN** the player reloads the Arena page
- **THEN** a newly randomized Random Team is shown rather than the one from
  before the reload

### Requirement: Team presentation and rationale

Each recommended team SHALL identify every character by its in-game name and
portrait, resolved from the character id through the shared catalog and
translations used elsewhere in the app. For each selected character the team
SHALL convey why it was chosen — the active goal(s) or project it contributes
to, that it was chosen for combat strength, that it was included to meet the
minimum team size, or that it was drawn at random.

#### Scenario: Contributing character shows its rationale

- **WHEN** a character is selected because it is the target of an active goal
- **THEN** the team entry for that character references that goal (or its
  project)

#### Scenario: Filler character shows a neutral rationale

- **WHEN** a character is selected only to reach the three-character minimum
- **THEN** the team entry for that character indicates it was added to meet the
  minimum team size rather than referencing a goal

### Requirement: Distinct loading, failure, and empty states

The Arena page SHALL present a distinct state for each of: required data still
loading; required data failed to load; the signed-in player has too few
characters for any team; and a rendered category has no basis of its own. A
load failure state SHALL offer a retry.

#### Scenario: Data is loading

- **WHEN** the roster, goals, projects, or catalog data needed for
  recommendations has not finished loading
- **THEN** the page shows a loading state rather than empty or partial
  category sections

#### Scenario: Data fails to load

- **WHEN** any of the data needed for recommendations fails to load
- **THEN** the page shows an explicit failure state with a retry action rather
  than appearing empty

#### Scenario: Category with no basis

- **WHEN** the page renders for a player who has an owned roster of at least
  three characters but no active project and no active goals
- **THEN** the Active Project Team and Overall Goals Team sections each show
  their own "no basis" empty state, while the Random Team section renders
  normally

### Requirement: Category presentation adapts to viewport

The category sections and the XP-mode variant switcher SHALL be laid out for
the viewport: on desktop the category sections MAY sit side by side and the
three/four/five-character variant switcher is shown inline; on mobile the
category sections stack vertically and the variant switcher is presented in a
compact form. The set of categories, the recommended characters, and every
rationale SHALL be identical across viewports.

#### Scenario: Desktop layout

- **WHEN** the Arena page is viewed at or above the 768px breakpoint
- **THEN** the category sections are laid out for the wider viewport and the
  XP-mode variant switcher is shown inline

#### Scenario: Mobile layout

- **WHEN** the Arena page is viewed below the 768px breakpoint
- **THEN** the category sections stack vertically and the XP-mode variant
  switcher is shown in a compact form, with the same categories and
  recommendations as on desktop
