# Tasks

## 1. Data and content

- [ ] 1.1 Add optional `synergies: string[]` to `hordeModeTiersSchema` (verify: `vitest run schemas`)
- [ ] 1.2 Create `hordeStrategy.json` (en) from `source-notes.md`: split each note into `strengths` and `howToUse`, add `relicAdvice` for the eight relic characters and the summon-rarity note for summoners; register the namespace
- [ ] 1.3 Translate to de, es and fr (verify: i18n key-parity test)

## 2. Tier List

- [ ] 2.1 Strategy disclosure in tile details with strengths, how to use, teammates and relic advice; tests for both spec scenarios (verify: `vitest run tier-list`)
- [ ] 2.2 Add the `tierList.strategy.*` strings in four locales
- [ ] 2.3 Add synergies to the `horde-mode-tiers` test fixture

## 3. Gates

- [ ] 3.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm format` and `git diff --check` pass

## 4. Manual verification (desktop ≥ 768px and mobile < 768px)

- [ ] 4.1 Angrax's Strategy section expands in the popover (desktop) and bottom sheet (mobile) with teammates linking to the Library
- [ ] 4.2 Severyn reviews the English text in the PR
