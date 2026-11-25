## Why

The comparison's two ranged axes count melee-only characters as 0, so with 61 of 120 characters melee-only no shooter reads below 51%. Daras reads 53% on "Ranged damage vs infinite armour" while beating 2 of the 59 characters that shoot. Separately, floating-point noise makes some equal melee values count as lower than each other.

## What Changes

- Rank both ranged axes only among characters with a ranged attack. Daras reads 3% and 24% instead of 53% and 63%.
- Show "No ranged attack" instead of 0% on both ranged axes for a character without one.
- Add an info tooltip to both ranged axes saying that only characters with a ranged attack are compared.
- Round the damage values before comparing them, so equal values tie. This moves six characters' "Melee damage vs infinite armour" (Celestine, Burchard, Jaeger, Baldr, Tyrith, Vynn) by under one percentage point.
- Correct the tour step that says every stat is ranked among all characters.

The ranged axes differ from V1 on purpose. Health, Armour and melee populations, the reference and the treatment of real ties are unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `character-unit-details`: "Compared with other characters" changes the ranged population, the state for a character without a ranged attack, the tooltip, and how equal values are recognised.

## Impact

- `apps/web/src/fsd/pages/library`: `model/stat-radar.ts`, `ui/character-unit/stat-radar-card.tsx` and their tests.
- `library` locale namespace in en, de, es and fr, including the unit tour's comparison step.
- No API, catalog or dependency change; no companion `tacticus-planner-api` change.
