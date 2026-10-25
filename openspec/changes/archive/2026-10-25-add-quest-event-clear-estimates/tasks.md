# Tasks

Apps only; no companion API change. Depends on `add-quest-event-tracker`, `add-quest-event-rewards` and `add-quest-event-teams`.

## 1. Model

- [x] 1.1 Implement battle power from NPCs (pickups excluded, unknown enemies) and verify with the two-group scenario and an index past the ladder
- [x] 1.2 Implement the two estimates (clear, margin, marginal, points, given-up objectives, same-team rule) and the shortfall with cap gains, and verify with the comfortable, marginal, trade-off, same-team and shortfall scenarios
- [x] 1.3 Implement `projectQuest` and verify the mixed scenario and that entered scores win
- [x] 1.4 Implement `calibrateQuestPowerRatio` and verify too-few, all-cleared and mixed samples

## 2. UI

- [x] 2.1 Add the row verdict, the estimate block in the detail (desktop) and bottom sheet (mobile), the projected lines in the summary and rewards card, the data states, a tour step and the copy in en, de, es and fr; verify with component, tutorial and i18n parity tests

## 3. Verification and gates

- [ ] 3.1 Desktop (1280px) and mobile (420px) with a synced account and Nubari: verdicts on all 17 battles, a marginal battle with its second estimate, the projection after entering a few scores
- [ ] 3.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`, all clean

## Workflow follow-up

- Archive this change in the PR before merge.

## Implementation notes

- 1.2: the points if cleared also leave out a `DamageType` objective no eligible unit can meet, as well as unreachable ones.
- 1.4: the unit test comparing Nubari's recorded powers with their NPC sums is not written: the test fixtures do not carry those NPCs. The shipped ratio stays 1.0 and every estimate is labelled uncalibrated.
- 3.1 was not run (needs the Aspire stack and a synced account).
- 3.2: as for the tracker, only `pnpm lint:fsd` is open.
