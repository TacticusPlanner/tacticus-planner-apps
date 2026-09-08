# Design — widen the Plan team to the requested size

## Change

`expandCandidatePool` (`pages/dailies/model/team-eligibility.ts`) currently
breaks its widening loop as soon as `candidateIds.filter(isEligible).length >=
MIN_TEAM_SIZE`. Add an optional `targetEligible` param:

```ts
const target = Math.max(MIN_TEAM_SIZE, params.targetEligible ?? MIN_TEAM_SIZE)
// ...
if (candidateIds.filter(params.isEligible).length >= target) break
```

`buildPlanTeam` (`team-recommendations.ts`) passes `targetEligible:
ctx.requestedSize`. Nothing else changes:

- `orderCandidates` already ranks eligible-before-ineligible, then (XP mode)
  by pool rank, then combat power, then id — so contributors keep the top slots
  and the widening only adds lower-ranked fillers.
- The `sizeCeiling` / XP-capped-padding logic in `buildPlanTeam` is unchanged,
  so XP mode still never pads past three with capped characters and a genuinely
  short roster still delivers fewer than requested.
- `broadened` / `poolUsed` still derive from whether a character outside the
  primary pool was pulled in — unchanged.
- `buildRandomTeam` does not use `expandCandidatePool`; untouched.

Default of `MIN_TEAM_SIZE` keeps `expandCandidatePool`'s own unit tests (which
omit the param) meaningful for the minimum-size case.

## Why the default stays `MIN_TEAM_SIZE`

`expandCandidatePool` is only called from `buildPlanTeam`, which always passes
the requested size. The default exists purely so the function is still
well-defined and testable in isolation; production always drives it with the
page's Team size control (3–5).

## Behaviour delta

Only visible when the requested size is above three **and** the priority pools
supply between three and (requested − 1) eligible characters **and** the wider
roster supplies more. Then the Plan team gains roster fillers (ranked last) to
reach the requested size, instead of stopping short with a "fewer than
requested" note. Every other case is byte-for-byte identical.
