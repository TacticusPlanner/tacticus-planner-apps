## 1. Progression step label parity

- [ ] 1.1 Add a pure helper that maps an entity's `statProgression` to per-step `{ rarityTierLabel, health }` — base rarity + running 1-based per-rarity index (mirrors V1 `progression-selector.tsx`). Page-local in `raid-boss-detail.tsx` unless an equivalent already exists on the `raid-boss` entity. Verify with a unit test over the Tervigon ladder asserting `Legendary 2` at the second Legendary step and `Mythic 5` at the last.
- [ ] 1.2 Add i18n key `raidBosses.progressionStepLabelled` to `en/library.json` with rarity tier name + stars + total health (e.g. `{{rarity}} {{tier}} · ★{{stars}} · {{health}} HP`); add full de/es/fr entries. Verify `pnpm --filter web test:run library-translations` passes and `pnpm --filter web typecheck` sees the key.
- [ ] 1.3 Render the new label in the progression `SelectItem` in `raid-boss-detail.tsx`, replacing `raidBosses.progressionStep`. Remove `progressionStep` from all four locale files if now unused. Verify `pnpm --filter web lint` (knip) is clean and the detail page's step dropdown shows `Legendary 2 · ★9 · 7,500,000 HP`-style options in the browser.

## 2. Shared HP-lost framing (percentage)

- [ ] 2.1 Add i18n key `raidBosses.hpLostPercent` → `{{hpLost}}% HP lost` to `en/library.json` + de/es/fr. Verify translations test + typecheck.
- [ ] 2.2 In `raid-boss-adjusted-stats.tsx`, label each `SelectItem` by position-derived percentage — `round(100 * k / (points.length - 1))` for `k ≥ 1`, `raidBosses.fullHp` for `0` — using `hpLostPercent`; keep `SelectItem value` as the absolute HP point so `onHpLostChange` / `buildAdjustedView` are unchanged. Verify a unit test asserts the option labels read `Full HP, 13% HP lost, … 100% HP lost` and match the Prime Modifiers panel's `atHpLost` output for the same schedule.
- [ ] 2.3 Remove the now-unused `raidBosses.hpLostAmount` key from `en/de/es/fr/library.json`. Verify `pnpm --filter web lint` (knip) is clean.

## 3. Full stat set in the adjusted-stats table

- [ ] 3.1 In `raid-boss-adjusted-stats.tsx`, rename `affectedRows` → `allRows`, drop the `touched.has(...)` filter, and prepend a `health` row (`base: step.health`). Untouched rows rely on `applyStatAdjustment` returning `base` unchanged. Keep the `hitsDelta`-gated hits row and the `nothingActive` short-circuit as-is.
- [ ] 3.2 Update `raid-boss-adjusted-stats.test.tsx`: at an HP-lost point with only a `dmg` modifier active, assert Health / Damage / Armor / Movement rows all render, Damage shows base ≠ adjusted, and the others show base === adjusted. Verify `pnpm --filter web test:run raid-boss-adjusted-stats` passes.

## 4. Gates and verification

- [ ] 4.1 Run `pnpm --filter web typecheck`, `pnpm --filter web lint`, `pnpm --filter web lint:fsd`, `pnpm --filter web test:run`, and `git diff --check`. All green (the pre-existing `dailies-layout` parallel-load flake aside).
- [ ] 4.2 Live check on the full Aspire stack at `/library/raid-bosses/GuildBoss1Boss1TyranTervigonLeviathan`: progression options show rarity tier + HP; the adjusted-stats selector and the Prime Modifiers panel use the same `% HP lost` wording; the adjusted table lists Health/Damage/Armor/Movement with base+adjusted at a mid HP-lost point. Compare against V1 `learn/guildBossDetail` for the same boss/step.
