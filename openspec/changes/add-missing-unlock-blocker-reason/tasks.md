## 1. Reproduce the wrong message

- [ ] 1.1 Add a failing unit test for the blocker derivation covering a Rank
      goal on a character absent from a loaded roster, asserting the produced
      reasons; verify it currently yields only the player-data-unavailable
      reason, documenting the defect
- [ ] 1.2 Add a failing test asserting a missing-Unlock reason is produced for
      the same input

## 2. Split the load-state guard

- [ ] 2.1 In the implicit-prerequisite module, split the combined
      readiness-and-roster early exit so "player data not loaded" and "loaded
      but unit absent" are distinguishable; verify existing prerequisite tests
      for owned units pass unchanged
- [ ] 2.2 Stop mapping an unowned unit's unknown attainment to the
      player-data-unavailable reason, keeping that reason for genuinely
      unloaded or failed player data; verify the test from 1.1 now shows the
      reason gone and the test from 2.3 still produces it

- [ ] 2.3 Add a test that unloaded player data still produces the
      player-data-unavailable reason for every goal

## 3. Add the reason

- [ ] 3.1 Add the missing-Unlock reason to the blocker reason union and to the
      aggregation that decides whether a goal is blocked; verify the test from
      1.2 passes
- [ ] 3.2 Exclude Unlock goals from reporting the reason for their own unit,
      and verify with a test
- [ ] 3.3 Suppress the reason when the plan contains a non-archived Unlock goal
      for the unit, reusing the covering-goal shape the Ascension and Level
      reasons already use; verify with tests for the covered and the
      archived-only cases
- [ ] 3.4 Add a test that a goal depending on an unreached Unlock goal reports
      the prerequisite-not-reached reason rather than the missing-Unlock reason

## 4. Remedy action

- [ ] 4.1 Extend the prerequisite-prefill mapping so the missing-Unlock reason
      yields a create-goal prefill for an Unlock goal on that unit; verify with
      a unit test on the mapping
- [ ] 4.2 Verify in the goal detail sheet that the reason renders its action,
      and that an existing Unlock goal in the plan routes to review rather than
      create — covered by a component test

## 5. i18n

- [ ] 5.1 Add the missing-Unlock reason message key alongside the existing
      goal-blocked reason keys in `apps/web/public/locales/en/common.json`,
      interpolating the unit name; verify it renders in the component test from
      4.2
- [ ] 5.2 Add real de, es, and fr translations of that key at the quality of
      the sibling reason messages already in those files; verify each locale
      file parses and contains no English fallback for the new key
- [ ] 5.3 Reword the player-data-unavailable message if its current wording
      implied the unowned case, in all four locales; verify by reading the
      message against its narrowed meaning

## 6. Verification

- [ ] 6.1 Run `pnpm test:run` and confirm the blocker, prefill, and goal-list
      suites pass
- [ ] 6.2 Start the stack from the workspace root through Aspire, wait for
      `web` and `api` to report healthy, sign in, and verify against a project
      containing a goal for an unowned character that the row shows the
      missing-Unlock reason and its create action — and that a project whose
      goals are all for owned characters shows no such reason
- [ ] 6.3 Repeat 6.2 at one viewport below 768px and one at or above 768px and
      confirm identical reason text and remedy action in the mobile card and
      the desktop row
- [ ] 6.4 No Joyride tutorial work applies: this change adds a reason to an
      existing indicator and does not add a page or materially change a page
      flow. Verified by confirming no new page route or step target is
      introduced

## 7. Repository gates

- [ ] 7.1 `pnpm test:run` passes
- [ ] 7.2 `pnpm typecheck` passes
- [ ] 7.3 `pnpm lint` passes
- [ ] 7.4 `pnpm lint:fsd` passes, confirming the change stays inside the goals
      page slice and introduces no cross-slice import
- [ ] 7.5 `git diff --check` reports no whitespace errors
