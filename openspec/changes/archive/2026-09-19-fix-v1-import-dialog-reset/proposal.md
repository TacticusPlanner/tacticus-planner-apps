## Why

After a completed V1 import, the import dialog's submit control looks
available but does nothing. The dialog clears the password field on success,
and its submit handler opens with a silent guard that returns when the
password is empty — so the button is enabled, the click registers, and
nothing happens: no progress indicator, no error, no new result.

Users report this as the import button becoming unresponsive. There is no way
to tell the dialog is waiting for credentials to be re-entered, and no
indication that the previous run finished.

## What Changes

- The dialog's submit control is never enabled while submitting would do
  nothing. Its disabled state reflects every condition the submit handler
  checks, so a click is either acted on or the control is visibly unavailable.
- Submitting is never a silent no-op. Any condition that prevents submission is
  communicated in the dialog rather than causing an early return.
- After a completed import, the dialog makes clear that the run finished and
  that re-running requires re-entering the password. Re-entering it returns the
  dialog to a submittable state.
- The password is still cleared after a completed import, and is still never
  retained across dialog closes.

No API change, no contract change.

## Capabilities

### New Capabilities

- `v1-profile-import`: the account-level dialog that imports selected parts of
  a V1 planner profile — credential entry, part selection, submission and
  resubmission behavior, and how each part's outcome is reported.

### Modified Capabilities

<!-- none -->

## Impact

- `apps/web/src/fsd/features/v1-import/ui/import-v1-dialog.tsx` — the submit
  guard, the submit control's disabled condition, and the post-run state.
- `apps/web/src/fsd/features/v1-import/ui/import-v1-dialog.test.tsx` —
  coverage for the resubmit path, which is currently untested.
- `apps/web/public/locales/{en,de,es,fr}/common.json` — copy for the
  re-enter-credentials state, in every supported locale.
- No companion `tacticus-planner-api` change.
- Relationship to other changes: `rewrite-v1-goal-import` (paired across both
  repos) reworks this same dialog's goal handling and outcome reporting, and
  modifies the `v1-profile-import` capability this change introduces. This
  change is deliberately narrow and independent so it can ship first; it does
  not touch goal submission.

The onboarding screen's separate V1 import form is **not** in scope. Its
post-submission behavior is already specified under `account-setup`, which
requires a non-completing outcome to return that form to a submittable state.
