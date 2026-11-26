## MODIFIED Requirements

### Requirement: Progress is stored per occurrence in local storage

Entries SHALL be stored under `tp.user.dailies.quest.progress` as `{ [occurrenceId]: { battles: { [number]: { medals, lightning: number, objectives: boolean[] } } } }`, read and written in guarded `try` blocks. Invalid entries SHALL be dropped on read, medals clamped to 0 to 3 and `lightning` to 0 to 100, and an `objectives` array whose length differs from the battle's objectives SHALL be padded with `false` or cut. A storage failure SHALL keep the in-memory entries for the session and show "Progress can't be saved in this browser". Entries are not keyed by account and are not synced; they sit under the account prefix, so sign-out removes them (see `redirect-authentication`).

#### Scenario: Reload

- **GIVEN** battle 1 at 500
- **WHEN** the page reloads
- **THEN** battle 1 still shows 500

#### Scenario: A new quest starts clean

- **GIVEN** Nubari entries are stored
- **WHEN** Kîmm's quest runs
- **THEN** every Kîmm battle starts at 0, and the Nubari entries are kept
