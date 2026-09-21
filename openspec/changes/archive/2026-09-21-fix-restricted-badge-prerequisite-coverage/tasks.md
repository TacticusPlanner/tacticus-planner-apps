## 1. Implementation

- [x] 1.1 In `apps/web/src/fsd/pages/goals/ui/shared/status-badge.tsx`, widen `isOnlyRestrictedByPrerequisite` to treat `MissingLevelPrerequisite`, `MissingAscensionPrerequisite`, and `MissingUnlockPrerequisite` as "soft" reason kinds alongside `PrerequisiteNotReached` (e.g. check `reason.kind !== "PrerequisiteNotReached" && reason.kind !== "MissingLevelPrerequisite" && ...` is never true, or an equivalent `Set`/array `includes` check) — verify by reading the updated condition against all seven `BlockerReason` kinds in `goal-blockers.ts` and confirming exactly these four are covered.
- [x] 1.2 Update the function's local naming/comment if `isOnlyRestrictedByPrerequisite` or its surrounding doc comment in `status-badge.tsx` describes the old single-kind condition, so the code doesn't contradict its own comment — verify by re-reading the edited block.

## 2. Tests

- [x] 2.1 In `apps/web/src/fsd/pages/goals/ui/shared/status-badge.test.tsx`, add a case per new reason kind (`MissingLevelPrerequisite`, `MissingAscensionPrerequisite`, `MissingUnlockPrerequisite`) asserting `goal-restricted-indicator` renders and `goal-blocked-indicator` does not, mirroring the existing `PrerequisiteNotReached`-only case — verify with `pnpm --filter web test:run status-badge`.
- [x] 2.2 Add a case combining two different prerequisite-style reason kinds (e.g. `MissingUnlockPrerequisite` + `PrerequisiteNotReached`, no other reason) asserting it still renders `goal-restricted-indicator` — verify with the same test run.
- [x] 2.3 Confirm the existing "combined block reads Blocked" case (a prerequisite-style reason + `PlayerDataUnavailable`) still passes unchanged, since that behavior isn't changing — verify with the same test run.

## 3. Gates

- [x] 3.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all must pass before this change is considered done.
