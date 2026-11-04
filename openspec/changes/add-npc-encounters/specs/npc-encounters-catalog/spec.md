## Purpose

Gives the client game-catalog package its data layer for the served `npc-encounters` dataset (where every
NPC is fought), so Library features can show encounter locations and filter by game mode without
loading the battle datasets themselves.

## ADDED Requirements

### Requirement: The `npc-encounters` dataset is synced, validated, and stored as an optional dataset

The client SHALL treat `npc-encounters` as a served game-catalog dataset: it participates in the
manifest-diff sync, is validated against a schema matching the API's served shape on download, and is
written to its own IndexedDB store with one row per served record, keyed by
`"{npcId}|{source}|{groupId}"`. Adding the store SHALL follow the package's version-cascade upgrade
(a bumped database version with a complete `stores()` block), preserving every other dataset's records.
`npc-encounters` SHALL be an optional dataset: a manifest that does not list it leaves the catalog
ready, and consumers treat it as absent.

The schema SHALL accept exactly the served shape: `npcId` (string), `source` (one of `campaign`,
`campaignEvent`, `legendaryEvent`, `questEvent`, `incursion`, `guildRaid`, `survival`, `onslaught`),
`groupId` (string) and a non-empty `battles` array of `{ battleId: string | null, track: string | null,
tier: int | null, number: int | null, challenge: boolean, role: "enemy" | "boss" | "prime", rounds: int[], count: int | null, levels: { servedIndex: int | null, count: int }[] }`.
Unknown extra fields SHALL be tolerated, as every other catalog schema does.

#### Scenario: Encounters sync into storage

- **WHEN** a sync includes the `npc-encounters` dataset
- **THEN** every served record is stored and retrievable, and two records of the same NPC with
  different sources or groups are stored as separate rows

#### Scenario: Malformed payload

- **WHEN** an `npc-encounters` payload carries a `source` outside the listed values
- **THEN** the sync reports the failure the same way as for any other dataset, and the store is not
  left partially written

#### Scenario: API without the dataset

- **WHEN** the manifest does not list `npc-encounters`
- **THEN** the catalog still becomes ready, and the dataset reads as absent

#### Scenario: Existing database upgrades

- **WHEN** a client whose catalog database predates the `npc-encounters` store loads the app
- **THEN** the database upgrades, the store is created, and other datasets' records are preserved

### Requirement: Consumers can tell the encounter data states apart

A consumer reading `npc-encounters` SHALL be able to distinguish: still loading; absent (never synced,
or not served); failed to read; and present. When present, an NPC id with no record SHALL read as
"no recorded encounters" (an empty list for that NPC), not as absent data.

#### Scenario: Present but nothing for this NPC

- **GIVEN** `npc-encounters` is present and holds no record for `genesDecoy`
- **WHEN** a consumer reads the encounters of `genesDecoy`
- **THEN** it receives a present, empty list, distinct from the absent state
