# goal-blocker-reasons Specification

## Purpose

Defines why a goal is shown as blocked: the reasons that can apply, how each
is derived from live player data and the plan's other goals, which of them a
covering goal suppresses, and how the user is told and offered a remedy.

## Requirements

### Requirement: Blocked is derived, never stored

A goal's blocked presentation SHALL be computed from the goal's targets, the
account's live player data, and the other goals in the plan. It SHALL NOT be a
stored flag or a goal status value. A goal SHALL be shown as blocked when at
least one reason applies, and SHALL show every applicable reason.

#### Scenario: Blocked presentation follows player progress without a write

- **GIVEN** a goal shown as blocked solely because its prerequisite is not yet reached
- **WHEN** the account's player data is refreshed and now satisfies that prerequisite
- **THEN** the goal is no longer shown as blocked, with no change to the goal itself

#### Scenario: Multiple reasons are all reported

- **GIVEN** a goal whose unit is not owned, and that also `dependsOn` a
  different goal that has not yet reached its own target (the unit-ownership
  and dependency-goal checks are independent of each other, unlike the
  progression-based reasons below, which only apply once the unit is owned)
- **WHEN** its blockers are computed
- **THEN** both the missing-Unlock-prerequisite reason and the
  prerequisite-not-reached reason are reported, not only the first

### Requirement: A goal for a unit that is not owned reports a missing Unlock prerequisite

When the account's player data has loaded and the target unit is absent from
the player's roster, a goal whose type requires the unit to exist SHALL report
a missing-Unlock-prerequisite reason. The reason SHALL name the unit and SHALL
state that an Unlock goal is required.

An Unlock goal SHALL NOT report this reason for its own unit.

#### Scenario: Rank goal on an unowned character

- **GIVEN** player data has loaded and the character is not in the roster
- **WHEN** a Rank goal for that character has its blockers computed
- **THEN** it reports a missing-Unlock-prerequisite reason

#### Scenario: Unlock goal is not blocked by its own prerequisite

- **GIVEN** player data has loaded and the character is not in the roster
- **WHEN** an Unlock goal for that character has its blockers computed
- **THEN** it does not report a missing-Unlock-prerequisite reason

#### Scenario: Owned unit reports nothing

- **GIVEN** player data has loaded and the character is in the roster
- **WHEN** a Rank goal for that character has its blockers computed
- **THEN** it reports no missing-Unlock-prerequisite reason

### Requirement: Player-data-unavailable means data is unavailable

The player-data-unavailable reason SHALL be reported only when the account's
player data has not loaded or could not be loaded. A loaded set of player data
that does not contain the target unit SHALL NOT produce this reason.

#### Scenario: Loaded roster without the unit does not claim a sync problem

- **GIVEN** player data has loaded and the character is not in the roster
- **WHEN** a Rank goal for that character has its blockers computed
- **THEN** it does not report a player-data-unavailable reason

#### Scenario: Unloaded player data still reports unavailable

- **GIVEN** the account's player data has not loaded
- **WHEN** a goal has its blockers computed
- **THEN** it reports a player-data-unavailable reason

### Requirement: A covering goal in the plan suppresses its prerequisite reason

A prerequisite reason SHALL be suppressed when the plan already contains a
non-archived goal that satisfies that prerequisite: an Unlock goal for the unit
suppresses the missing-Unlock reason; an Ascension goal whose target reaches
the required progression suppresses the missing-Ascension reason.

A goal that declares a dependency on a covering goal SHALL instead report that
its prerequisite is not yet reached, until that prerequisite is reached.

#### Scenario: Unlock goal in the plan suppresses the missing-Unlock reason

- **GIVEN** player data has loaded, the character is not in the roster, and the plan contains a
  non-archived Unlock goal for that character
- **WHEN** a Rank goal for that character has its blockers computed
- **THEN** it does not report a missing-Unlock-prerequisite reason

#### Scenario: Archived Unlock goal does not suppress

- **GIVEN** the plan's only Unlock goal for that character is archived
- **WHEN** a Rank goal for that character has its blockers computed
- **THEN** it reports a missing-Unlock-prerequisite reason

#### Scenario: A covered but unreached prerequisite still blocks

- **GIVEN** a Rank goal depending on an Unlock goal that is not yet reached
- **WHEN** its blockers are computed
- **THEN** it reports that its prerequisite is not yet reached

### Requirement: Every prerequisite reason offers a remedy

A prerequisite reason SHALL offer an action that opens goal creation
pre-filled for the goal that would satisfy it, for the same unit. When the plan
already contains that goal, the action SHALL instead open that existing goal
for review. The missing-Unlock reason SHALL pre-fill an Unlock goal.

#### Scenario: Missing Unlock offers to create an Unlock goal

- **GIVEN** a goal reporting a missing-Unlock-prerequisite reason
- **WHEN** the user invokes the reason's action
- **THEN** goal creation opens pre-filled for an Unlock goal on that unit

#### Scenario: Existing prerequisite offers review instead

- **GIVEN** a goal reporting that its prerequisite is not yet reached
- **WHEN** the user invokes the reason's action
- **THEN** the existing prerequisite goal is opened for review rather than a new goal being
  created

### Requirement: The blocked indicator is presented identically on desktop and mobile

