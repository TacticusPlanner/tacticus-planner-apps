## MODIFIED Requirements

### Requirement: A block caused solely by an unreached prerequisite presents as Restricted, not Blocked

When every reason a goal is shown as blocked is a prerequisite-style reason — `PrerequisiteNotReached`, `MissingLevelPrerequisite`, `MissingAscensionPrerequisite`, or `MissingUnlockPrerequisite`, in any combination — the goal's indicator SHALL present with the softer "Restricted" label and treatment rather than "Blocked" — this reflects a goal that is waiting on ordinary plan sequencing, not one that is stuck. When any other reason also applies, whether alone or combined with one or more prerequisite-style reasons, the indicator SHALL present as "Blocked".

This is a presentation distinction only: both "Restricted" and "Blocked" are the same underlying blocked state for every other purpose (filtering, tab placement, blocker-reason text, remedy actions) defined elsewhere in this capability.

#### Scenario: Prerequisite-only block reads Restricted

- **GIVEN** a goal whose only reported reason is that its prerequisite goal has not yet reached its own target
- **WHEN** the indicator renders
- **THEN** it shows "Restricted", not "Blocked"

#### Scenario: Missing-Level-prerequisite-only block reads Restricted

- **GIVEN** a goal whose only reported reason is a missing-Level-prerequisite reason
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
