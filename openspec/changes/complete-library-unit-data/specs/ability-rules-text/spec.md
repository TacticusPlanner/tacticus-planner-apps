## Purpose

Defines which unit, relic and Machine of War abilities carry rules text in the planner's game text, in which
languages, and how coverage is kept complete when the game data is refreshed.

## ADDED Requirements

### Requirement: Every catalog ability with complete source text has rules text

The `npcAbilityText` game-text namespace SHALL hold an entry, in English, German, Spanish and French, for every
ability id the game catalog references (active and passive abilities of every NPC record, character active and
passive abilities, relic abilities (`abilityId` of each relic equipment item), and each MoW's primary, secondary
and mythic ability) whose V1 source description resolves completely, and for no other id. A description resolves completely when every
`{[token]}` in it is a variable or constant of that ability (ignoring trailing whitespace in the key), a
`DamageProfileType…` token derivable from a `damageProfile…` constant, `UnitName`, or an `S/…` reference (which
renders empty); a split-index token (`{[dmg[0]]}`) counts as its variable (`dmg`). A V1 "Coming soon!"
placeholder description is not rules text. An entry SHALL carry `description`, `variables`, `constants` and `scaled` (V1's
`variablesAffectedByRarityBonus`, or empty). German, Spanish and French SHALL use V1's localized description for
the same id with the same tables; a language without a localized description SHALL fall back to English at
render time.

Assumptions:

- V1's ability table (`4-entities/abilities/data/new-ability-data.json`) and its localized descriptions
  (`5-shared/l10n/data/{de,es,fr}/ability_descriptions.json`) are the only source of rules text.

#### Scenario: Coverage after this change

- **WHEN** the namespace is generated from the catalog at game version 1.43
- **THEN** it holds 425 entries in all four languages: 301 of the 302 it held before, plus 31 relic
  abilities, 22 MoW primary and secondary abilities, 11 MoW mythic abilities, 32 character abilities and 28
  abilities of NPC records outside the NPC Library's list (for example `HaywireMineSteppable`)
- **AND** 299 of the kept entries are byte-identical; `Loki_SwoopingHawk` and `SlashingDive` gain the `dmg`
  variable (and `scaled: ["dmg"]`) that the earlier port dropped because their description uses split-index
  tokens (`{[dmg[0]]}`), which rendered as a raw `{dmg}` before
- **AND** the orphan entry `LionHelm` is gone: no catalog record references it (Azrael's passive is
  `MasterfulTactician` at 1.43), and it is not the Lion Helm relic's text (`LionHelmRelic`, 10 levels)

#### Scenario: Ids with no source stay absent

- **WHEN** the namespace is generated
- **THEN** it has no entry for the relic abilities `Fidelity`, `LionHelmRelic` and `Thrydderghyre`, for the
  character abilities `MasterfulTactician`, `PowerVomit`, `WaaaghEnergy`, `PrimeTestSubject` and
  `DiabolicRegeneration`, or for the NPC-only `BloodSurge` (no V1 entry) and `BossEndFightUndefeated`,
  `RepairEnthusiast`, `RunsAround`, `RunsAway` (V1's "Coming soon!" placeholder), and a panel for any of them
  shows the missing-text note

#### Scenario: Trailing-space constant keys

- **GIVEN** the Reanimator's `ReanimationBeam`, whose V1 constants are keyed `"initialCooldownTurns "` and
  `"munitionsCost "`
- **WHEN** its rules text is rendered
- **THEN** the cooldown and munition cost show their values, not a raw `{initialCooldownTurns}` token

### Requirement: The rules-text namespace is reproducible

The namespace SHALL be produced by a committed generator that reads the catalog's raw ability ids and V1's
source files from the workspace's sibling checkouts (`tacticus-planner-api`, `tacticusplanner`) and writes all
four locale files. Running it twice on the same inputs SHALL produce identical files. The generator SHALL print
every catalog-referenced ability id it could not cover, with the reason (no V1 entry, or the unresolved tokens),
and SHALL exit non-zero when that list differs from the known-gap list it carries, so a refresh that adds an
uncovered ability or newly covers a known gap is noticed. Because the apps CI has no catalog checkout, the
apps test suite SHALL instead check the committed files: identical id sets in all four locales, identical
`variables`, `constants` and `scaled` per id across locales, the entry count, and no description with an
unresolvable token.

#### Scenario: Re-running changes nothing

- **GIVEN** the generated locale files are committed
- **WHEN** the generator runs again with no source change
- **THEN** `git diff` shows no change to the four `npcAbilityText.json` files and it exits 0

#### Scenario: A refresh adds an ability without text

- **GIVEN** a catalog refresh adds a character whose ability has no V1 text
- **WHEN** the generator runs
- **THEN** it names that ability id as uncovered and exits non-zero until the id is added to the known-gap
  list

#### Scenario: Locales drift apart

- **GIVEN** a hand edit that removes an entry from the German file only
- **WHEN** the apps test suite runs
- **THEN** the rules-text test fails naming the locale and the id
