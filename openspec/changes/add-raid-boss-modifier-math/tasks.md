## 1. Ported modifier math

- [ ] 1.1 Add `entities/raid-boss/lib/modifier-math.ts` porting V1
      `guild-boss-modifiers.ts` pure helpers: `scaleModifierHpLost`,
      `buildModifierHpLostOptions`, `getActiveModifierDefinitions`,
      `computeStatAdjustments`, `applyStatAdjustment`,
      `computeAbilityVariableAdjustments`, `applyAbilityAdjustments`,
      `applyAbilityConstantAdjustments`, `getUnitRemovals`, `applyUnitRemovals`
      (omit V1's icon/portrait resolution). Verify `pnpm typecheck` passes.
- [ ] 1.2 Port the modifier cases from V1 `guild-boss.service.spec.ts` into
      `modifier-math.test.ts`; verify `pnpm test:run` runs them green with the
      same expected numbers as V1.
- [ ] 1.3 Add `buildAdjustedView(unit, encounter, step, hpLost)` to
      `encounters.ts` returning the canonical `{ hpLostPoints, stats[], abilities[],
enemies }` structure; unit-test that full-HP yields base == adjusted and a
      known modifier set yields the V1 numbers.
- [ ] 1.4 Re-export the new helpers and `buildAdjustedView` from
      `entities/raid-boss/index.ts`; verify `pnpm lint:fsd` passes.

## 2. Adjusted-stats UI

- [ ] 2.1 Add an adjusted-stats section to `raid-boss-detail.tsx` driven by
      `buildAdjustedView`: stat rows show `base → adjusted`, an abilities sub-panel
      shows each affected ability's recomputed variables, the enemy list shows
      removals with a note. Section hidden when there is no resolved encounter.
      Verify against the fixture in `raid-bosses-page.test.tsx`.
- [ ] 2.2 Desktop (`desktop/raid-bosses-desktop-page.tsx`): render one panel per
      fight side (per `Crystal` prime for a boss; single for a prime), each with an
      HP-lost slider bound to its own point; `data-testid="raid-boss-adjusted-stats"`.
      Verify the two panels render for a boss fixture with two `Crystal` encounters.
- [ ] 2.3 Mobile (`mobile/raid-bosses-mobile-page.tsx`): a single panel with an
      HP-lost stepper across `hpLostPoints` and a "show adjusted" toggle that swaps
      the stat cells inline. Verify with a mobile-render test (`useIsMobile` → true).
- [ ] 2.4 Thread the ephemeral HP-lost point(s) through
      `raid-bosses-page.tsx` + `raid-bosses-page.view-model.ts`, reset on entity
      change (mirror `stepIndex`). Verify selecting a different entity resets it.

## 3. Tour + i18n

- [ ] 3.1 Add an `adjustedStats` step to `raid-bosses.tutorial.tsx` for both
      desktop and mobile step sets, anchored to
      `[data-testid="raid-boss-adjusted-stats"]`. Verify the tutorial test asserts
      the step is present in each set and its target exists.
- [ ] 3.2 Add `tour.raidBosses.steps.adjustedStats.{title,content}` and the new
      `raidBosses.*` UI keys (`hpLostAt`, `baseColumn`, `adjustedColumn`,
      `enemyRemoved`, `adjustedStatsHeading`, scaled-to-HP label) to
      `apps/web/public/locales/en/library.json`; verify keys resolve in the page.
- [ ] 3.3 Author real de/es/fr translations for every key added in 3.2 in
      `apps/web/public/locales/{de,es,fr}/library.json`, at sibling-namespace
      quality; verify `library-translations.test.ts` and structural alignment pass.

## 4. Sync-failure state (folds here unless another #122 change ships first)

- [ ] 4.1 Add a distinct sync-failure branch to `raid-bosses-page.tsx` — an
      error state with a retry affordance — separate from loading / absent, matching
      the `raid-boss-library` "Loading, dataset-absent, and failure states are
      distinct" requirement. Verify a test that forces the catalog hook into a
      failure state renders the retry control and that retry re-invokes the query.
- [ ] 4.2 Add `raidBosses.syncFailed` / retry-label keys (en + de/es/fr) if not
      already present; verify translations test passes.

## 5. Gates

- [ ] 5.1 Manual browser check at ≥768px and <768px on
      `/library/raid-bosses/<a boss with Crystal encounters>`: move the HP-lost
      control, confirm stats/ability-variables/enemy counts update and match V1's
      `learn/guildBossDetail` for the same boss and HP-lost point. Start the Aspire
      stack if it is not already up.
- [ ] 5.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`,
      `git diff --check`; all green.
