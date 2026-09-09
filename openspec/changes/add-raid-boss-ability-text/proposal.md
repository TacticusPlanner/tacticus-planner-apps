## Why

The Raid Bosses library detail shows ability and trait **names** only. V1's
guild-boss detail renders each ability's rules-text with its level-scaled
variables filled in for the selected progression step, so a player can read what
the ability actually does at the level they are looking at. The
`raid-boss-library` spec scenario _"Ability text scales with the step"_ is unmet,
and the current spec explicitly defers this to `tacticus-planner-apps#122`.

This is the second of the three `#122` follow-ups (alongside
`add-raid-boss-modifier-math` and `add-raid-boss-portraits`). It is
self-contained: no API change, no dependency on the other two.

## What Changes

- Render ability rules-text in the detail's ability panel: each shown ability
  expands to its description with `{variable}` / `{constant}` tokens resolved to
  the value for the currently selected progression step (ability level).
- Reuse V1's ability-text renderer rather than re-inventing it: V1
  `3-features/character-details/ability-text.ts` + `ability-text-renderer.tsx`
  already parse the token grammar, index per-level variable arrays, and style
  stat tokens. Promote a V2 equivalent to a shared slice
  (`shared/ability-text` or an `entities/` slice) so the raid-boss detail and
  any future consumer use one implementation.
- Source ability descriptions and their variable/constant tables from the game
  catalog the same id-keyed way names are resolved today
  (`raidBossAbilities` namespace / catalog-derived data) — the served
  `raid-bosses` dataset still carries ids only.
- Traits: render trait rules-text where the catalog resolves it, same
  mechanism; a trait id that resolves to no text keeps showing the name only
  (matching today's behavior for `Boss` / `Hero`).
- i18n: any new UI copy (e.g. a "scales to level N" caption) in the `library`
  namespace with full de/es/fr parity. Ability description **strings**
  themselves stay en-only, like the existing `raidBossAbilities` namespace
  (i18next `fallbackLng: "en"`).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `raid-boss-library`: the "weapons, abilities, and traits resolved from ids"
  requirement drops its `#122` names-only caveat; a new requirement covers
  ability/trait rules-text with step-scaled variable interpolation and the
  no-text fallback.

## Impact

- New shared slice for the ability-text renderer + parser (ported from V1),
  with its own tests ported from V1 `ability-text.spec.ts`.
- `apps/web/src/fsd/pages/library/ui/raid-bosses/raid-boss-detail.tsx` — the
  `AbilityGroup` renders description text under each ability name, scaled to the
  selected step; trait rendering gains optional text.
- `entities/raid-boss/lib/use-raid-boss-labels.ts` — a resolver for an ability
  id → `{ description, variables, constants }` (catalog-derived), or a new
  helper alongside it.
- `apps/web/public/locales/{en,de,es,fr}/library.json` — any new caption keys.
- `apps/web/public/locales/en/raidBossAbilities.json` (and the generator
  `scripts/generate-raid-boss-i18n.mjs`) — extended to carry description text +
  variable tables if not already emitted.
- No API change; no dependency on the other `#122` changes.
