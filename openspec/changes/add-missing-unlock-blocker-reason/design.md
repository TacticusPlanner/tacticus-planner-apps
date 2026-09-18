## Context

See proposal.md — Why. The relevant current state is that two independent
code paths both treat "unit absent from roster" as "no information":

```
  computeGoalBlockers
    |
    +-- goal attainment
    |     Rank/Ascension/Ability branch:
    |       no playerCharacter -> UNKNOWN
    |         -> reason: PlayerDataUnavailable      <-- the false message
    |
    +-- implicit prerequisite blockers
          early exit: !ready || !playerUnit -> []   <-- silently contributes
                                                        nothing for an
                                                        unowned unit
```

So an unowned unit produces exactly one reason, and it is the wrong one. There
is no reason kind for a missing Unlock at all.

The existing prerequisite reasons (missing Ascension, missing Level) are
suppressed by scanning the account's non-archived goals for a goal whose target
_reaches_ the requirement — they do not consult dependency edges. That
suppression shape is the one the new reason follows.

## Goals / Non-Goals

**Goals:**

- Stop telling the user data has not synced when it has.
- Name the actual remedy (an Unlock goal) and offer it, consistently with the
  other prerequisite reasons.
- Keep the change confined to the blocker derivation; no new data, no new
  queries, no API work.

**Non-Goals:**

- Creating the Unlock goal automatically. Automatic prerequisite creation
  during import belongs to `rewrite-v1-goal-import`; here the user is offered
  the pre-filled sheet, exactly as the existing reasons do.
- Changing how a goal renders once it is properly sequenced. A goal depending
  on an unreached Unlock goal still shows as blocked on its prerequisite, and
  that stays.
- Softening or suppressing the blocked indicator for a sequenced plan. That is
  a separate presentational question and is deliberately not decided here.
- Touching the estimate-blocked reason or its indicator.

## Decisions

### Distinguish "not loaded" from "loaded and not present"

The reason derivation needs three states where it currently has two: player
data not loaded, loaded and the unit is present, loaded and the unit is
absent. The third is what produces the new reason, and separating it is what
lets the player-data-unavailable reason shrink back to its stated meaning.

The readiness signal already exists — the implicit-prerequisite detector
already tests it before its roster lookup — so the change is to split the
existing combined guard rather than to introduce a new load-state concept.

_Alternative considered:_ keep emitting player-data-unavailable and just
reword its message to cover both cases. Rejected: one message cannot state
both "wait for a sync" and "create an Unlock goal", and the two have different
remedies.

### Derive the new reason in the implicit-prerequisite module, not in attainment

The new reason is produced where the other prerequisite reasons are produced,
and attainment stops being the thing that speaks for an unowned unit. Goal
attainment keeps returning "unknown" for an unowned unit — that is accurate,
its target genuinely cannot be evaluated — but "unknown attainment" stops
being mapped to a player-data reason on its own.

Rationale: this keeps all three prerequisite reasons, their suppression rules,
and their prefill mapping in one module, so the next prerequisite kind has one
obvious home. It also means attainment's contract does not change.

### Suppress on a covering goal, matching the existing reasons

A non-archived Unlock goal for the unit suppresses the reason, regardless of
whether the blocked goal declares a dependency on it. This mirrors the
existing Ascension and Level suppression exactly.

Consequence, stated so it is not a surprise: a properly sequenced plan shows
the dependent goal as blocked on an _unreached prerequisite_ rather than on a
_missing_ one. The padlock does not disappear; its reason becomes accurate.
That is the intended outcome of this change and the limit of it.

_Alternative considered:_ suppress only when a dependency edge exists.
Rejected as inconsistent with the two existing reasons for no user-visible
benefit — a user who has an Unlock goal in the plan does not need to be told
one is missing, edge or not.

### One reason per unit-absence, not one per goal type

The reason does not vary by the dependent goal's type. A Rank, Ascension,
Ability, or Upgrade goal on an unowned unit all report the same
missing-Unlock reason with the same remedy. No per-type message.

## Risks / Trade-offs

- **The indicator still appears on imported plans, just with a truthful
  reason.** → Accepted and explicit in Non-Goals. If the desired outcome is a
  visually calm list for a correctly sequenced plan, that is a distinct
  presentational change and should be decided on its own merits.
- **Narrowing player-data-unavailable could hide a genuine sync problem for an
  unowned unit.** → It cannot: a genuine load failure fails for every unit, so
  the unavailable reason still fires on the owned ones and the page-level
  state still reports it. The narrowing only removes the case where the load
  succeeded.
- **A fourth reason lengthens the blocked tooltip when several apply.** → The
  spec already requires all applicable reasons be shown, and the unowned case
  usually suppresses the progression-derived ones anyway, since those cannot
  be evaluated without a roster entry.
- **`goal-blocker-reasons` is a new capability describing behavior that
  already partly exists.** → Deliberate: the reason taxonomy was never
  specified anywhere, so the delta writes down the existing reasons alongside
  the new one rather than leaving the capability half-described.

## Open Questions

None that affect the specs, the approach, or the task breakdown.
