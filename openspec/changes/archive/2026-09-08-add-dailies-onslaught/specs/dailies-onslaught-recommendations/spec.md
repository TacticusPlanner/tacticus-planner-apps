# dailies-onslaught-recommendations Specification

## Purpose

Recommends Onslaught team compositions on the Dailies → Onslaught page, one
alliance track at a time (Imperial, Chaos, Xenos), so that the player's daily
Onslaught battles both field a legal alliance-locked team and prioritize the
characters they are ascending through Onslaught shard farming — and separately
recommends which character or Machine of War to select for the post-battle shard
reward.

## ADDED Requirements

### Requirement: Onslaught page replaces the placeholder

The `/dailies/onslaught` route SHALL render the Onslaught recommendations page
for a signed-in user, instead of the shared "Under Construction" placeholder.
The Onslaught primary tab SHALL stay highlighted as active while the page is
shown.

#### Scenario: Opening the Onslaught tab

- **WHEN** a signed-in user navigates to `/dailies/onslaught`
- **THEN** the Onslaught recommendations page is rendered and the Onslaught tab
  is highlighted as active

#### Scenario: Direct navigation to the Onslaught URL

- **WHEN** a user loads `/dailies/onslaught` directly without first visiting
  `/dailies`
- **THEN** the page renders with the Onslaught tab highlighted as active

### Requirement: Alliance track selector

The page SHALL provide one page-level **track selector** offering exactly three
tracks — **Imperial**, **Chaos**, and **Xenos** — each shown with its label and
alliance icon. Exactly one track is selected at a time. The selected track SHALL
determine which owned characters and Machines of War every recommendation on the
page may draw on (see "Alliance restriction is applied first"). The selected
track SHALL persist, per browser, across navigating away from and back to the
Onslaught page and across a full page reload. On a first visit the selector
SHALL default to the Imperial track.

Assumptions:

- The three tracks correspond to the `Imperial`, `Chaos`, and `Xenos`
  alliances. The `Neutral` alliance has no Onslaught track and is never
  selectable.
- The track is stored per browser under an Onslaught-specific key, separate
  from the Arena and Salvage Run persisted controls.

#### Scenario: First visit defaults to the Imperial track

- **WHEN** a user opens the Onslaught page for the first time in a browser
- **THEN** the track selector shows the Imperial track selected

#### Scenario: Switching the track rebuilds every recommendation

- **WHEN** the player switches the selector from Imperial to Chaos
- **THEN** the Plan Team, the Random Team, and the shard recipient are all
  rebuilt from the player's owned Chaos characters and Machines of War, and no
  unit that is not a Chaos unit appears in any of them

#### Scenario: Track survives navigation and reload

- **WHEN** the player selects the Xenos track, navigates to another Dailies tab
  and back, then reloads the page
- **THEN** the Xenos track is still selected

### Requirement: Alliance restriction is applied first

For the selected track, the set of characters any team recommendation may use
SHALL be the player's owned characters whose alliance equals the track's
alliance, and the set of units the shard recipient may recommend SHALL be the
player's owned characters and Machines of War whose alliance equals the track's
alliance. The restriction SHALL be applied before project, goal, Onslaught-goal,
XP, or power prioritization, and before any candidate-pool widening — so that
widening the Plan Team's pool to "the full roster" still means only the track's
alliance. A unit of another alliance SHALL never appear in the Plan Team, the
Random Team, or as the shard recipient, including when a Preferred trait or
Preferred damage type is set.

#### Scenario: Off-alliance goal contributor is excluded

- **WHEN** the selected track is Imperial and the player has an active goal
  targeting an owned Chaos character
- **THEN** that Chaos character does not appear in the Imperial track's Plan
  Team even though it is a goal contributor

#### Scenario: Widening stays within the alliance

- **WHEN** the selected track's alliance has only two owned goal contributors
  but eight owned characters overall
- **THEN** the Plan Team pool widens to the track's other owned characters and
  never to a character of another alliance

#### Scenario: Preference never escapes the alliance

- **WHEN** a Preferred trait is set that only off-alliance characters have
- **THEN** the teams are drawn from the track's alliance as if no preference
  were set, and no off-alliance character is added

#### Scenario: Machines of War never enter the battle team

- **WHEN** the player owns a Machine of War of the selected track's alliance
- **THEN** it never appears in the Plan Team or the Random Team, and is
  considered only for the shard recipient

### Requirement: Onslaught-farming Ascension goals lead the Plan Team

