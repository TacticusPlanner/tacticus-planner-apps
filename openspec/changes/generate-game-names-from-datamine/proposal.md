# Proposal

## Why

Eight game-name namespaces (`upgrades`, `abilities`, `equipmentItems`, `characters`, `mows`, `traits`, `factions`, `mythicQuestTasks`) were ported by hand from V1 and have no generator, so a game update means another hand port. `traits`, `factions` and `mythicQuestTasks` are English-only. This is step T2 of datamine roadmap steps 8 and 10: generate them from the pinned data-mines commit (`datamine-source`), like T1 did for rules text.

## What Changes

- New `apps/web/scripts/generate-game-names-i18n.mjs` writes all eight namespaces in en/de/es/fr from the pinned datamine. Each namespace takes its ids from the game config and its terms from `raw/languages/*`:

  | Namespace          | Ids                                                | Term                                      |
  | ------------------ | -------------------------------------------------- | ----------------------------------------- |
  | `upgrades`         | `upgrades.json`                                    | `Upgrades/<id>_name`                      |
  | `abilities`        | `units/abilities.json`, named ones only            | `Abilities/<id>_Name`                     |
  | `equipmentItems`   | `items.json`                                       | `Items/<id>_name`, else the config `name` |
  | `characters`       | `units/lineup.json`, not MoW                       | `Units/<id>_ExtraShortName`               |
  | `mows`             | `units/lineup.json`, MoW                           | `Units/<id>_ExtraShortName`               |
  | `traits`           | `Traits/<id>_Name` keys                            | `Traits/<id>_Name`                        |
  | `factions`         | `units/factions.json`                              | `UnitDetails/Faction_<id>`                |
  | `mythicQuestTasks` | `mythic_*` task `locaKey`s in `quests/groups.json` | `Quests/<key>`                            |

- A term missing in one locale falls back to English. Values are trimmed.
- `apps/web/datamine/curated-names.json` holds the few things the game lacks or gets wrong, each with a reason: the `tauBroadside` id (not in the lineup yet), the `Mounted` trait (no game term) and two mythic-task templates the game gets wrong (in English and, where the game does too, de/es/fr).
- The generator exits non-zero when an id has no term anywhere.
- `datamine/files.txt` adds `upgrades.json`, `units/factions.json` and `quests/groups.json`.

## Output changes

- `upgrades`, `abilities` and `factions` (en) are unchanged. `equipmentItems` and `mows` change only in key order (now sorted).
- `characters`: en takes the game's spelling for `Ûthar`, `Khârn`, `Kîmm`, `Âmmuk` and `Hâvyr` (de/es/fr already had it). `tauBroadside` is "Tson'ji", the game's name, in every locale (was "Broadside").
- `traits` (en): `MkXGravis` "Mk X Gravis", `TwoManTeam` "2-man Team", `WeaverOfFate` "Weaver Of Fates" (the game's terms), plus five ids the game names that the file lacked (`BeastSlayer`, `BossAdjutant`, `MachineOfWar`, `Object`, `Steppable`).
- `mythicQuestTasks` (en): a trailing space trimmed, and the new `SlayEnemiesWithHeroToUnitEffectInOneBattle_UnitEffect_Taunted_description`.
- New: de/es/fr `traits`, `factions` and `mythicQuestTasks`.

## Capabilities

### Modified Capabilities

- `datamine-source`: the game-name namespaces are generated from the pin.

## Impact

- New: `apps/web/scripts/generate-game-names-i18n.mjs`, `apps/web/datamine/curated-names.json`, `game-name-translations.test.ts`.
- Generated: the eight namespaces in `public/locales/{en,de,es,fr}`.
- Six legendary-event test expectations now read "Ûthar"; comments that called these namespaces English-only are updated; AGENTS.md lists the generator.
- No API change.
