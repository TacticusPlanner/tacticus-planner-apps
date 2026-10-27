## ADDED Requirements

### Requirement: Today lists today's Onslaught runs

The Raids tab SHALL show an "Onslaught" section after the raid lanes, listing one row per unit that today's plan spends Onslaught tokens on, with its expected runs and shards, in goal-priority order. The runs SHALL come from the same plan run as Today's raids, so tokens are shared across goals in priority order exactly as Plan > Schedule's day 1 shows them. The section header SHALL show the whole tokens to spend today: the sum of the rows' expected runs, rounded up. When no goal needs an Onslaught run today, the section SHALL NOT be shown. Raids Filters SHALL NOT affect it.

Assumptions:

- One Onslaught run costs one token, and the plan spends at most the catalog's Onslaught runs per day.
- Expected runs are fractional because shard drops per run are an expectation, not a guarantee.

Worked example: goal g1 (priority 1, Bellator) is planned 1.2 runs for 6 expected shards and goal g2 (priority 2, Aleph-Null) 0.5 runs for 2 expected shards. The rows are Bellator "≈1.2 runs · 6 shards", then Aleph-Null "≈0.5 runs · 2 shards", and the header shows 1.2 + 0.5 = 1.7, rounded up to 2 tokens.

#### Scenario: Runs are listed in goal priority

- **GIVEN** today's plan spends Onslaught tokens on two goals' units
- **WHEN** the user opens Raids
- **THEN** the Onslaught section lists the higher-priority goal's unit first, each row with its expected runs and shards

#### Scenario: Nothing to run

- **GIVEN** no goal needs an Onslaught run today
- **THEN** the Raids tab has no Onslaught section

#### Scenario: Tour step

- **WHEN** the user runs the Today tour with the Onslaught section shown
- **THEN** a localized step explains the section, on desktop and mobile
