## ADDED Requirements

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

## REMOVED Requirements

### Requirement: A block caused solely by an unreached prerequisite presents as Restricted, not Blocked

**Reason**: Replaced by "A block caused solely by a sequencing prerequisite presents as Restricted, not Blocked" below, which drops the missing-Level prerequisite reason (and its scenario) because Level goals no longer exist.

**Migration**: Use the renamed requirement; the Restricted/Blocked rule is unchanged for the remaining prerequisite-style reasons.

## MODIFIED Requirements

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
