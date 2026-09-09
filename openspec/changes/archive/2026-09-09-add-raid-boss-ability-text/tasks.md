## 1. Shared ability-text renderer

- [x] 1.1 Create the shared slice (`shared/ability-text` or
      `entities/ability-text`): port V1 `ability-text.ts` (token grammar parser,
      stat/damage/faction styling maps) and `ability-text-renderer.tsx` as
      `<AbilityText text variables constants level scaledVariableNames />`. Verify
      `pnpm lint:fsd` passes (no upward imports).
- [x] 1.2 Port V1 `ability-text.spec.ts` into the slice; verify `pnpm test:run`
      runs the ported cases green.
- [x] 1.3 Export the parser + component from the slice barrel; verify a
      `pnpm typecheck` from a scratch import in the raid-boss page resolves.

## 2. Ability/trait text data

- [x] 2.1 Extend `apps/web/scripts/generate-raid-boss-i18n.mjs` to emit, per
      raid-boss ability id, `{ description, variables, constants,
variablesAffectedByRarityBonus }` from the datamine ability data (en-only).
      Decide in-place enrichment of `raidBossAbilities.json` vs. a sibling
      `raidBossAbilityText.json` (design Open Question). Verify the script runs and
      the output validates as JSON.
- [x] 2.2 Do the same for raid-boss trait ids that have a variable/text table;
      verify output.
- [x] 2.3 Regenerate the en resource(s) and commit; verify
      `library-translations.test.ts` and any namespace resource-type still pass
      (update the resource type + resolver if the shape changed).
- [x] 2.4 Add an ability-id → `{ description, variables, constants }` resolver
      (in or beside `entities/raid-boss/lib/use-raid-boss-labels.ts`) plus
      `traitText(id)`; unit-test that a known ability id resolves and an unknown
      one yields `undefined`.

## 3. Detail wiring

- [x] 3.1 In `raid-boss-detail.tsx`, render `<AbilityText>` under each shown
      ability name in `AbilityGroup`, passing the resolved record and
      `step.abilityLevel` (clamped). No text block when the ability resolves to no
      description. Verify against `raid-bosses-page.test.tsx` (extend the fixture
      with one ability that has a level-scaled variable).
- [x] 3.2 Render trait rules-text next to the trait name where `traitText(id)`
      resolves; name-only otherwise. Verify with a fixture trait.
- [x] 3.3 Verify changing the progression dropdown updates the rendered ability
      numbers (test: select a later step, assert the interpolated value changes).

## 4. i18n (UI copy only)

- [x] 4.1 Add any new `library` namespace UI keys (e.g. a "values shown for
      level {{level}}" caption) to `en/library.json`; verify it renders.
- [x] 4.2 Author real de/es/fr translations for those keys at
      sibling-namespace quality; verify `library-translations.test.ts` and
      structural alignment pass. (Ability _description_ strings stay en-only.)

## 5. Gates

- [x] 5.1 Manual browser check on `/library/raid-bosses/<a boss with a
level-scaled ability>` at ≥768px and <768px: step the progression dropdown
      and confirm the ability text numbers track it, matching V1
      `learn/guildBossDetail` for the same boss/step. Start the Aspire stack if
      needed.
- [x] 5.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`,
      `git diff --check`; all green.
