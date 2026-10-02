## MODIFIED Requirements

### Requirement: A selected Onslaught source supplies its per-run shard yield

For a Character Ascension goal with Onslaught selected, the system SHALL project Onslaught's
shard supply from the per-run yield for the player's saved Onslaught progress and the current
Onslaught run cadence, consuming no daily energy. The goal's ascension-orb requirement and orb
estimate SHALL NOT be affected by Onslaught selection.

When the catalog's Onslaught rewards dataset has no row for the sector and tier of the player's
saved Onslaught progress, the system SHALL treat the Onslaught source as supplying zero shards
per run — the source is unavailable, the goal's full shard demand stays on its other sources — and
SHALL NOT abort the estimate or raise an error to the user. Every estimate consumer (Today, Plan
insights, per-project estimates, the goal creation preview, and the Onslaught page) SHALL apply
this same fallback.

#### Scenario: Onslaught reduces shard demand only

- **GIVEN** a Character Ascension goal with Onslaught selected
- **WHEN** the estimate is derived
- **THEN** Onslaught's projected per-run shards reduce the campaign shard demand while the
  goal's ascension-orb requirement is unchanged

#### Scenario: Onslaught cadence

- **WHEN** Onslaught's shard supply is projected over a period
- **THEN** it uses the current Onslaught run cadence rather than a campaign raid schedule

#### Scenario: Reward row missing for the player's sector and tier

- **GIVEN** a Character Ascension goal with Onslaught selected, saved Onslaught progress at Gold sector tier 4, and a rewards dataset with no Gold row
- **WHEN** the estimate is derived
- **THEN** Onslaught contributes zero shards per run, the campaign shard demand is unchanged by Onslaught, the estimate completes, and no error is shown
