## 1. Prerequisites from other changes

- [ ] 1.1 Confirm the `tacticus-planner-api` change of the same name is applied
      and its regenerated OpenAPI artifact exposes the per-source-goal outcome
      list, by reading the artifact
- [ ] 1.2 Confirm `fix-goal-ability-cap-effective-progression` is applied, so a
      declared Ascension dependency lifts an ability target's cap
- [ ] 1.3 Confirm `fix-v1-import-dialog-reset` is applied, so this change
      builds on the fixed resubmit behavior and the `v1-profile-import`
      capability it introduced

## 2. Response type

- [ ] 2.1 Replace the goal specs, skipped count and issue list in the import
      response type in `entities/account/api/account.api.ts` with the outcome
      list, matching the regenerated OpenAPI artifact field for field; verify
      with `pnpm typecheck`
- [ ] 2.2 Verify by review that the hand-written type names every outcome
      field the API returns, including the V1 unit identifier carried on an
      unknown-unit outcome

## 3. Remove the client-side creation path

- [ ] 3.1 Delete the snapshot-resolution helper from the import dialog and its
      now-unused imports; verify `pnpm typecheck` and `pnpm lint` pass
- [ ] 3.2 Delete the goal-creation mutation and the parallel submission block;
      verify with a test that a completed import issues no goal-creation
      request
- [ ] 3.3 Make the goal and project query invalidation unconditional on the
      goals part having been selected; verify with a test that goal views
      refresh after an import that created goals
- [ ] 3.4 Verify `buildCreateGoalSnapshot` is still used by the manual create
      flow and its tests still pass, confirming the deletion did not orphan it

## 4. Bucketed report

- [ ] 4.1 Group outcomes into the four buckets by code; verify with unit tests
      over a fixture containing at least one outcome per code
- [ ] 4.2 Report the imported bucket as distinct goal and unit counts; verify
      with a test using a fixture of five goals across four units that both
      numbers appear and no single ambiguous count does
- [ ] 4.3 Collapse the needed-no-import bucket by default and make it
      expandable; verify with a test that its members are listed only once
      expanded
- [ ] 4.4 Render the not-imported and failed buckets expanded when non-empty,
      each row naming the unit, the goal type and the reason; verify with tests
- [ ] 4.5 Omit empty buckets; verify with a test that an all-created import
      shows only the imported bucket
- [ ] 4.6 Show the V1 unit identifier from the outcome for an unknown-unit row,
      rather than resolving a display name that does not exist; verify with a
      test
- [ ] 4.7 Mark automatically added prerequisites in the imported bucket and name
      the goal each was added for; verify with a test
- [ ] 4.8 Use existing UI primitives (alert, accordion, badge, scroll area) for
      the report rather than introducing new components; verify by review that
      no new dependency is added

## 5. Part-level reporting

- [ ] 5.1 Show each reported part's reason alongside its status, including the
      qualification on a part that succeeded without importing everything;
      verify with tests for a qualified success and for a skipped part
- [ ] 5.2 Omit rows for parts the user did not select; verify with a test
- [ ] 5.3 Derive the goals part status from the outcomes so a run that created
      nothing does not read as success; verify with a test over an
      all-failed fixture
- [ ] 5.4 Present the sync-required refusal as a blocking explanation naming
      the remedy; verify with a test

## 6. Copy details

- [ ] 6.1 Add a copy action that serialises the not-imported and failed buckets
      to plain text in the active locale, including unit, goal type and reason
      per row; verify with a test asserting the clipboard payload contents
- [ ] 6.2 Append a trace identifier to a row only where the failure carried one,
      reading it from the error body the API client already parses; verify with
      a test for a failure with and without one
- [ ] 6.3 Offer the action only when at least one of those buckets is
      non-empty; verify with a test on an all-created fixture

## 7. Part selection and copy corrections

- [ ] 7.1 Add the add-missing-prerequisites option to the part selection,
      defaulting on, and send it with the import request; verify with tests for
      the default and for clearing it
- [ ] 7.2 Correct the dialog description so it no longer claims matching goals
      are replaced or that imported goals are paused; verify with a test
      asserting the corrected text renders

## 8. Ability-to-Ascension dependency

- [ ] 8.1 Declare the Ability goal's dependency on the auto-suggested Ascension
      goal in the combined-spec builder, for Characters and Machines of War;
      verify with unit tests on the emitted dependency edges
- [ ] 8.2 Verify against the running stack that a manual create-goal submission
      with an above-cap ability target and an accepted Ascension suggestion is
      now accepted rather than refused — the end-to-end check deferred from
      `fix-goal-ability-cap-effective-progression`

## 9. i18n

- [ ] 9.1 Add English copy for every outcome code and every outcome status the
      API can return, the four bucket headings, the copy action, the
      add-missing-prerequisites option, the automatically-added marker, and the
      sync-required explanation, in the V1 import namespace of
      `apps/web/public/locales/en/common.json`
- [ ] 9.2 Map codes to those keys through an explicit lookup with a generic
      fallback, following the onboarding form's pattern; verify with a test
      that an unrecognised code renders the fallback and never a raw code
- [ ] 9.3 Add real de, es and fr translations of every key from 9.1, at the
      quality of the sibling namespaces already in `apps/web/public/locales`;
      verify each locale file parses and carries no English fallback for any new
      key
- [ ] 9.4 Verify with a test rendering a fixture covering all four buckets that
      no machine-readable code string appears in the output in any supported
      locale

## 10. Verification

- [ ] 10.1 Rewrite the import dialog test suite: drop the goal-creation mocks,
      add coverage for rendering outcomes across all four buckets from stubbed
      responses; verify `pnpm test:run` passes
- [ ] 10.2 Start the stack from the workspace root through Aspire, wait for
      `web` and `api` to report healthy, and import a real V1 profile with goals
      against an account with synced player data; verify the report's goal count
      matches the goals actually present in the goals list
- [ ] 10.3 Against the same stack, import goals for an account with **no**
      synced player data and verify the sync-required explanation is shown and
      no goals appear
- [ ] 10.4 Against the same stack, import a profile containing a goal for a unit
      not in the catalog and verify the not-imported bucket names the V1
      identifier, then use the copy action and verify the clipboard text is
      pasteable into a bug report
- [ ] 10.5 Repeat 10.2 at one viewport below 768px and one at or above 768px and
      verify the report is legible and scrollable in both, with no horizontal
      page scroll
- [ ] 10.6 No Joyride tutorial work applies: the change alters a dialog's result
      presentation, not a page or a page flow, and adds no route or step target.
      Verified by confirming no new route or tour target is introduced

## 11. Repository gates

- [ ] 11.1 `pnpm test:run` passes
- [ ] 11.2 `pnpm typecheck` passes
- [ ] 11.3 `pnpm lint` passes
- [ ] 11.4 `pnpm lint:fsd` passes, confirming the report stays inside
      `features/v1-import` and the builder change inside the goals page slice,
      with no feature-to-feature or page-to-page import
- [ ] 11.5 `git diff --check` reports no whitespace errors

## 12. Deferred / out-of-session

- [ ] 12.1 Verification against a large real V1 profile (near V1's hundred-goal
      limit) needs a volunteer account from a reporter, to confirm the report
      stays legible at that size. Track as an issue and record the link here;
      do not check off 10.2 in its place
