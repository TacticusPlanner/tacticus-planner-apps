## 1. Implementation

- [x] 1.1 In `apps/web/src/fsd/pages/library/ui/character/character-lookup-controls.tsx`, change `startOptions` and `endOptions` to each offer the full rank ladder from index `0` through `maxIndex` (mirroring the progression Selects' comment/pattern just below), removing the `index < rankIndex(rankEnd)` / `index > rankIndex(rankStart)` pre-filters — verified by reading the updated options against `setDraftRange`'s (now-fixed) behavior in `use-lookup-selection.ts` to confirm every combination it can resolve is reachable from either Select.
- [x] 1.2 Update the comment above `startOptions`/`endOptions` (currently explains the old pre-filter rationale) to describe the new full-ladder behavior, matching the progression range comment's style — verified by re-reading the edited block.
- [x] 1.3 In `use-lookup-selection.ts`'s `setDraftRange`: add symmetric handling for the end-changed direction (auto-retreat "from" to "to − 1"), and fix both boundary cases per `design.md` — at the ceiling, pull "from" back one step instead of colliding "from"/"to" at the max rank; at the floor, push "to" forward one step instead of colliding at the first rank. Preserve the existing start-changed direction's "always advance to start + 1" behavior unchanged except at the ceiling. Verify by reading the updated function against every scenario in `specs/character-lookup-range-controls/spec.md`.

## 2. Tests

- [x] 2.1 In `character-lookup-controls.test.tsx`, add a mobile-mode (`isMobile: true`) test asserting the start `RankSelect`'s options include ranks at and above the current `rankEnd` (not just below it) — verify with `pnpm --filter web test:run character-lookup-controls`.
- [x] 2.2 Add the mirrored case for the end `RankSelect`: options include ranks at and below the current `rankStart` — verify with the same test run.
- [x] 2.3 Add a case asserting neither Select ever offers a rank beyond the current maximum reachable rank — verify with the same test run.
- [x] 2.4 `use-lookup-selection.test.tsx` already exists and already pins the start-changed direction ("auto-advances 'to' to 'from' + 1...", "leaves 'to' alone when it was set explicitly...") — those must keep passing unchanged. Add the missing coverage this change introduces: (a) lowering end below the current start auto-retreats start to end − 1; (b) raising start to the ladder's maximum resolves to `(secondToLastRank, lastRank)`, not `(lastRank, lastRank)`; (c) lowering end to the ladder's minimum resolves to `(firstRank, secondRank)`, not `(firstRank, firstRank)`. Verify with `pnpm --filter web test:run use-lookup-selection`.
- [x] 2.5 Run the existing `character-lookup-page.test.tsx` suite, including "renders the unit profile with movement, melee hits, and current/target Health for the default character" (the `LIB-01` regression guardrail — this change does not touch `unit-profile.tsx`, so this test's continued pass is the guardrail, not a new test) — verify with `pnpm --filter web test:run character-lookup-page`.

## 3. Gates

- [x] 3.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all must pass before this change is considered done.
