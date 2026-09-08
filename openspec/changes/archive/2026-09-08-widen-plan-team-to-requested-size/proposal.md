## Why

The shared Dailies team engine widens the Plan team's candidate pool only until
it holds **three** eligible characters, then stops — even when the player asked
for a team of five. A player whose selected project and active goals contribute
four eligible characters therefore gets a four-character Plan team with a
"widened" note and a "only 4 of the requested 5" shortfall, despite owning
dozens more eligible characters. The widening should chase the **requested team
size**, filling the last slots from the wider roster (ranked after the real
contributors) so the Plan team is full whenever the roster can fill it.

## What Changes

- The Plan team's candidate-pool widening in the shared
  `dailies-team-recommendations` engine widens while the candidate set holds
  fewer **eligible** characters than the **requested team size** (never fewer
  than the existing three-character minimum), instead of stopping at three.
- Higher-priority-pool members (selected project, then active goals) are still
  ranked ahead of characters pulled in only to reach the requested size — the
  widening changes how many candidates are considered, not their ordering.
- The mode rules are unchanged: XP Mode still never pads past three with
  XP-capped characters, and a requested size the full roster genuinely cannot
  fill with eligible characters still yields a smaller delivered team with the
  existing shortfall note.
- Applies everywhere the shared engine is used: the Arena page and the Salvage
  Run page (and Onslaught when it lands).

## Capabilities

### Modified Capabilities

- `dailies-team-recommendations`: the "Minimum team size and pool widening"
  requirement — widen to the requested size, not to the three-character minimum.
- `dailies-arena-recommendations`: the "Minimum team size and candidate-pool
  expansion" requirement — same change, stated for the Arena page.

## Impact

- **Code**: `apps/web/src/fsd/pages/dailies/model/team-eligibility.ts`
  (`expandCandidatePool` gains a `targetEligible` parameter, default the
  three-character minimum) and `team-recommendations.ts` (`buildPlanTeam` passes
  the requested size). No change to `arena-recommendations.ts`,
  `salvage-recommendations.ts`, the hooks, or the UI.
- **Tests**: new cases in `team-eligibility.test.ts`,
  `team-recommendations.test.ts`, and `arena-recommendations.test.ts` for the
  requested-size widening; existing cases are unaffected (they use size 3 or a
  roster already contained in the pools).
- No API, i18n, schema, or dependency changes.
