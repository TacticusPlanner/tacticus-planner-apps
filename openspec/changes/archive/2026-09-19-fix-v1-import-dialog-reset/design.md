## Context

See proposal.md — Why.

The dialog currently has two independent gates on submission and they
disagree:

```
  submit control disabled when:
      status === "submitting"  ||  no part selected

  submit handler returns early when:
      username blank  ||  password blank  ||  no part selected
                          ^^^^^^^^^^^^^^
                          not in the disabled condition
```

The password condition exists only in the handler. On success the dialog
clears the password, so the control stays enabled while the handler will now
always return early — an enabled control that does nothing. The username
condition has the same shape but is masked in practice by the input's own
`required` attribute; a whitespace-only username still slips through to the
silent return.

## Goals / Non-Goals

**Goals:**

- One source of truth for "can this be submitted", used by both the control's
  availability and the handler.
- No path where activating submit completes without either starting an import
  or being prevented.
- The post-run state explains itself instead of looking broken.

**Non-Goals:**

- Retaining the password to allow a one-click re-run. Clearing it is
  deliberate and stays.
- Changing goal submission, outcome counting, or the result report's content.
  All of that belongs to `rewrite-v1-goal-import`, which modifies this same
  capability.
- Touching the onboarding screen's separate V1 import form, whose
  post-submission behavior is already specified under `account-setup`.
- Auto-closing the dialog after a successful run.

## Decisions

### Derive the control's availability from the same predicate the handler uses

A single `canSubmit` predicate covers trimmed username non-empty, password
non-empty, at least one part selected, and not currently submitting. The submit
control's disabled state is its negation, and the handler's guard becomes a
defensive assertion rather than a behavioral branch.

Rationale: the bug is not the guard, it is that the guard's conditions and the
control's conditions were written separately and drifted. Sharing the predicate
makes the drift impossible rather than fixing this one instance of it.

_Alternative considered:_ remove the password from the handler's guard and
rely on the input's `required` attribute plus native form validation.
Rejected — native validation does not fire for a programmatically cleared
field the user has not touched, and it would still leave the control enabled
in the state users are reporting.

### Tell the user why submission is unavailable after a run

The post-run state gets an explicit line stating the run finished and the
password must be re-entered to run again, shown alongside the result. A
disabled control with no explanation is the same dead end as an inert enabled
one, just quieter.

_Alternative considered:_ keep the dialog silent and rely on the empty
password field as the cue. Rejected — the field being empty is exactly what
the user does not notice; that is the reported bug.

### Keep the failure path's existing behavior, and specify it

The failure path already clears the progress indication and preserves the
username. That is correct and currently unspecified, so the delta writes it
down. No code change expected there; the tasks verify it rather than
re-implement it.

## Risks / Trade-offs

- **A disabled submit control could read as a different kind of broken.** →
  Mitigated by the explanatory line; the combination of a visibly disabled
  control and a stated reason is unambiguous, where an enabled inert control is
  not.
- **Re-entering the password for a second run is friction.** → Accepted, and
  unchanged from today's intent. The alternative is holding a plaintext V1
  password in component state across runs, which the credential-handling
  requirement rules out.
- **The new capability describes behavior that mostly already exists.** →
  Deliberate. The dialog had no owning capability at all, so the delta records
  the credential handling, part selection, and failure behavior alongside the
  fix, giving `rewrite-v1-goal-import` something to modify rather than invent.

## Open Questions

None that affect the specs, the approach, or the task breakdown.
