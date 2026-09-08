# dailies-salvage-run-recommendations Specification

## Purpose

Recommends Salvage Run team compositions on the Dailies → Salvage Run page,
one alliance track at a time (Imperial, Chaos, Xenos), so that the player's
daily Salvage Run battles also advance their current plan while never fielding a
character from outside the selected track's alliance.

## Requirements

### Requirement: Salvage Run page replaces the placeholder

The `/dailies/salvage-run` route SHALL render the Salvage Run recommendations
page for a signed-in user, instead of the shared "Under Construction"
placeholder. The Salvage Run primary tab SHALL stay highlighted as active while
the page is shown.

#### Scenario: Opening the Salvage Run tab

- **WHEN** a signed-in user navigates to `/dailies/salvage-run`
- **THEN** the Salvage Run recommendations page is rendered and the Salvage Run
  tab is highlighted as active

#### Scenario: Direct navigation to the Salvage Run URL

- **WHEN** a user loads `/dailies/salvage-run` directly without first visiting
  `/dailies`
- **THEN** the page renders with the Salvage Run tab highlighted as active

### Requirement: Alliance track selector

The page SHALL provide one page-level **track selector** offering exactly three
tracks — **Imperial**, **Chaos**, and **Xenos** — each shown with its label and
alliance icon. Exactly one track is selected at a time. The selected track SHALL
determine which owned characters every recommendation on the page may draw on
(see "Alliance restriction is applied first"). The selected track SHALL persist,
per browser, across navigating away from and back to the Salvage Run page and
across a full page reload. On a first visit the selector SHALL default to the
Imperial track.

Assumptions:

- The three tracks correspond to the `Imperial`, `Chaos`, and `Xenos` alliances.
  The `Neutral` alliance has no Salvage Run track and is never selectable.
- The track is stored per browser under a Salvage-Run-specific key, separate
  from the Arena page's persisted controls.

#### Scenario: First visit defaults to the Imperial track

- **WHEN** a user opens the Salvage Run page for the first time in a browser
- **THEN** the track selector shows the Imperial track selected

#### Scenario: Switching the track rebuilds every recommendation

- **WHEN** the player switches the selector from Imperial to Chaos
- **THEN** the Plan Team and the Random Team are both rebuilt from the player's
  owned Chaos characters, and no character that is not a Chaos character appears
  in either team

#### Scenario: Track survives navigation and reload

- **WHEN** the player selects the Xenos track, navigates to another Dailies tab
  and back, then reloads the page
- **THEN** the Xenos track is still selected

### Requirement: Alliance restriction is applied first

For the selected track, the set of characters any recommendation may use SHALL
be the player's owned characters whose alliance equals the track's alliance. The
restriction SHALL be applied before project, goal, XP, or power prioritization,
and before any candidate-pool widening — so that widening the Plan Team's pool
to "the full roster" still means only the track's alliance. A character of
another alliance SHALL never appear in the Plan Team or the Random Team,
including when a Preferred trait or Preferred damage type is set.

#### Scenario: Off-alliance goal contributor is excluded

- **WHEN** the selected track is Imperial and the player has an active goal
  targeting an owned Chaos character
- **THEN** that Chaos character does not appear in the Imperial track's Plan
  Team even though it is a goal contributor

#### Scenario: Widening stays within the alliance

- **WHEN** the selected track's alliance has only two owned goal contributors
  but eight owned characters overall
- **THEN** the Plan Team pool widens to the track's other owned characters (up
  to the three-character minimum) and never to a character of another alliance

#### Scenario: Preference never escapes the alliance

- **WHEN** a Preferred trait is set that only off-alliance characters have
- **THEN** the teams are drawn from the track's alliance as if no preference
  were set, and no off-alliance character is added

### Requirement: Recommended team categories and shared engine behaviour

For the selected track the page SHALL present a **Plan Team** and a **Random
Team**, each as its own labeled section, built by the shared
`dailies-team-recommendations` engine configured with the track-restricted
roster and the same two priority pools as the Arena page: the selected project's
owned contributing characters, then all active goals' owned contributing
characters, then (implicitly) the track's full owned roster. The Plan Team's
minimum size, pool widening and broadened note, the XP Mode and Power Mode
ordering, the Random Team draw, Regenerate, and per-character locks SHALL behave
exactly as specified for that shared engine. Machines of War SHALL never appear
in a recommended team.

