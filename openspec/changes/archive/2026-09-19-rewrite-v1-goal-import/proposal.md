## Why

The V1 import dialog submits goals itself, one request per unit, in parallel —
and then reports three numbers that cannot be reconciled. "Created" and
"failed" count unit requests while "skipped" counts source V1 goals, so a user
who imported 5 goals across 4 units is told "4 created". Every per-request
failure reason is discarded, leaving a trace identifier in the browser's
network pane as the only diagnostic. The per-goal issue list the API already
returns has never been rendered at all.

The companion `tacticus-planner-api` change moves goal creation server-side and
replaces those numbers with one outcome per source V1 goal. This change
consumes that, deletes the client-side fan-out, and turns the result into a
report a user can act on and paste into a bug report.

It also carries a small fix the API's cap change depends on: the combined-spec
builder auto-suggests an Ascension prerequisite for an above-cap ability target
but never declares the ability goal's dependency on it, so the promised
sequence does not state the relationship the server now requires.

## What Changes

- **The dialog stops creating goals.** The client-side snapshot resolution and
  the parallel per-unit submission are removed; the import operation returns
  the goals already created.
- **The result becomes a bucketed report** over the per-source-goal outcomes:
  what was imported, what needed no import, what was not imported and needs
  attention, and what failed. Imported reports goals and units as two distinct
  numbers rather than conflating them.
- **Benign and lossy outcomes are presented differently.** Already-reached,
  already-exists and merged outcomes collapse into one expandable count;
  unknown-unit, unsupported-type and untranslatable-target outcomes are shown
  expanded, each naming the unit as it appeared in V1, the goal type, and the
  reason.
- **Every outcome code and status gets user-facing copy** in all supported
  locales. None has any today, so the report would otherwise render raw
  snake_case codes and untranslated server text.
- **A "copy details" action** puts the attention-needing and failed buckets on
  the clipboard as plain text, including a trace identifier only where one
  exists. This replaces reading a trace id out of developer tools.
- **Non-goal part outcomes show their reason**, not just a status word —
  including the case where a part reports success but did not import
  everything, which is currently invisible.
- **The goals part status reflects what happened**, rather than being decided
  before submission.
- **A "sync required" outcome is presented as a blocking explanation** with the
  remedy, since the API now refuses the goals part without player data.
- **An "add missing prerequisite goals" option** is added to the part
  selection, defaulting on, matching the manual create-goal flow's defaults.
- **The dialog's description is corrected.** It currently promises that
  matching V2 goal kinds "will be replaced" and that imported goals "will be
  paused" unconditionally. Neither is true: matching kinds are skipped, and a
  goal is paused only when the import's default project isn't the profile's
  active project.
- **The combined-spec builder declares the missing dependency**: an Ability
  goal whose target drove an Ascension suggestion now depends on that
  Ascension goal.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `v1-profile-import`: adds requirements for the bucketed outcome report,
  outcome classification and copy, the copy-details action, part-level reason
  reporting, the prerequisite option, and the corrected description; removes
  the requirement that the dialog submits goals itself.
- `goal-creation`: the auto-suggested Ascension prerequisite for an above-cap
  ability target must be declared as a dependency of the ability goal, not only
  ordered before it.

## Impact

- `apps/web/src/fsd/features/v1-import/ui/import-v1-dialog.tsx` — removes the
  snapshot resolution helper, the goal-creation mutation and the
  parallel-submission block; adds the bucketed report and the copy action.
- `apps/web/src/fsd/features/v1-import/ui/import-v1-dialog.test.tsx` — the
  goal-creation mocks go away; coverage moves to rendering outcomes.
- `apps/web/src/fsd/entities/account/api/account.api.ts` — the import response
  type: the goal specs, skipped count and issue list are replaced by the
  outcome list. Types are hand-written here; there is no client codegen.
- `apps/web/src/fsd/pages/goals/model/estimate/` — the combined-spec builder's
  dependency edges for an auto-suggested Ascension.
- `apps/web/public/locales/{en,de,es,fr}/common.json` — copy for every outcome
  code, every outcome status, the bucket headings, the copy action, the
  prerequisite option, and the corrected description.
- **Depends on** the `tacticus-planner-api` change of the same name for the
  response shape, and transitively on
  `fix-goal-ability-cap-effective-progression` for the server to accept the
  newly declared dependency. Apply the API side first.
- Builds on `fix-v1-import-dialog-reset`, which introduces the
  `v1-profile-import` capability and fixes the dialog's resubmit behavior.
  Apply that first; it is independent and much smaller.