The shared engine SHALL be configured with a **highest-priority candidate
pool**, ranked ahead of the active-project pool and the overall-goals pool, of
the owned characters of the track's alliance that are the target of an
**Onslaught-farming Ascension goal**. An Onslaught-farming Ascension goal is a
goal that: has status Active; targets a Character (Machine of War targets feed
the shard recipient only, never the battle team); has goal type Ascension; lists
**Onslaught** among its configured shard farming (acquisition) sources; and still
has outstanding shards toward its target rarity. A Plan Team member chosen from
this pool SHALL show an "Onslaught Ascend goal" selection reason. The pool SHALL
compose with the shared engine's pool-widening, XP / Power ordering, minimum
size, and broadened-note rules exactly as any other priority pool does.

Assumptions:

- As with every priority pool, the pool changes the Plan Team's XP-mode ranking
  and seeds pool widening; Power mode still ranks the widened candidate set by
  combat power, so the Onslaught-goal characters lead the Plan Team only when
  their power ranks them there.
- "Outstanding shards" is the goal's net remaining regular-plus-mythic shard
  count derived from the shared ascension-cost data; a goal whose target rarity
  is already reached contributes nothing to the pool.

#### Scenario: Onslaught-goal character leads the XP-mode Plan Team

- **WHEN** XP Mode is active and an owned Imperial character is the target of an
  active Ascension goal that farms Onslaught and still needs shards
- **THEN** that character is placed in the Imperial Plan Team ahead of
  active-project and overall-goal contributors, with the "Onslaught Ascend
  goal" reason

#### Scenario: Completed Onslaught goal does not lead the team

- **WHEN** an Ascension goal that farms Onslaught has already reached its target
  rarity
- **THEN** its character is not added to the Plan Team by the Onslaught-goal
  pool (it may still be chosen by a lower-priority pool or by strength)

#### Scenario: Onslaught-goal pool widens like any other

- **WHEN** the Onslaught-goal pool holds only one owned character of the track
- **THEN** the Plan Team widens through the active-project, overall-goals, and
  full-roster pools to reach the requested size and is marked broadened

### Requirement: Recommended team categories and shared engine behaviour

For the selected track the page SHALL present a **Plan Team** and a **Random
Team**, each as its own labeled section, built by the shared
`dailies-team-recommendations` engine configured with the track-restricted
character roster and three priority pools, highest first: the Onslaught-farming
Ascension-goal characters, then the selected project's owned contributing
characters, then all active goals' owned contributing characters, then
(implicitly) the track's full owned roster. The Plan Team's minimum size, pool
widening and broadened note, the XP Mode and Power Mode ordering, the Random
Team draw, Regenerate, and per-character locks SHALL behave exactly as specified
for that shared engine.

#### Scenario: Both categories render for a populated track

- **WHEN** the player owns at least three characters of the selected track's
  alliance
- **THEN** the Plan Team and Random Team sections are each shown, drawn only
  from that alliance

#### Scenario: Plan Team widens within the track and is marked broadened

- **WHEN** the Onslaught-goal and project pools together contribute only one
  owned character of the track's alliance, but the alliance has five owned
  characters overall
- **THEN** the Plan Team is filled from the track's alliance and the section
  shows it was broadened beyond its primary pool

### Requirement: Shared mode, size, and preference controls

