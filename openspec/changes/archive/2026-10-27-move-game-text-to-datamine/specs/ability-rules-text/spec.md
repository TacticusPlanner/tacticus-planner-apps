## MODIFIED Requirements

### Requirement: Every catalog ability with complete source text has rules text

The `npcAbilityText` game-text namespace SHALL hold an entry, in English, German, Spanish and French, for every
ability id the game config references (active and passive abilities of every NPC record, character active and
passive abilities, relic abilities (`abilityId` of each relic item), and each MoW's active (primary and
secondary) and mythic abilities) whose English game description resolves completely, and for no other id. A
description resolves completely when every `{[token]}` in it is a variable or constant of that ability (ignoring
trailing whitespace in the key), a `DamageProfileType…` token derivable from a `damageProfile…` constant,
`UnitName`, or an `S/…` reference (which renders empty); a split-index token (`{[dmg[0]]}`) counts as its
variable (`dmg`). A missing or "Coming soon!" description is not rules text. An entry SHALL carry
`description`, `variables`, `constants` and `scaled` (the game's `variablesAffectedByRarityBonus`, or empty).
German, Spanish and French SHALL use the game's localized description for the same id with the same tables,
falling back to the English description when the game has none.

Assumptions:

- The pinned data-mines commit (`datamine-source`) is the only source: the ability table
  (`raw/gameconfig/units/abilities.json`) and the game's language files
  (`raw/languages/{en,de,es,fr}.json`, key `Abilities/<id>_CurrentLevelDescription`).

#### Scenario: Coverage after this change

- **WHEN** the namespace is generated from the catalog at game version 1.43 and V1 `develop` at 02b7166
- **THEN** it holds 434 entries in all four languages: 301 of the 302 it held before, plus 34 relic
  abilities (every relic but Maugetar, which it already had), 22 MoW primary and secondary abilities, 11 MoW
  mythic abilities, 37 character abilities and 29 abilities of NPC records outside the NPC Library's list
  (for example `HaywireMineSteppable`)
- **AND** 297 of the kept entries are byte-identical; `DarkTalonStrike` and `Foehammer` take V1 `develop`'s
  newer values and text; `Loki_SwoopingHawk` and `SlashingDive` gain the `dmg`
  variable (and `scaled: ["dmg"]`) that the earlier port dropped because their description uses split-index
  tokens (`{[dmg[0]]}`), which rendered as a raw `{dmg}` before
- **AND** the orphan entry `LionHelm` is gone: no catalog record references it (Azrael's passive is
  `MasterfulTactician` at 1.43), and it is not the Lion Helm relic's text (`LionHelmRelic`, 10 levels)

#### Scenario: Coverage after moving to the datamine

- **WHEN** the namespace is generated from data-mines `v1.43.157.2989`
- **THEN** it holds the same 434 entries in all four languages as the V1-based generation
- **AND** only `HammerOfWrath`, `LeadingTheCharge`, `LightOfSanguinius`, `Nightshroud` and `SpiritualLeader`
  change: they carry the game's own wording, including its bare `<style=Buff_…>` tags, which render the same

#### Scenario: Ids with no source stay absent

- **WHEN** the namespace is generated
- **THEN** it has no entry for the NPC-only `BossEndFightUndefeated`, `RepairEnthusiast`, `RunsAround` and
  `RunsAway` (no game description), and a panel for any of them shows the missing-text note

#### Scenario: Trailing-space constant keys

- **GIVEN** the Reanimator's `ReanimationBeam`, whose constants are keyed `"initialCooldownTurns "` and
  `"munitionsCost "`
- **WHEN** its rules text is rendered
- **THEN** the cooldown and munition cost show their values, not a raw `{initialCooldownTurns}` token

### Requirement: The rules-text namespace is reproducible

The namespace SHALL be produced by a committed generator that reads the pinned data-mines files through
`ensureDatamine()` (no sibling checkout) and writes all four locale directories. Running it twice on the same pin
SHALL produce identical files. The generator SHALL print every referenced ability id it could not cover, with
the reason (no ability entry, a placeholder description, or the unresolved tokens), and SHALL exit non-zero when
that list differs from the known-gap list it carries, or when a relic ability has no `.webp` icon, so a refresh
that adds an uncovered ability or newly covers a known gap is noticed. The apps test suite SHALL also check the
committed files: identical id sets in all four locales, identical `variables`, `constants` and `scaled` per id
across locales, the entry count, and no description with an unresolvable token.

#### Scenario: Re-running changes nothing

- **GIVEN** the generated locale files are committed
- **WHEN** the generator runs again with no pin change
- **THEN** `git diff` shows no change under the four `npcAbilityText/` directories and it exits 0

#### Scenario: A refresh adds an ability without text

- **GIVEN** a new data-mines pin adds a character whose ability has no game description
- **WHEN** the generator runs
- **THEN** it names that ability id as uncovered and exits non-zero until the id is added to the known-gap
  list

#### Scenario: Locales drift apart

- **GIVEN** a hand edit that removes an entry from the German file only
- **WHEN** the apps test suite runs
- **THEN** the rules-text test fails naming the locale and the id
