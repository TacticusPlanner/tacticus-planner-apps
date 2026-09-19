## ADDED Requirements

### Requirement: A block caused solely by an unreached prerequisite presents as Restricted, not Blocked

When every reason a goal is shown as blocked is that a prerequisite goal in the plan has not yet reached its own target (the `PrerequisiteNotReached` reason, and no other), the goal's indicator SHALL present with the softer "Restricted" label and treatment rather than "Blocked" — this reflects a goal that is waiting on ordinary plan sequencing, not one that is stuck. When any other reason also applies, whether alone or combined with a prerequisite-not-reached reason, the indicator SHALL present as "Blocked".

This is a presentation distinction only: both "Restricted" and "Blocked" are the same underlying blocked state for every other purpose (filtering, tab placement, blocker-reason text, remedy actions) defined elsewhere in this capability.

#### Scenario: Prerequisite-only block reads Restricted

- **GIVEN** a goal whose only reported reason is that its prerequisite goal has not yet reached its own target
- **WHEN** the indicator renders
- **THEN** it shows "Restricted", not "Blocked"

#### Scenario: A non-prerequisite reason reads Blocked

- **GIVEN** a goal whose only reported reason is not a prerequisite-not-reached reason (for example, player data is unavailable)
- **WHEN** the indicator renders
- **THEN** it shows "Blocked", not "Restricted"

#### Scenario: A combined block reads Blocked

- **GIVEN** a goal reporting both a prerequisite-not-reached reason and another reason at the same time
- **WHEN** the indicator renders
- **THEN** it shows "Blocked", not "Restricted" — the softer label only applies when a prerequisite is the sole reason
