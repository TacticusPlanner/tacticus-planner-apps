## MODIFIED Requirements

### Requirement: Typed query access preserves the curated Meta contract

The game-catalog query surface SHALL expose the full Meta object, a lookup by
`bossUnitSetId`, and a lookup by prime `unitSetId` into `primes`. A returned
boss group SHALL expose an ordered `primeUnitSetIds` array (zero or more prime
unit-set ids fought alongside that boss). A returned recommendation SHALL
expose its `kind` (a non-empty archetype id — not restricted to a fixed set),
exactly five ordered hero ids, one Machine-of-War id, ordered Comp ids, and a
positive `efficiency` number. A returned Comp SHALL expose its id,
signature-unit id, ordered core-character ids, flex-character ids, and
Machine-of-War ids.

A boss or prime group MAY carry any number of recommendations (one or more);
the query surface SHALL NOT assume or enforce exactly two.

The query surface SHALL preserve the source ordering and SHALL not infer,
rename, or rank recommendations, Comps, heroes, or Machines of War.
`efficiency` is relative within its own boss/prime group only — the query
surface SHALL NOT compare it across different bosses or primes or present it
as a cross-boss difficulty ranking.

#### Scenario: A feature reads a boss's recommendations

- **WHEN** a feature queries a boss id present in synced Meta data
- **THEN** it receives that boss's authored recommendations, however many are
  present, in authored order with their exact lineup, Comp references, and
  `efficiency` value, plus that boss's `primeUnitSetIds`

#### Scenario: A feature reads Comp guidance

- **WHEN** a feature reads a Comp profile from synced Meta data
- **THEN** it receives the profile's ordered core, flex, and Machine-of-War
  ids without any server-supplied label or image path

#### Scenario: A feature reads a boss's primes

- **WHEN** a feature queries a boss group with a non-empty `primeUnitSetIds`
- **THEN** it receives each prime's unit-set id in authored order

#### Scenario: A feature reads a prime's curated recommendations

- **WHEN** a feature queries a prime id present in synced `primes` data
- **THEN** it receives that prime's authored recommendations in authored
  order with the same shape as a boss recommendation

#### Scenario: A prime has no curated recommendation

- **WHEN** a feature queries a prime id referenced by a boss's
  `primeUnitSetIds` but absent from `primes`
- **THEN** the query surface reports no curated recommendation for that prime
  rather than an error, distinct from an absent dataset
