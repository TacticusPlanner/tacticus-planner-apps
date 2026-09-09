## Context

See proposal.md — Why. V1 renders guild-boss ability text with two pieces:

- `3-features/character-details/ability-text.ts` + `ability-text-renderer.tsx` —
  the token grammar parser + React renderer (stat-token styling, damage-type
  colors, faction colors, icon substitution), already covered by
  `ability-text.spec.ts`.
- `4-entities/abilities/data/new-ability-data.json` (and
  `4-entities/traits/`) — the per-ability `{ description, variables:
Record<string, (string|number)[]>, constants, variablesAffectedByRarityBonus }`
  tables, bundled in the V1 app. `guild-boss-detail.tsx` indexes
  `variables[name][abilityLevel - 1]` for the selected step.

V2 already resolves raid-boss ability **names** through the `raidBossAbilities`
i18n namespace, generated from datamine data by
`apps/web/scripts/generate-raid-boss-i18n.mjs`. The served `raid-bosses` dataset
carries ability ids only — the id-only resolution rule is unchanged by this
change.

## Goals / Non-Goals

**Goals:**

- One shared ability-text renderer + parser in V2, ported from V1, reused by the
  raid-boss detail and available to future consumers (character lookup, etc.).
- Ability/trait text that tracks the progression dropdown with no extra control.
- Keep the raw-vs-resolved split: dataset = ids; text + variable tables =
  client-side game data keyed by id.

**Non-Goals:**

- Modifier-adjusted ability variables — that is `add-raid-boss-modifier-math`.
  This change renders text at the _unmodified_ step values. If both changes
  land, the modifier change can pass its `applyAbilityAdjustments` output into
  this renderer, but that wiring is out of scope here.
- Full icon/color fidelity is desirable but not required — a plain-text
  substitution that shows the right numbers satisfies the spec.
- Translating ability description strings (en-only, like the sibling
  id-keyed namespaces).

## Decisions

- **Port the renderer to a shared slice**, `shared/ability-text` (or
  `entities/ability-text` if it needs domain types), exposing
  `parseAbilityText(text)` and an `<AbilityText variables constants level />`
  component. Port `ability-text.spec.ts` alongside. Rationale: it is generic
  presentation logic with no raid-boss specifics; putting it in the raid-boss
  slice would force a cross-import the first time another page wants it.
- **Ability text + variable tables ride the existing i18n-style generation
  path.** Extend `generate-raid-boss-i18n.mjs` to emit, per raid-boss ability
  id, `{ description, variables, constants, variablesAffectedByRarityBonus }`
  into an en-only resource (either enriching `raidBossAbilities.json` entries
  from string to object, or a sibling `raidBossAbilityText.json`). The
  raid-boss detail's label hook resolves an ability id → that record.
  Rationale: mirrors how names already work; no API surface, no new served
  dataset, consistent with `fallbackLng: "en"`.
  Alternative — a new API-served `raid-boss-abilities` catalog dataset:
  heavier (raw dataset + denormalizer + manifest + companion change) and not
  warranted for data that is static per game version and already handled the
  bundled way for names. If the variable tables prove too bulky for the
  lazy-loaded namespace bundle, promoting them to an API dataset is a scoped
  follow-up, not a blocker.
- **Step → level indexing:** the detail already has the selected
  `statProgression` step; use `step.abilityLevel` (1-based) to index the
  variable arrays, clamped to the array bounds, exactly as V1 does.
- **Traits:** same renderer, fed from the trait variable table where the
  catalog has one; `use-raid-boss-labels.ts`'s `hasTraitName` gate is
  unchanged, a new `traitText(id)` returns text or `undefined`.

## Risks / Trade-offs

- [Ported parser diverges from V1 on an edge token] → Port
  `ability-text.spec.ts` verbatim and run it against the V2 parser; any diff
  is a port bug.
- [Enriched `raidBossAbilities.json` breaks the existing name lookup / the
  `library-translations` test] → If enriching in place, update the resolver
  and the structural test together in the same task; a sibling file avoids the
  shape change entirely.
- [Bundle size of the variable tables on the lazy-loaded namespace] → Measure
  after generation; if it regresses first-load of the page meaningfully, split
  into a separately-lazy resource or escalate to the API-dataset alternative.
- [Text references an icon/asset id V2 has no bundled image for] → Renderer
  degrades that token to its label text (V1 behavior).

## Migration Plan

Additive. New shared slice + extended generator output. Regenerate the en
resource in the same change. No data migration, no API ordering constraint.
Ship independently of the other two `#122` changes.

## Open Questions

- Enrich `raidBossAbilities.json` entries in place vs. a sibling
  `raidBossAbilityText.json` — decide during apply based on whether the
  in-place shape change ripples into other consumers of that namespace. Does
  not affect the spec or the task groups below.
