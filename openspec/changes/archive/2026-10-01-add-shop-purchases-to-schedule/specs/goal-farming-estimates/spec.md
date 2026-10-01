## ADDED Requirements

### Requirement: The plan schedule records each selected shop offer's per-day purchases

For every plan day, the schedule SHALL record, per goal and per selected shop offer, the offer's projected contribution that day: the expected purchases (expected shards divided by the offer's shards per purchase), the expected shards, and the currency spent (expected purchases times the offer's cost, in the offer's currency). Only days on which the offer contributes more than zero SHALL carry an entry. These records SHALL be derived from the same per-source attribution the estimator already computes and SHALL NOT change raid entries, energy, completion dates or any estimate outcome; the offer's cost SHALL NOT block or alter the estimate. Their sum over all days for one goal SHALL equal that goal's attributed shop shards.

#### Scenario: A guaranteed offer on its weekdays

- **GIVEN** an Unlock goal with a selected war-shop offer of 5 shards per purchase, 2 purchases per day, available on SUN, TUE and FRI
- **WHEN** the plan schedule is built
- **THEN** each SUN, TUE and FRI day carries an entry of 2 expected purchases, 10 shards and the corresponding currency, and other days carry none

#### Scenario: Entries never alter the estimate

- **GIVEN** the same goal with and without shop entries recorded
- **WHEN** completion dates, raids and energy are compared
- **THEN** they are identical

#### Scenario: Campaign-only goal has no shop entries

- **GIVEN** a goal with no selected shop offers
- **WHEN** the plan schedule is built
- **THEN** no day carries a shop entry for it

### Requirement: The plan schedule records each selected Onslaught source's per-day runs

For every plan day, the schedule SHALL record, per goal with a selected Onslaught source, that day's projected contribution: the expected shards the source supplied and the expected runs (expected shards divided by the source's average shards per run). Only days on which the source contributes more than zero SHALL carry an entry. These records SHALL derive from the same per-source attribution the estimator already computes and SHALL NOT change raid entries, energy, completion dates, the projected Onslaught token total or any other estimate outcome. Onslaught runs consume no daily energy and SHALL NOT be reported as raids.

#### Scenario: A constant Onslaught supply

- **GIVEN** an Ascension goal with a selected Onslaught source of 4 shards per run at 1.5 runs per day
- **WHEN** the plan schedule is built
- **THEN** each day until the goal completes carries an entry of 1.5 runs and 6 shards

#### Scenario: Onslaught entries never alter the estimate

- **GIVEN** the same goal with and without Onslaught entries recorded
- **WHEN** completion dates, raids, energy and projected tokens are compared
- **THEN** they are identical

#### Scenario: A goal without Onslaught has no entries

- **GIVEN** a goal whose acquisition sources do not include Onslaught
- **WHEN** the plan schedule is built
- **THEN** no day carries an Onslaught entry for it
