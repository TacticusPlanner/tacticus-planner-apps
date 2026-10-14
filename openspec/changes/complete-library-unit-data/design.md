## Context

See proposal.md for motivation. This change applies on `main`, where the Library unit pages (#205, #206) do not
exist yet; it delivers only what those pages and the NPC Library read, and leaves the page changes to
`complete-library-unit-pages`.

- Rules text for abilities resolves through `shared/ability-text` from the id-keyed `npcAbilityText`
  namespace (en/de/es/fr, 302 entries). The renderer already skips `{[S/…]}` tokens and tolerates
  trailing-space keys (`lookupTrimmed`), so V1 MoW text renders unchanged.
- The 302 entries came from a one-off port for the NPC Library with no committed script. Measured against
  V1 `develop` today, those entries follow one rule exactly (verified for all four locales): description =
  V1 description (English `text.currentLevelDescription`, else the locale's `ability_descriptions.json`
  entry) with `trim()`; `variables` = only the variables whose (trimmed) name appears as a token in the
  English description; `constants` = only the constants whose name appears as a token, plus every
  `damageProfile*`; `scaled` = V1's `variablesAffectedByRarityBonus` filtered to the kept variables.
- The only existing generator, `apps/web/scripts/generate-raid-boss-i18n.mjs`, is English-only and reads V1
  from the sibling checkout (`../../../../tacticusplanner`).
- `packages/game-catalog` syncs the served datasets listed in `servedDatasetKeys` into IndexedDB, validating
  each with a zod schema; `main`'s MoW schema has no `mythicAbility`.
- Companion: `complete-library-unit-data` in `tacticus-planner-api`. Shared contract: served `mows` records
  gain an optional `mythicAbility: { name }`; new served dataset `mythic-quests` (shape in the API change's
  `mythic-quests-dataset` spec). Optional fields are omitted, not null.

## Goals / Non-Goals

**Goals:**

- A generator that reproduces the current namespace byte-for-byte for the still-referenced ids (except two entries the earlier port broke) and adds
  every other catalog ability with complete V1 text.
- The client syncs, validates and exposes `mythic-quests` and `mows.mythicAbility`.
- Exact-case icons for named items and relic abilities, with a CI check for equipment.

**Non-Goals:**

- Any page change: MoW Mythic panel, relic panel, mythic quest card, the static `mythicQuests` namespace and
  task-text fixes are in `complete-library-unit-pages` (they live on the #205/#206 branches today).
- Rules text for the 8 ids with no V1 text (3 relics, 5 character abilities).
- Raid-boss text namespaces (separate generator, unchanged).

## Decisions

**D1: One generator, `apps/web/scripts/generate-ability-text-i18n.mjs`, run by hand with `node`.** Inputs, by
workspace-relative path from the script: `tacticus-planner-api/src/TacticusPlanner.GameCatalog/Data`
(`units/*.json` characters' `activeAbilityNames`/`passiveAbilityNames`, `mows[]` primary, secondary and
`mythicAbility` names; `npcs/*.json` `activeAbilities`/`passiveAbilities`; `equipment/*.json` `abilityId`)
and `tacticusplanner/src/fsd/4-entities/abilities/data/new-ability-data.json` plus
`5-shared/l10n/data/{de,es,fr}/ability_descriptions.json`. Output: the four `npcAbilityText.json` files,
keys sorted, 2-space indent, trailing newline. The entry rule is the one in Context, applied to every
referenced id whose English description resolves completely (spec `ability-rules-text`). It also checks
relic ability icons (spec `equipment-item-icons`), prints uncovered ids with reasons, and exits non-zero when
the uncovered set differs from its `KNOWN_GAPS` list (`Fidelity`, `LionHelmRelic`, `Thrydderghyre`,
`MasterfulTactician`, `PowerVomit`, `WaaaghEnergy`, `PrimeTestSubject`, `DiabolicRegeneration`, and the
NPC-only `BloodSurge`, `BossEndFightUndefeated`, `RepairEnthusiast`, `RunsAround`, `RunsAway`). Token names are
read with split indices stripped (`{[dmg[0]]}` → `dmg`) — the earlier port missed these and broke two entries —
and V1's "Coming soon!" placeholder is not rules text. Output goes through Prettier with the repo config, which
reproduces the committed files byte-for-byte.
_Alternative:_ extend `generate-raid-boss-i18n.mjs`. Rejected: different namespace, English-only, and its
own trait-constant logic. _Alternative:_ an `apps` package script wired into `pnpm build`. Rejected: CI has
no sibling checkouts; this is a refresh-time tool like the raid-boss one.

**D2: Id set = everything the catalog references (all NPC records, not only listable ones).** Simpler to
state and to keep correct on refresh than reproducing the NPC Library's list filter in a script. It adds 28
NPC-only entries the UI never shows today (about 8% of the file); the orphan `LionHelm` entry drops out.
_Alternative:_ keep the NPC subset as a frozen id list. Rejected: a new NPC in a refresh would silently get
no text.

**D3: Catalog client support.** Add `mythic-quests` to `servedDatasetKeys`, a zod schema for the served
shape named per the naming-conventions skill (storage-model tier), record/payload types, and a query
`getMythicQuestsByUnitId(): Map<unitId, quests>` following `getMowsById`. Rewards are a discriminated record
on `type` (`MythicShards`, `AscensionOrb`, `AbilityBadge`, `XpBook`, `Gold`, `Equipment`); an unknown `type`
fails schema validation, matching the server's closed set. The MoW schema gains an optional
`mythicAbility: { name }`. No UI consumes either in this change; `complete-library-unit-pages` switches the
pages to them.

**D4: Icons.** Rename four files with `git mv` (two-step via a temporary name on Windows' case-insensitive
filesystem): `ui_icon_item_R_Block_DaemonFleshPlate.png` → `…DaemonfleshPlate.png`,
`ui_icon_item_R_Crit_DW02AdvancedBurstCannon.png` → `…Dw02AdvancedBurstCannon.png`,
`ui_icon_ability2_DaemonFleshPlate.png` → `…DaemonfleshPlate.png`, `ui_icon_ability2_NetherrealmCasket.png` →
`…NetherRealmCasket.png`. Copy `ui_icon_ability2_Helspear.png` and `ui_icon_ability2_PhasalSubjugator.png`
from V1 `src/assets/images/snowprint_assets/abilities/`. Before renaming, grep for the old filenames
and update any reference. `I_Block_E005`/`I_Block_L005` stay on `EquipmentIcons.fallback`; record them in
`KNOWN_ISSUES.md`. A vitest next to the icon helpers reads the `equipmentItems` en keys, skips `_`-prefixed
placeholder names and the known gaps, and checks `readdirSync` of `public/game_catalog/equipment` for exact
names.

**D5: Tests for the namespace (apps CI).** Extend `npc-ability-text-translations.test.ts`: identical key sets
across the four locales, identical `variables`/`constants`/`scaled` per id across locales, 425 entries, every
description's tokens resolvable by the entry's own tables (the same rule the generator uses), and
spot-checks: `AmuletOfTheVoidwyrm` (10 levels), `WisdomOfTheAncients`, `ReanimationBeam`'s trailing-space
constants, German `DutyEternal` is German.

## Risks / Trade-offs

- [V1 `develop` moves on between now and apply; the reproduction of existing entries is measured today] → The first
  generator run diffs against the committed files; any change to an existing entry must be explained in the
  PR (a real game change), never accepted blindly.
- [28 NPC-only entries ship unused] → Small cost (namespace is lazy-loaded per page); simpler refresh.
- [The catalog stores `mythic-quests` with no consumer until the follow-up lands] → One extra small
  dataset download; it lets the follow-up change be UI-only.
- [Case-only renames on Windows] → Two-step `git mv`; the CI icon test runs on Linux and catches a miss.

## Migration Plan

API deploys first (adds data; old clients ignore it). Then this apps change: the client resyncs on the new
`SchemaVersion` and stores `mythic-quests`; nothing visible changes except more rules text on the NPC
Library and the fixed icons. Rollback of apps alone is safe.
