# Tasks

## 1. Tier D

- [x] 1.1 Add `D: "border-chart-5 bg-chart-5/20"` to `TIER_TONES` in `tier-tone.ts`; test: D gets its own tone, an unknown tier still gets the untiered tone (verify: `vitest run tier-tone`)
- [x] 1.2 Render five loading skeleton rows in `tier-list-page.tsx`

## 2. Fixtures and tests

- [x] 2.1 Update `apps/web/src/test/fixtures/horde-mode-tiers.ts` to the revised dataset (5 tiers, 47 characters)
- [x] 2.2 Update Tier List tests to the spec scenarios (S worked example, tier D row, untiered count, Xenos filter, Kariyan details) and fix any other test that read the old seed values (verify: `vitest run tier-list legendary-event`)

## 3. Gates

- [x] 3.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm format` and `git diff --check` pass

## 4. Manual verification (desktop ≥ 768px and mobile < 768px)

- [ ] 4.1 The Tier List shows S to D in order, D in its own tone, then Untiered; a D badge on a team-picker tile uses the D tone
