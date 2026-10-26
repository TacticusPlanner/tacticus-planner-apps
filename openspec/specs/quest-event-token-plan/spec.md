# quest-event-token-plan Specification

## Purpose

Tells the player how many attempts they have left in a running Quest Event and whether that covers the battles still below their maximum, from an optional "tokens now" entry, since the game API does not expose quest tokens.

## Requirements

### Requirement: The player can enter their current tokens

On a running quest the tab SHALL offer an optional "Tokens now" entry, a whole number from 0 to 6, stored in the occurrence's entry as `tokens: { count, atUtc }` with the time of entry. The entry SHALL show "as of {time}" and can be cleared.

#### Scenario: Entry kept

- **WHEN** the player enters 2 at 2026-10-23T18:00Z and reloads
- **THEN** the card shows "2 tokens as of 18:00"

### Requirement: Attempts left are projected to the end of the quest

The plan SHALL compute **attempts left** as:

- with an entry: `count` + floor((`endUtc` − `atUtc`) ÷ 2 h);
- without one: 6 + floor((`endUtc` − now) ÷ 2 h), labelled "if your bank is full now".

It SHALL compare that with the **battles to improve**: the battles below their maximum in `scoreQuest`. It SHALL show "N attempts for M battles to improve" and either "K spare retries" or "K attempts short", and "Every battle is perfect" when M is 0.

Assumptions:

- The bank holds at most 6 tokens and gains 1 every 2 hours (12 a day); regen does not run while the bank is full.
- The regen timer is taken to restart at the entry, which is conservative by up to 2 hours.
- Each battle to improve needs at least one more attempt.

#### Scenario: Entered tokens

- **GIVEN** Nubari ends 2026-10-24T00:00Z, 2 tokens entered at 2026-10-23T18:00Z, and 4 battles below their maximum
- **THEN** attempts left are 2 + 3 = 5, and the card shows "5 attempts for 4 battles to improve · 1 spare retry"

#### Scenario: No entry at the start

- **GIVEN** the time is 2026-10-21T00:00Z and no entry
- **THEN** attempts left are 6 + 36 = 42, labelled "if your bank is full now"

### Requirement: The plan warns before the bank fills

With an entry, the plan SHALL show when the bank fills: `atUtc` + (6 − `count`) × 2 h, as "Bank full at {time}; play before then so regen isn't wasted", and nothing when that is after `endUtc`. It SHALL always show the tip "Log in at least every 12 hours to keep tokens regenerating".

#### Scenario: Bank fills

- **GIVEN** 2 tokens at 2026-10-22T08:00Z
- **THEN** the card shows "Bank full at 16:00"

### Requirement: Token plan states and placement

In a claim window the card SHALL say "Battles are closed". In a preview it SHALL show "You'll get about 42 attempts" (6 + 72 ÷ 2) and no entry. On desktop the card SHALL sit under the summary; on mobile directly after the summary. Copy SHALL be localized in en, de, es and fr.

#### Scenario: Preview

- **GIVEN** Kîmm's quest is a preview
- **THEN** the card shows "You'll get about 42 attempts" without the tokens entry
