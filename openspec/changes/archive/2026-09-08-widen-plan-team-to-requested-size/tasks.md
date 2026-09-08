## 1. Engine change

- [x] 1.1 `pages/dailies/model/team-eligibility.ts`: add an optional
      `targetEligible?: number` to `expandCandidatePool`'s params; compute
      `target = Math.max(MIN_TEAM_SIZE, targetEligible ?? MIN_TEAM_SIZE)` and use
      it as the break threshold instead of the literal `MIN_TEAM_SIZE`.
- [x] 1.2 `pages/dailies/model/team-recommendations.ts`: in `buildPlanTeam`, pass
      `targetEligible: ctx.requestedSize` to `expandCandidatePool`.

## 2. Tests

- [x] 2.1 `team-eligibility.test.ts`: add a case that omitting `targetEligible`
      still stops at three, and a case that `targetEligible: 5` keeps widening
      past three eligible into the next pool / the full roster.
- [x] 2.2 `team-recommendations.test.ts`: add a case where the priority pools
      supply four eligible characters, the roster supplies more, `teamSize: 5`,
      and the Plan team is delivered with five — the four pool members first,
      then one roster filler — and `broadened` is true. Add a case confirming XP
      mode still stops at three when only two are XP-eligible even at
      `teamSize: 5`.
- [x] 2.3 `arena-recommendations.test.ts`: add a case where the selected project + goals contribute four owned characters, the roster holds more, and
      `teamSize: 5` yields a five-character Plan team with the contributors
      ranked first and the section marked broadened.
- [x] 2.4 Confirm the existing `team-eligibility.test.ts`,
      `team-recommendations.test.ts`, `arena-recommendations.test.ts`,
      `use-arena-recommendations.test.tsx`, and
      `use-salvage-recommendations.test.tsx` cases still pass unchanged.

## 3. Verification

- [x] 3.1 `pnpm --filter web exec vitest run src/fsd/pages/dailies` — green.
- [x] 3.2 `pnpm --filter web typecheck` — 0 errors.
- [x] 3.3 `pnpm --filter web lint` and `pnpm --filter web lint:fsd` — clean.
- [x] 3.4 `pnpm test:run` — full suite green; account for the added tests.
- [x] 3.5 `pnpm format` and `git diff --check` — clean.
- [x] 3.6 `openspec validate widen-plan-team-to-requested-size --strict` —
      passes.

## 4. Manual verification

- [x] 4.1 Against the running Aspire stack: on the Salvage Run Imperial track
      (project + goals supply four Imperial contributors, requested size 5), the
      Plan team now shows five characters — the four contributors plus one
      roster filler ranked last — with the "widened" note and no "only 4 of the
      requested 5" shortfall. Confirm the Arena page behaves the same for an
      equivalent project.