#### Scenario: Both categories render for a populated track

- **WHEN** the player owns at least three characters of the selected track's
  alliance
- **THEN** the Plan Team and Random Team sections are each shown, drawn only
  from that alliance

#### Scenario: Plan Team widens within the track and is marked broadened

- **WHEN** the selected project contributes only one owned character of the
  track's alliance, but the alliance has five owned characters overall
- **THEN** the Plan Team is filled from the track's alliance and the section
  shows it was broadened beyond the project

### Requirement: Shared mode, size, and preference controls

The page SHALL provide the same page-level controls as the Arena page: one
XP / Power mode toggle (default XP), the shared Dailies project selector, a
Team size radio group (3 / 4 / 5, default 5), and the Preferred trait and
Preferred damage type single-selects (default "Any", options limited to the
values present across the **selected track's** owned characters). The mode, team
size, and preference selections SHALL persist per browser under Salvage-Run
keys, independent of the Arena page. The project selection is the shared Dailies
selection and is not persisted. All of these controls SHALL appear in the page
header in the same form at every viewport.

#### Scenario: Preference options follow the selected track

- **WHEN** the player switches from a track whose characters cover trait X to a
  track whose characters do not
- **THEN** trait X is no longer offered by the Preferred trait control

#### Scenario: Mode and size persist independently of Arena

- **WHEN** the player sets Power Mode and team size 3 on the Salvage Run page,
  then opens the Arena page
- **THEN** the Arena page still shows its own persisted mode and size, unchanged
  by the Salvage Run selections

#### Scenario: Salvage Run controls survive reload

- **WHEN** the player sets Power Mode on the Salvage Run page and reloads
- **THEN** Power Mode is still selected

### Requirement: Insufficient roster for a track

When the player owns fewer than three characters of the selected track's
alliance, the page SHALL NOT render the team-category sections. Instead it SHALL
show a single per-track state that: lists the eligible owned characters of that
alliance (by in-game name and portrait, with rarity and rank), states that a
full team cannot be generated for the track, and shows how many more characters
of that alliance are required to reach a team of three. It SHALL NOT fill the
shortfall with characters of another alliance. Switching to a track with at
least three owned characters SHALL show the normal team sections.

#### Scenario: Track with too few owned characters

- **WHEN** the selected track's alliance has only two owned characters
- **THEN** the page shows those two characters, states a full team is not
  possible for this track, and indicates that one more character of that
  alliance is needed — and shows no Plan Team or Random Team section

#### Scenario: Switching to a populated track recovers the normal view

- **WHEN** the player is on an under-populated track and switches to a track
  with four owned characters
- **THEN** the Plan Team and Random Team sections render for the new track

#### Scenario: A track shortfall does not block other tracks

- **WHEN** the player owns zero characters of one alliance but plenty of another
- **THEN** the under-populated track shows the shortfall state and the populated
  track shows normal recommendations, with no error

### Requirement: Distinct loading and failure states

The page SHALL present a distinct state for required data still loading and for
required data failing to load, the latter with a retry action. These are
whole-page states shown regardless of the selected track. The per-track
insufficient-roster state (see "Insufficient roster for a track") is separate
from a load failure.

#### Scenario: Data is loading

- **WHEN** the roster, goals, project, or character catalog data has not
  finished loading
- **THEN** the page shows a loading state rather than empty or partial sections

#### Scenario: Data fails to load

- **WHEN** any of the data needed for recommendations fails to load
- **THEN** the page shows an explicit failure state with a retry action

### Requirement: Salvage Run onboarding tour

The page SHALL register a Joyride onboarding tour covering the page purpose, the
track selector, the mode toggle, the project selector, the Team size control,
the preference controls, the Plan Team, the Random Team's locks, and its
Regenerate control. The desktop and mobile tours SHALL target the same elements.

#### Scenario: Tour is registered with the track step

- **WHEN** the Salvage Run page mounts
- **THEN** an onboarding tour is registered whose steps include one anchored to
  the track selector, for both desktop and mobile
