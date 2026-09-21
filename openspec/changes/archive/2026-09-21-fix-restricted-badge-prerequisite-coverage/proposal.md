## Why

`goal-blocker-reasons`' softer "Restricted" presentation is currently
gated on the reason kind literally named `PrerequisiteNotReached`, but
three other reason kinds (`MissingLevelPrerequisite`,
`MissingAscensionPrerequisite`, `MissingUnlockPrerequisite`) are the same
kind of ordinary, self-resolving plan sequencing — they just haven't had a
prerequisite goal created yet, rather than pointing at one that exists but
hasn't reached its target. A goal blocked solely by one of these three
still renders the harder "Blocked" lock badge, which is the exact
conflation tester feedback (`TERM-05`) described: a normal prerequisite
reading like an error or dead end.

## What Changes

- Broaden the softer "Restricted" presentation in `goal-blocker-reasons`
  to also apply when every reported reason is one (or a mix) of
  `PrerequisiteNotReached`, `MissingLevelPrerequisite`,
  `MissingAscensionPrerequisite`, or `MissingUnlockPrerequisite` — not
  `PrerequisiteNotReached` alone.
- No change to which reasons are reported, their text, their remedy
  actions, or any other blocked-state semantics (filtering, tab placement)
  — this is a presentation-only widening of one existing condition.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `goal-blocker-reasons`: the "A block caused solely by an unreached
  prerequisite presents as Restricted, not Blocked" requirement's
  condition widens from the single `PrerequisiteNotReached` reason kind to
  all four prerequisite-style reason kinds.

## Impact

- `apps/web/src/fsd/pages/goals/ui/shared/status-badge.tsx` —
  `isOnlyRestrictedByPrerequisite`'s reason-kind check.
- `apps/web/src/fsd/pages/goals/ui/shared/status-badge.test.tsx` — add
  coverage for the three newly-included reason kinds and a mixed-kind
  case.
- No API changes, no new i18n keys (existing `restrictedLabel`/reason-text
  keys already cover all four kinds), no cross-repo companion change.
