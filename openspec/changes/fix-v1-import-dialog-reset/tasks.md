## 1. Reproduce the inert control

- [x] 1.1 Add a failing test to the import dialog suite that completes one
      import, then activates the submit control again, asserting a second
      import request is issued; verify it currently fails with no second
      request and no visible change
- [x] 1.2 Add a failing test asserting the submit control is unavailable
      immediately after a completed run

## 2. Unify the submit predicate

- [x] 2.1 Introduce one `canSubmit` predicate covering trimmed username
      non-empty, password non-empty, at least one part selected, and not
      currently submitting; verify by unit-testing the predicate across those
      four conditions
- [x] 2.2 Drive the submit control's disabled state from that predicate and
      verify the test from 1.2 passes
- [x] 2.3 Reduce the handler's early return to a defensive assertion over the
      same predicate, so no reachable path completes the handler without
      starting an import; verify by review and by the test from 1.1 after 3.1
- [x] 2.4 Add tests that a whitespace-only username and an empty username each
      leave the control unavailable

Note: 2.1's "unit-testing the predicate across those four conditions" is
covered as component-level assertions on the rendered submit control's
disabled state (not a call), so it never drifts from what the control
actually shows — `import-v1-dialog.test.tsx`'s "keeps the submit control
unavailable..." tests exercise username, password, part-selection, and (via
"disables the submit control while a submission is in flight") the
submitting condition.

## 3. Post-run state

- [x] 3.1 After a completed run, show a line stating the run finished and that
      the password must be entered again to run another import; verify the
      test from 1.2 and a new assertion on that line
- [x] 3.2 Verify with a test that entering the password again makes the submit
      control available, and that submitting then shows progress and replaces
      the previous result
- [x] 3.3 Verify with a test that reopening the dialog after a run presents an
      empty password field

## 4. Failure path

- [x] 4.1 Add tests confirming the existing failure behavior matches the spec:
      no lingering progress indication, username preserved, dialog still open,
      and the control available again once a different password is entered. No
      implementation change is expected — if a test fails, fix the dialog

Note: the failure path needed no code change — the existing "shows an import
failure without refreshing account state" test was extended with the 4.1
assertions and passed unmodified. One correction to the task's literal
wording: the control is not merely "available again" after correcting the
password, it was already available immediately after the failure (the
password field is only cleared on a _completed_ run, not a failed one), so a
wrong password left in the field still satisfies `canSubmit`. The test
verifies the control is enabled from the moment the failure shows, and stays
enabled once the password is corrected.

## 5. i18n

- [x] 5.1 Add the post-run re-enter-password copy to the V1 import namespace in
      `apps/web/public/locales/en/common.json`; verify it renders in the test
      from 3.1
- [x] 5.2 Add real de, es, and fr translations of that key at the quality of
      the sibling keys already in the V1 import namespace; verify each locale
      file parses and carries no English fallback for the new key

## 6. Verification

- [x] 6.1 Run `pnpm test:run` and confirm the import dialog suite passes,
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

Deferred / out-of-session: 6.2, 6.3, and 6.4 require starting the Aspire
stack and driving the running app in a browser. Deferred pending the full
pipeline (this change, `add-missing-unlock-blocker-reason`, and the
`rewrite-v1-goal-import` change on both repos) being implemented, per the
user's request to batch all manual verification at the end.

- [x] 6.5 No Joyride tutorial work applies: this change alters a dialog's
      submit-state handling, not a page or a page flow, and introduces no new
      step target. Verified by confirming no new route or `data-testid` tour
      target is added

## 7. Repository gates

- [x] 7.1 `pnpm test:run` passes
- [x] 7.2 `pnpm typecheck` passes
- [x] 7.3 `pnpm lint` passes
- [x] 7.4 `pnpm lint:fsd` passes, confirming the change stays within the
      `features/v1-import` slice
- [x] 7.5 `git diff --check` reports no whitespace errors
