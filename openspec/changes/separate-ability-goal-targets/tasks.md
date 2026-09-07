## 1. Per-track target state

- [x] 1.1 In `model/goal-creation-form/use-ability-fields.ts`, replace the single
      `abilityTargetLevel` / `setAbilityTargetLevel` with `abilityActiveTarget` /
      `abilityPassiveTarget` and their setters; derive `abilityActiveEnd = max(activeStart,
abilityActiveTarget)` and `abilityPassiveEnd = max(passiveStart, abilityPassiveTarget)`.
      Verify a new `use-ability-fields.test.ts` covers: independent updates, `end = max(...)`,
      and reset.
- [x] 1.2 Make `defaultTargetLevel` per-track (next level up from that track's own current
      level, clamped to the max ability level) and have `prefillFrom(activeLevel, passiveLevel)`
      seed both targets. Verify via the same test file that prefilling a unit sets each target
      to its own current level + 1.
- [x] 1.3 In `model/goal-creation-form/use-create-goal-form.ts`, surface the two targets and
      setters from `abilityFields.state` and pass them through to the prerequisites, preview,
      and validation hooks. Verify `npm run tsc` passes with no `abilityTargetLevel` references
      remaining.

## 2. Ability card UI

- [x] 2.1 In `ui/create-goal/goal-type-fields.tsx` (`AbilityGoalFields`), render two target
      `Select`s (active/primary and passive/secondary) driven by the two targets/handlers.
      Verify the component renders two selects with `data-testid`
      `create-goal-ability-active-target` and `create-goal-ability-passive-target`.
- [x] 2.2 Build each select's option list as every integer from that track's current level
      through the maximum ability level (Mythic-tier cap), keeping rarity-tier section headers;
      the current level itself is selectable (means "leave this track alone"), levels below it
      are omitted; above-cap levels stay selectable. Verified in `create-goal-sheet.test.tsx`:
      the current level, an intermediate level (14), and an above-cap level (30) are all present
      and a below-current level (11) is not.
- [x] 2.3 Add a `maxAbilityLevel` accessor (or reuse the existing rarity-cap table's Mythic
      entry) as the single source of truth for the range ceiling. Verify it returns 60 in a
      unit test.
- [x] 2.4 In `ui/create-goal/goal-type-cards.tsx`, wire the two targets and handlers into
      `AbilityGoalFields`. Verify `create-goal-sheet.test.tsx` Ability flow still mounts.
- [x] 2.5 Label the two tracks by entity type — "Active"/"Passive" for Character,
      "Primary"/"Secondary" for MoW — in `AbilityGoalFields` and
      `ui/create-goal/unit-info-card.tsx`, for both current-level and target fields. Verify a
      test switching entity type between Character and MoW asserts the label pair changes and
      MoW never shows "Active"/"Passive".

## 3. i18n

- [x] 3.1 Add `goals.create.ability.*` keys for `activeTarget` / `passiveTarget` /
      `primaryTarget` / `secondaryTarget` and matching current-level labels (`primaryStart` /
      `secondaryStart`) across every `apps/web/public/locales/*/common.json`. Verify
      `npm test` locale-completeness checks (if any) pass and no `t(...)` call resolves to a
      missing key in the Ability tests.
- [x] 3.2 N/A — the create-goal tutorial (`create-goal-sheet.tutorial.tsx`) has a single step
      targeting `create-goal-acquisition-sources`; there is no Ability-target step to update and
      the spec adds no requirement for one. `create-goal-sheet.tutorial.test.tsx` still passes
      unchanged.

## 4. Above-cap prerequisite suggestions

- [x] 4.1 Add a `minProgressionForAbilityLevel(level)` helper (mirroring
      `minProgressionForRank`) that returns the lowest progression whose rarity ability cap is
  > = `level`. Verify a unit test maps 8→Common, 17→Uncommon, 35→Epic, 60→Mythic and a
  > mid-tier level to the enclosing tier.
- [x] 4.2 In `model/goal-creation-form/use-goal-prerequisites.ts`, extend `needsAscension`
      so it also fires when `max(abilityActiveEnd, abilityPassiveEnd)` exceeds the current
      progression's ability cap (take the higher of the rank-derived and ability-derived target
      progression); keep it null when an Ascension goal already covers that tier. Verify
      `use-goal-prerequisites.test.ts` gains cases: ability target above cap suggests Ascension;
      Ascension already enabled suppresses it; MoW path suggests Ascension only.
- [x] 4.3 Confirm `needsLevel` already derives from `max(abilityActiveEnd, abilityPassiveEnd)`
      and add a `use-goal-prerequisites.test.ts` case asserting an above-current ability target
      produces the expected Level suggestion for a Character and none for a MoW.
- [x] 4.4 Verify `goal-spec-builder.test.ts` still orders and links prepended
      Ascension/Level goals correctly ahead of the Ability goal for an above-cap target.

## 5. MoW dual-track cost

- [x] 5.1 In `features/goal-farming/lib/goal-requirements.ts` MoW `Ability` branch, replace
      the single-track selection (`primary = activeEnd > activeStart`) with logic that emits
      farming stages and resource needs for every track whose end exceeds its start, summing
      both when both advance. Verify a new `goal-requirements` test: both tracks advancing
      yields the union of both tracks' needs; one track advancing is unchanged.
- [x] 5.2 Verify `goal-need.ts` / MoW ability estimate consumers still produce a coherent
      day-by-day estimate for a both-tracks goal (no double-count of shared transitions, stage
      targets ordered). Cover with a `goal-need.test.ts` case.

## 6. Validation and regression

- [x] 6.1 Add `goal-validation.test.ts` cases for asymmetric ranges: active advances /
      passive static is valid; passive advances / active static is valid; neither advances is
      `abilityRange`.
- [x] 6.2 Update `create-goal-sheet.test.tsx` Ability section for the two-field UI: added
      "creates a Character Ability goal with independent active and passive targets" (per-track
      option range, selecting the passive current level to leave it static, submitted
      `activeEnd`/`passiveEnd`) and "auto-suggests Ascension and Level when a Character Ability
      target is above the current rarity cap".
- [x] 6.3 Run `npm run lint && npm run tsc && npm test` and confirm the full suite is green.
- [x] 6.4 Run `openspec validate separate-ability-goal-targets --strict` and confirm it
      passes.
