## ADDED Requirements

### Requirement: Game name namespaces come from the pinned datamine

The `upgrades`, `abilities`, `equipmentItems`, `characters`, `mows`, `traits`, `factions` and `mythicQuestTasks`
namespaces SHALL be written in English, German, Spanish and French by a committed generator that reads only the
pinned data-mines files. Each namespace's ids SHALL come from the game config and its terms from the game's
language files, with a term missing in one locale falling back to English. Ids or terms the game lacks or gets
wrong SHALL come from a curated file that gives a reason for each entry; a curated term wins in the locales it
gives and is the fallback for the others. The generator SHALL exit non-zero when an id has no term anywhere, and
running it twice on the same pin SHALL produce identical files.

#### Scenario: Game spelling

- **WHEN** the namespaces are generated from data-mines `v1.43.157.2989`
- **THEN** `characters` names `votanUthar` "Ûthar" in English, as the game does

#### Scenario: Curated term

- **GIVEN** the curated file gives the `Mounted` trait the English term "Mounted"
- **WHEN** the namespaces are generated
- **THEN** every locale's `traits` names `Mounted` "Mounted"

#### Scenario: Locales stay aligned

- **GIVEN** the generated files are committed
- **WHEN** the apps test suite runs
- **THEN** each of the eight namespaces has the same ids in all four locales and no empty term
