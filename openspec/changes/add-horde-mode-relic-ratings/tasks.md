# Tasks

## 1. Data

- [ ] 1.1 Add optional `relics: { equipmentId, multiplier }[]` to `hordeModeTiersSchema` (verify: `vitest run schemas`)
- [ ] 1.2 Extend the shared horde tier lookup and `ClearEstimateConfig` with relic multipliers; make `unitHordeMultiplier` take the roster unit and pass it from every caller; tests from the clear-estimate worked examples (verify: `vitest run clear-estimate legendary-event`)

## 2. Tier List

- [ ] 2.1 Relic mark on tiles and relic rows in tile details; tests for both spec scenarios (verify: `vitest run tier-list`)
- [ ] 2.2 Add the relic strings in en, de, es and fr (verify: i18n key-parity test)
- [ ] 2.3 Add relic ratings to the `horde-mode-tiers` test fixture

## 3. Gates

- [ ] 3.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm format` and `git diff --check` pass

## 4. Manual verification (desktop ≥ 768px and mobile < 768px)

- [ ] 4.1 Re'vas's tile shows the relic mark; its details list the relic with multiplier and equipped state in the popover (desktop) and bottom sheet (mobile)
