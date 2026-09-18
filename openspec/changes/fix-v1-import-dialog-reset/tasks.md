## 1. Reproduce the inert control

- [ ] 1.1 Add a failing test to the import dialog suite that completes one
      import, then activates the submit control again, asserting a second
      import request is issued; verify it currently fails with no second
      request and no visible change
- [ ] 1.2 Add a failing test asserting the submit control is unavailable
      immediately after a completed run

## 2. Unify the submit predicate

- [ ] 2.1 Introduce one `canSubmit` predicate covering trimmed username
      non-empty, password non-empty, at least one part selected, and not
      currently submitting; verify by unit-testing the predicate across those
      four conditions
- [ ] 2.2 Drive the submit control's disabled state from that predicate and
      verify the test from 1.2 passes
- [ ] 2.3 Reduce the handler's early return to a defensive assertion over the
      same predicate, so no reachable path completes the handler without
      starting an import; verify by review and by the test from 1.1 after 3.1
- [ ] 2.4 Add tests that a whitespace-only username and an empty username each
      leave the control unavailable

## 3. Post-run state

- [ ] 3.1 After a completed run, show a line stating the run finished and that
      the password must be entered again to run another import; verify the
      test from 1.2 and a new assertion on that line
- [ ] 3.2 Verify with a test that entering the password again makes the submit
      control available, and that submitting then shows progress and replaces
      the previous result
- [ ] 3.3 Verify with a test that reopening the dialog after a run presents an
      empty password field

## 4. Failure path

- [ ] 4.1 Add tests confirming the existing failure behavior matches the spec:
      no lingering progress indication, username preserved, dialog still open,
      and the control available again once a different password is entered. No
      implementation change is expected — if a test fails, fix the dialog

## 5. i18n

- [ ] 5.1 Add the post-run re-enter-password copy to the V1 import namespace in
      `apps/web/public/locales/en/common.json`; verify it renders in the test
      from 3.1
- [ ] 5.2 Add real de, es, and fr translations of that key at the quality of
      the sibling keys already in the V1 import namespace; verify each locale
      file parses and carries no English fallback for the new key

## 6. Verification

- [ ] 6.1 Run `pnpm test:run` and confirm the import dialog suite passes,
      including the new resubmit coverage
- [ ] 6.2 Start the stack from the workspace root through Aspire, wait for
      `web` and `api` to report healthy, sign in with an account that has a V1
      profile, run an import from the account menu, and verify the submit
      control is disabled with the stated reason afterwards and that
      re-entering the password runs a second import
- [ ] 6.3 Against the same stack, submit deliberately wrong V1 credentials and
      verify the failure is shown, the username is preserved, no progress
      indication remains, and correcting the password allows a retry
- [ ] 6.4 Repeat 6.2 at one viewport below 768px and one at or above 768px and
      confirm the dialog behaves identically
- [ ] 6.5 No Joyride tutorial work applies: this change alters a dialog's
      submit-state handling, not a page or a page flow, and introduces no new
      step target. Verified by confirming no new route or `data-testid` tour
      target is added

## 7. Repository gates

- [ ] 7.1 `pnpm test:run` passes
- [ ] 7.2 `pnpm typecheck` passes
- [ ] 7.3 `pnpm lint` passes
- [ ] 7.4 `pnpm lint:fsd` passes, confirming the change stays within the
      `features/v1-import` slice
- [ ] 7.5 `git diff --check` reports no whitespace errors
