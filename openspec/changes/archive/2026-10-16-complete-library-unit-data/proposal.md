## Why

Issue [#204](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/204): the Library unit pages
(#205, #206) show "Rules text isn't in the planner yet." for almost every relic (34 of 35) and every Machine of
War ability (22 of 22), the MoW Mythic panel has no ability to show, mythic quests come from a static English
copy, and four named items have no icon on a case-sensitive host. Exploration showed the text is not missing at
the source: V1's ability table holds complete, localized rules text for all 35 relics, all 22 MoW
abilities and all 11 MoW mythic abilities. V2 only ported the abilities NPCs use, with a one-off port nobody can
re-run.

This change is the part of #204 that lands on `main` independently of the unit-page PRs (#205, #206): the
data, the catalog client support and the icons. The page changes that consume them are the follow-up change
**`complete-library-unit-pages`**, applied once #205 and #206 are on `main`.

## What Changes

- Add a committed, re-runnable generator for the `npcAbilityText` namespace (en, de, es, fr) that covers every
  ability id the catalog references (NPC, character, relic, MoW primary/secondary/mythic) from V1's ability
  table and localized descriptions. Regenerating adds 34 relics (Maugetar is already there), 22 MoW and 11 MoW
  mythic abilities, 37 character abilities that the NPC-only port also missed (for example Lucius's
  `ArmourOfShriekingSouls`), and 29 abilities of NPC records outside the NPC Library's list; 297 of the 302
  existing entries stay byte-identical (`DarkTalonStrike` and `Foehammer` take V1 `develop`'s newer values), two the earlier port broke (split-index `dmg`) are fixed, and the orphan `LionHelm` drops out.
- `@workspace/game-catalog`: sync and store the new served dataset `mythic-quests`, add `mythicAbility` to the
  MoW schema, and expose both through queries.
- Item icons: rename four assets whose filename case differs from the catalog id, copy two relic ability icons
  from V1; the two Power Field items with no asset anywhere keep the existing unknown-item fallback, recorded
  as a known gap.
- A test that every named catalog equipment id resolves to an icon of exactly matching case, except the
  listed known gaps.

Companion change: **`complete-library-unit-data`** in `tacticus-planner-api` (serves `mows.mythicAbility` and
the `mythic-quests` dataset, updates the `game-catalog-data` skill). The API half applies first.

## Capabilities

### New Capabilities

- `ability-rules-text`: which abilities carry rules text in the game-text namespace, how coverage is checked,
  and the known gaps.
- `equipment-item-icons`: every named catalog equipment item and relic ability icon loads by its catalog id;
  known gaps fall back.

### Modified Capabilities

(none; the unit-page capabilities change in `complete-library-unit-pages`)

## Impact

- `apps/web/scripts/`: new ability-text generator; `apps/web/public/locales/{en,de,es,fr}/npcAbilityText.json`
  regenerated (consumed today by the NPC Library; by the unit pages once #205/#206 merge).
- `packages/game-catalog`: `mythic-quests` dataset key, schema, storage and query; `mythicAbility` on the MoW
  schema. No page consumes them until the follow-up change.
- `apps/web/public/game_catalog/`: four case renames, two copied icons; `KNOWN_ISSUES.md` entries.
- Depends on the API serving `mythic-quests` and `mows.mythicAbility`.