The page SHALL provide the same page-level controls as the Salvage Run page: one
XP / Power mode toggle (default XP), the shared Dailies project selector, a Team
size radio group (3 / 4 / 5, default 5), and the Preferred trait and Preferred
damage type single-selects (default "Any", options limited to the values present
across the **selected track's** owned characters). The mode, team size, and
preference selections SHALL persist per browser under Onslaught keys,
independent of the Arena and Salvage Run pages. The project selection is the
shared Dailies selection and is not persisted. All of these controls SHALL
appear in the page header in the same form at every viewport.

#### Scenario: Preference options follow the selected track

- **WHEN** the player switches from a track whose characters cover trait X to a
  track whose characters do not
- **THEN** trait X is no longer offered by the Preferred trait control

#### Scenario: Mode and size persist independently of Arena and Salvage Run

- **WHEN** the player sets Power Mode and team size 3 on the Onslaught page,
  then opens the Arena or Salvage Run page
- **THEN** that page still shows its own persisted mode and size, unchanged by
  the Onslaught selections

#### Scenario: Onslaught controls survive reload

- **WHEN** the player sets Power Mode on the Onslaught page and reloads
- **THEN** Power Mode is still selected

### Requirement: Post-battle shard recipient recommendation

For the selected track the page SHALL show a **post-battle shard recipient**
panel, computed independently of the team engine. The candidate set SHALL be the
player's owned characters and Machines of War that: belong to the track's
alliance; are the target of an Active Ascension goal; list **Onslaught** among
that goal's configured shard farming sources; and can still receive shards
toward that goal's target rarity. When the candidate set is non-empty the panel
SHALL recommend the single top candidate, ranked by, in order: whether the
goal belongs to the currently selected project; the goal's priority within that
project; the goal's overall priority; the smaller remaining shard count; and any
user-defined farming priority when available. The panel SHALL display the
recommended unit's in-game name and unit type (character or Machine of War), its
current rarity, its target rarity, its current and required shard counts, its
remaining shards, the associated project and goal, and the reason it was chosen.
A recommended shard recipient need not be a member of the battle team. The panel
SHALL render even when the battle team is incomplete or the track is in the
insufficient-roster state.

Assumptions:

- "Required" is the total shards to cross from the unit's current rarity to the
  goal's target rarity; "current" is the shards the player already holds toward
  it; "remaining" is required minus current, always at least one for a
  candidate. Mythic-tier ascension is counted in mythic shards; both are folded
  into one remaining figure for ranking.
- "Overall priority" is the goal's position in the player's full goal list when
  the goal is not in the selected project; ties fall back to a stable goal
  identifier so the recommendation is deterministic.

#### Scenario: Top-ranked Onslaught goal is recommended

- **WHEN** the selected track has two eligible shard recipients and one belongs
  to the selected project while the other does not
- **THEN** the panel recommends the one in the selected project and shows its
  current / target rarity, current / required / remaining shards, its project
  and goal, and the reason

#### Scenario: A Machine of War can be the shard recipient

- **WHEN** the only eligible Onslaught-farming Ascension goal for the track
  targets a Machine of War
- **THEN** the panel recommends that Machine of War, labelled as a Machine of
  War, even though it is not in the battle team

#### Scenario: Recipient shown while the battle team is incomplete

- **WHEN** the track owns fewer than three characters but has an eligible
  Onslaught-farming Ascension goal
- **THEN** the insufficient-roster state is shown for the team and the shard
  recipient panel still recommends a unit

#### Scenario: No configured shard target

- **WHEN** the selected track has no Active Onslaught-farming Ascension goal
  with outstanding shards
- **THEN** the panel states that no shard target is configured for the track
  and does not recommend a unit

#### Scenario: Recipient is computed in Power Mode too

- **WHEN** Power Mode is selected
- **THEN** the shard recipient panel is still computed from the active
  Onslaught-farming Ascension goals

### Requirement: Insufficient roster for a track

When the player owns fewer than three characters of the selected track's
alliance, the page SHALL NOT render the team-category sections. Instead it SHALL
show a single per-track state that: lists the eligible owned characters of that
alliance (by in-game name and portrait, with rarity and rank), states that a
full team cannot be generated for the track, and shows how many more characters
of that alliance are required to reach a team of three. It SHALL NOT fill the
shortfall with characters of another alliance. The shard recipient panel SHALL
still be shown. Switching to a track with at least three owned characters SHALL
show the normal team sections.

#### Scenario: Track with too few owned characters

- **WHEN** the selected track's alliance has only two owned characters
- **THEN** the page shows those two characters, states a full team is not
  possible for this track, indicates that one more character of that alliance is
  needed, shows no Plan Team or Random Team section, and still shows the shard
  recipient panel

#### Scenario: Switching to a populated track recovers the normal view

- **WHEN** the player is on an under-populated track and switches to a track
  with four owned characters
- **THEN** the Plan Team and Random Team sections render for the new track

### Requirement: Distinct loading and failure states

The page SHALL present a distinct state for required data still loading and for
required data failing to load, the latter with a retry action. These are
whole-page states shown regardless of the selected track. The per-track
insufficient-roster state is separate from a load failure.

#### Scenario: Data is loading

- **WHEN** the roster, goals, project, goal details, character catalog, or
  shard-cost data has not finished loading
- **THEN** the page shows a loading state rather than empty or partial sections

#### Scenario: Data fails to load

- **WHEN** any of the data needed for recommendations fails to load
- **THEN** the page shows an explicit failure state with a retry action

### Requirement: Onslaught onboarding tour

The page SHALL register a Joyride onboarding tour covering the page purpose, the
track selector, the mode toggle, the project selector, the Team size control,
the preference controls, the Plan Team, the shard recipient panel, the Random
Team's locks, and its Regenerate control. The desktop and mobile tours SHALL
target the same elements.

#### Scenario: Tour is registered with the track and shard-recipient steps

- **WHEN** the Onslaught page mounts
- **THEN** an onboarding tour is registered whose steps include one anchored to
  the track selector and one anchored to the shard recipient panel, for both
  desktop and mobile
