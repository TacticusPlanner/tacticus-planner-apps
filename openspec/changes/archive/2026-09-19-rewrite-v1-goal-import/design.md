## Context

See proposal.md — Why. See specs/v1-profile-import for the behavior contract.

What the dialog does today, and what goes:

```
  handleSubmit
    |
    +- POST me/v1-import                              KEEP
    |
    +- for each returned unit spec:                   DELETE
    |     resolveImportedGoalSnapshot(spec)             (server builds it)
    |     -> getPlayerCharacter / getPlayerMow
    |     -> buildCreateGoalSnapshot
    |
    +- Promise.allSettled( 19 x POST me/goals/combined )  DELETE
    |     created = fulfilled.length      <- counts UNITS
    |     skipped = response.goalsSkipped <- counts GOALS
    |     failed  = rejected.length       <- counts UNITS
    |     outcome.reason                  <- DISCARDED
    |
    +- invalidate goal + project queries              KEEP (unconditional)
```

The API change returns one outcome per source V1 goal, so the three
incommensurable numbers are replaced by a list the client groups. The
`ApiError` type already carries the parsed error body in a `details` field
that nothing reads — that is where a trace identifier lives when one exists.

## Goals / Non-Goals

**Goals:**

- Delete the client-side creation path entirely; the dialog reports, it does
  not orchestrate.
- Make every outcome legible without developer tools, and make a bug report a
  single click.
- Separate outcomes that need nothing from outcomes that lost information.
- Land the dependency edge the API's cap change requires.

**Non-Goals:**

- A preview-then-confirm step. The dialog still commits on submit.
- Letting the user choose which individual goals to import, or a target
  project.
- Changing how a created goal renders in the goals list, including its blocked
  indicator. Whether a correctly sequenced goal should read as calm rather than
  blocked is a separate presentational question, not decided here.
- Adding a new blocker reason. That is `add-missing-unlock-blocker-reason`.
- Changing the dialog's credential handling or resubmit behavior. That is
  `fix-v1-import-dialog-reset`, which this change builds on.

## Decisions

### Group in the client, from a flat server list

The API returns a flat, ordered outcome list with a status and a code per
entry. The client maps each code to one of the four buckets and renders them.

Rationale: the bucket boundaries are a presentation decision that will move —
a code that reads as benign today may deserve attention tomorrow — and moving
it should not be an API change. A flat list with stable codes is also what
makes the copy-details payload trivial to assemble.

_Alternative considered:_ have the API return pre-bucketed groups. Rejected:
it freezes a UI taxonomy into the contract and gives the client less to work
with, for no reduction in client code.

### Map codes to copy through an explicit lookup with a fallback

Outcome codes are mapped to i18n keys through an explicit object keyed by
code, with a generic fallback for an unrecognised code — the pattern the
onboarding form already uses for its three personal-key codes.

Rationale: an explicit map makes an unmapped code visible at review time
rather than at render time, and the fallback guarantees a new server code never
surfaces as raw snake_case. The alternative — deriving a key from the code
string — would silently produce missing-key output for anything new.

Every code the API can emit gets a real key, in all four locales, as part of
this change. There are none today, so a partial mapping would mean the report
shows raw codes for whatever was missed.

### Show unit and goal type from the outcome, never re-derive them

Each outcome carries its entity type, entity id and goal type. The report
renders the unit through the existing id-to-display-name resolution, and falls
back to the raw V1 identifier the outcome carries for an unknown-unit case —
which is the whole point of that case, since the raw string is what failed to
match.

Rationale: re-deriving the unit from the goal id would fail for exactly the
outcomes that most need naming (the ones where no goal exists).

### Copy details as plain text, assembled from what is already rendered

The copy action serialises the not-imported and failed buckets to plain text in
the user's locale, appending a trace identifier only where the failure carried
one. It is offered only when at least one of those buckets is non-empty.

Rationale: this is the whole of the trace-identifier complaint. The
identifier stops being the primary artefact and becomes a footnote inside a
payload that already says what went wrong. Plain text rather than JSON because
the destination is a bug tracker comment.

Note the identifier's limits, so the copy is not oversold: it is a per-request
value present only on genuinely unhandled failures, and it identifies a request
rather than a goal. The unit and reason in the same payload are the more useful
half.

### Derive the goals part status from the outcomes

The goals part row stops reflecting a server-side pre-submission decision and
instead reports what the outcomes show. A run where nothing was created does
not read as success.

### Declare the Ability-to-Ascension dependency in the spec builder

The builder currently wires the Ability goal to Unlock and Level but not to
Ascension, even though an above-cap ability target is one of the two things
that triggers the Ascension suggestion. The edge is added.

This is small but not cosmetic: the API's cap change lifts an ability target's
cap only from Ascension specs the goal declares a dependency on, so without
this edge the shipped manual flow stays refused. It rides here rather than in
its own change because it is a few lines in a file this change already touches,
and because the import path needs the same edge for the same reason.

_Alternative considered:_ have the API lift the cap from any Ascension spec
present in the request, needing no client change. Rejected in that change's
design — presence without a dependency does not guarantee the ascension is
scheduled first, so the target could be unreachable when the ability work runs.

## Risks / Trade-offs

- **The report is more information than three numbers, and could overwhelm.**
  → Mitigated by collapsing the benign bucket by default and omitting empty
  buckets: a clean import still shows one line. Only a lossy import expands.
- **Translating roughly thirty codes across four locales is the bulk of the
  work.** → Unavoidable and non-deferrable: without it the report renders raw
  codes, which is worse than the three numbers it replaces. The repository's
  i18n rule treats English left in a non-English locale file as unfinished, not
  deferred.
- **Bucket assignment is a judgement that will be revisited.** → Kept
  client-side precisely so revisiting it is a local change.
- **The dialog and the API response must ship together.** → They are a paired
  change with the same name; the API applies first and the two roll back
  together.
- **The copy payload contains unit identifiers and a trace identifier.** →
  Both are already visible to the user in the dialog; the action only saves
  transcription. It carries no credential and no account identifier.
- **Removing the client's snapshot resolution removes the only code path that
  used `buildCreateGoalSnapshot` outside the manual create flow.** → That
  builder stays; the manual flow still calls it. Verified by its remaining
  tests.

## Open Questions

None that affect the specs, the approach, or the task breakdown.
