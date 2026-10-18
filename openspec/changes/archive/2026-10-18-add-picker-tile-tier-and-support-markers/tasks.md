# Tasks

## 1. Data

- [x] 1.1 Add `hordeTiers` to `ClearEstimateConfig`, built from the shared tier lookup; tests: a tiered character maps to its tier, a character whose tier is missing from the record has no entry (verify: `vitest run clear-estimate`)
- [x] 1.2 Move the tier tones to `entities/legendary-event` as `tierToneClass` and use them in `tier-row.tsx` (verify: `vitest run tier-list`)

## 2. Picker

- [x] 2.1 Add the top-left marker column (tier badge, then Healer / Mechanic icons) to picker tiles; tests: tiered healer shows both stacked in order, untiered mechanic shows only the trait, plain untiered unit shows none, locked unit still shows them (verify: `vitest run team-unit-picker`)
- [x] 2.2 Add `teams.picker.tier` ("Tier {{tier}}") in en, de, es and fr (verify: i18n key-parity test)

## 3. Gates

- [x] 3.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm format` and `git diff --check` pass

## 4. Manual verification (desktop ≥ 768px and mobile < 768px)

- [ ] 4.1 A tiered healer's tile shows the tier badge at the top-left with the healer icon below it, mirroring the reserve button, and does not cover the portrait