The blocked indicator and its reason text SHALL carry the same content and the
same remedy action in the desktop goal table row and the mobile goal card.
This is a shared presentation, not two variants.

#### Scenario: Same reasons on both layouts

- **GIVEN** a goal reporting a missing-Unlock-prerequisite reason
- **WHEN** it is rendered at a viewport below the mobile breakpoint and at one at or above it
- **THEN** both show the blocked indicator, the same reason text, and the same remedy action

### Requirement: Routine leveling is not a restriction

A goal SHALL NOT show a Restricted or Blocked indicator solely because the character has not yet gained the levels intrinsic to a Rank or Ability target, and no missing-Level or Level-prerequisite reason SHALL exist. That level gap is shown as remaining progress on the goal (see `rank-level-progression`). Real independent blockers, including absent player data, missing Unlock, insufficient Ascension, and an unreached dependency, SHALL continue to appear under the existing blocker rules.

#### Scenario: Only routine level progress remains

- **GIVEN** Bellator's Rank target needs level 32 and Bellator is at level 31 with no other blocker
- **WHEN** the goal row renders
- **THEN** it shows remaining level/XP progress on the goal and no Restricted or Blocked indicator

#### Scenario: Ascension blocker remains visible

- **GIVEN** the same Rank target also exceeds Bellator's current rarity cap
- **WHEN** the goal row renders
- **THEN** the Ascension-related restriction still appears

### Requirement: A block caused solely by a sequencing prerequisite presents as Restricted, not Blocked

When every reason a goal is shown as blocked is a prerequisite-style reason — `PrerequisiteNotReached`, `MissingAscensionPrerequisite`, or `MissingUnlockPrerequisite`, in any combination — the goal's indicator SHALL present with the softer "Restricted" label and treatment rather than "Blocked" — this reflects a goal that is waiting on ordinary plan sequencing, not one that is stuck. When any other reason also applies, whether alone or combined with one or more prerequisite-style reasons, the indicator SHALL present as "Blocked".

This is a presentation distinction only: both "Restricted" and "Blocked" are the same underlying blocked state for every other purpose (filtering, tab placement, blocker-reason text, remedy actions) defined elsewhere in this capability.

#### Scenario: Prerequisite-only block reads Restricted

- **GIVEN** a goal whose only reported reason is that its prerequisite goal has not yet reached its own target
- **WHEN** the indicator renders
- **THEN** it shows "Restricted", not "Blocked"

#### Scenario: Missing-Ascension-prerequisite-only block reads Restricted

- **GIVEN** a goal whose only reported reason is a missing-Ascension-prerequisite reason
- **WHEN** the indicator renders
- **THEN** it shows "Restricted", not "Blocked"

#### Scenario: Missing-Unlock-prerequisite-only block reads Restricted

- **GIVEN** a goal whose only reported reason is a missing-Unlock-prerequisite reason
- **WHEN** the indicator renders
- **THEN** it shows "Restricted", not "Blocked"

#### Scenario: A mix of prerequisite-style reasons still reads Restricted

- **GIVEN** a goal reporting two different prerequisite-style reasons at the same time (for example, a missing-Unlock-prerequisite reason and an unreached `PrerequisiteNotReached` goal), and no other reason
- **WHEN** the indicator renders
- **THEN** it shows "Restricted", not "Blocked"

#### Scenario: A non-prerequisite reason reads Blocked

- **GIVEN** a goal whose only reported reason is not a prerequisite-style reason (for example, player data is unavailable)
- **WHEN** the indicator renders
- **THEN** it shows "Blocked", not "Restricted"

#### Scenario: A combined block reads Blocked

- **GIVEN** a goal reporting both a prerequisite-style reason and a non-prerequisite reason at the same time
- **WHEN** the indicator renders
- **THEN** it shows "Blocked", not "Restricted" — the softer label only applies when every reason is prerequisite-style

### Requirement: A prerequisite reason names the goal it waits on

A reason caused by an unreached prerequisite goal SHALL name that goal by its unit and goal kind (for example "Waiting on the Bellator Unlock goal to be reached first."). Two different unreached prerequisites SHALL appear as two separate lines. While a prerequisite goal's details are still loading, the reason SHALL fall back to the generic "waiting on a prerequisite goal" sentence.

#### Scenario: Named prerequisite

- **WHEN** a goal depends on an unreached Unlock goal for Bellator
- **THEN** its tooltip reads that it is waiting on the Bellator Unlock goal

#### Scenario: Two prerequisites

- **WHEN** a goal depends on two different unreached goals
- **THEN** its tooltip lists one named line for each

#### Scenario: Prerequisite still loading

- **WHEN** a prerequisite goal's details have not loaded yet
- **THEN** the reason shows the generic prerequisite sentence

### Requirement: The Restricted tooltip explains what Restricted means

The tooltip of the Restricted indicator SHALL start with a one-line explanation that the goal can only partly progress until the listed reasons are resolved, followed by those reasons. The Blocked indicator's tooltip SHALL NOT include this explanation.

#### Scenario: Restricted tooltip

- **WHEN** the user hovers or focuses a Restricted indicator
- **THEN** the tooltip starts with the Restricted explanation, followed by the reasons

#### Scenario: Blocked tooltip

- **WHEN** the user hovers or focuses a Blocked indicator
- **THEN** the tooltip lists the reasons without the Restricted explanation
