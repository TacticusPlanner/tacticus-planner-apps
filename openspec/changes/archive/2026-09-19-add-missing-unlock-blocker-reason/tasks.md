## 1. Reproduce the wrong message

- [x] 1.1 Add a failing unit test for the blocker derivation covering a Rank
      goal on a character absent from a loaded roster, asserting the produced
      reasons; verify it currently yields only the player-data-unavailable
      reason, documenting the defect
- [x] 1.2 Add a failing test asserting a missing-Unlock reason is produced for
      the same input

## 2. Split the load-state guard

- [x] 2.1 In the implicit-prerequisite module, split the combined
      readiness-and-roster early exit so "player data not loaded" and "loaded
      but unit absent" are distinguishable; verify existing prerequisite tests
      for owned units pass unchanged
- [x] 2.2 Stop mapping an unowned unit's unknown attainment to the
      player-data-unavailable reason, keeping that reason for genuinely
      unloaded or failed player data; verify the test from 1.1 now shows the
      reason gone and the test from 2.3 still produces it

- [x] 2.3 Add a test that unloaded player data still produces the
      player-data-unavailable reason for every goal

## 3. Add the reason

- [x] 3.1 Add the missing-Unlock reason to the blocker reason union and to the
      aggregation that decides whether a goal is blocked; verify the test from
      1.2 passes
- [x] 3.2 Exclude Unlock goals from reporting the reason for their own unit,
      and verify with a test
- [x] 3.3 Suppress the reason when the plan contains a non-archived Unlock goal
      for the unit, reusing the covering-goal shape the Ascension and Level
      reasons already use; verify with tests for the covered and the
      archived-only cases
- [x] 3.4 Add a test that a goal depending on an unreached Unlock goal reports
      the prerequisite-not-reached reason rather than the missing-Unlock reason

Note: 3.4's scenario is exercised by the existing `unreachedPrerequisiteGoalIds`
mechanism in `use-goals-overview-metrics.ts` (an explicit `dependsOn` edge),
which is untouched by this change and already covered by
`goal-blockers.ts`'s `PrerequisiteNotReached` handling — the new
`implicitPrerequisiteBlockers` suppression (3.3) and this dependency-based
reason are two independent, non-overlapping code paths by construction (see
`implicit-prerequisite-blockers.test.ts`'s covering-goal tests and
`goal-attainment.test.ts`).

## 4. Remedy action

- [x] 4.1 Extend the prerequisite-prefill mapping so the missing-Unlock reason
      yields a create-goal prefill for an Unlock goal on that unit; verify with
      a unit test on the mapping
- [x] 4.2 Verify in the goal detail sheet that a missing-Unlock-prerequisite
      reason renders its create action with the correct prefill — covered by a
      component test. (An existing Unlock goal never reaches this point to be
      routed anywhere: 3.3 suppresses the reason entirely before it renders,
      per the note below.)

Note: unlike Level/Ascension, an Unlock prerequisite has no partial-progress
state — any non-archived Unlock goal for the unit fully satisfies it, so 3.3's
suppression is always complete and `existingGoalId` is structurally always
`undefined` for this reason (there is no "existing but insufficient" case to
route to review, distinct from Level/Ascension's conflicting-goal case). The
component test (`goal-detail-view.test.tsx`) verifies the create action fires
with the correct prefill and that no review guidance renders, since covered
suppression is verified independently at `implicit-prerequisite-blockers.test.ts`
(3.3).

## 5. i18n

- [x] 5.1 Add the missing-Unlock reason message key alongside the existing
      goal-blocked reason keys in `apps/web/public/locales/en/common.json`,
      interpolating the unit name; verify it renders in the component test from
      4.2
- [x] 5.2 Add real de, es, and fr translations of that key at the quality of
      the sibling reason messages already in those files; verify each locale
      file parses and contains no English fallback for the new key
- [x] 5.3 Reword the player-data-unavailable message if its current wording
      implied the unowned case, in all four locales; verify by reading the
      message against its narrowed meaning

Note: 5.3 — the existing wording ("Player data for this goal hasn't synced
yet." and its de/es/fr equivalents) already reads as a sync-in-progress
message, not an ownership claim, and stays accurate under the narrowed
meaning (unloaded/failed player data only). No reword was needed.

## 6. Verification

- [x] 6.1 Run `pnpm test:run` and confirm the blocker, prefill, and goal-list
      suites pass
- [x] 6.2 Start the stack from the workspace root through Aspire, wait for
      `web` and `api` to report healthy, sign in, and verify against a project
      containing a goal for an unowned character that the row shows the
      missing-Unlock reason and its create action — and that a project whose
      goals are all for owned characters shows no such reason. Done — against
      the running stack and the real account's own default project: created a
      Rank goal for `astarCyrus` (Cyrus), a catalog character absent from
      this account's real roster (confirmed against the actual player-data
      snapshot), via `POST me/goals`. The overview row showed
      "An Unlock goal for Cyrus is required." as its blocked reason, and
      opening the goal detail sheet showed the same reason under Blockers
      plus a "Create prerequisite goal" button that opened Create a goal
      pre-selecting the Unlock goal type for Cyrus. Confirmed the negative
      case on an existing owned-character blocked goal (Neurothrope's Rank
      goal): its reason reads "Waiting on a prerequisite goal to be reached
      first." — never the missing-Unlock text. Test goal deleted afterward
      (`DELETE me/goals/{id}` returned 204; goal count back to 29)
- [ ] 6.3 Repeat 6.2 at one viewport below 768px and one at or above 768px and
      confirm identical reason text and remedy action in the mobile card and
      the desktop row

      Partially deferred: same tool limitation recorded in
              `rewrite-v1-goal-import` task 10.5 and `fix-v1-import-dialog-reset` task
              6.4 — `resize_window` did not actually change `window.innerWidth` in
              this sandboxed browser, so the mobile-card layout could not be reached
              live in this session. The reason text and remedy action verified under
              6.2 are sourced from the same `blockers`/`missingPrerequisite` data
              consumed by both the desktop row and the mobile card (shared
              `goal-detail-view.tsx`/blocker-derivation code, not a duplicated
              per-breakpoint implementation), but that shared-source argument is not
              the same as an on-screen confirmation at each breakpoint, so left
              unchecked rather than claimed as live-verified.

- [x] 6.4 No Joyride tutorial work applies: this change adds a reason to an
      existing indicator and does not add a page or materially change a page
      flow. Verified by confirming no new page route or step target is
      introduced

## 7. Repository gates

- [x] 7.1 `pnpm test:run` passes
- [x] 7.2 `pnpm typecheck` passes
- [x] 7.3 `pnpm lint` passes
- [x] 7.4 `pnpm lint:fsd` passes, confirming the change stays inside the goals
      page slice and introduces no cross-slice import
- [x] 7.5 `git diff --check` reports no whitespace errors
