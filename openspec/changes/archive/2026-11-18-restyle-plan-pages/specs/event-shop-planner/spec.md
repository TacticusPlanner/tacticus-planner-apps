## MODIFIED Requirements

### Requirement: The header names the event and its timing

The page toolbar's Find slot (`app-page-layout`) SHALL show an event picker labelled with the event's name — its calendar `definitionId` through the existing `events` i18n names, followed by its start month and year in the user's locale ("Armageddon Shop · October 2026") — that lists every catalog event, newest first, with its date range. Under the toolbar the page SHALL show a status badge (`Starts in N days` · `Running` · `Ended`), the date range and day count, the daily shop reset in the user's time zone ("shop resets 01:00 your time", the local time of 00:00 UTC), and when the player data was last synced ("Synced 2 h ago"; "Not synced" without player data). When the selected day's week has `estimatedWeeklyIncome`, the header SHALL show "≈ {free} free + {bonusShipment} bonus shipment this week" in the event currency; otherwise nothing.

#### Scenario: Event name

- **WHEN** the event has `definitionId` `armageddon-shop` and starts 2026-10-26
- **THEN** the picker shows "Armageddon Shop · October 2026"

#### Scenario: Reset time follows the user's time zone

- **WHEN** the user's time zone is Europe/Prague on 2026-10-29 (UTC+1)
- **THEN** the header says "shop resets 01:00 your time"

#### Scenario: Income for the selected week

- **WHEN** week 1 of `august-2026` has income 750 / 1000 and the selected day is in week 1
- **THEN** the header shows "≈ 750 free + 1,000 bonus shipment this week"

### Requirement: Shop search across the event

A text field ("Search the shop") SHALL search every reward the event sells, not only units: as the user types, the matches SHALL list each matching reward with every event day it is on sale (date, pack size and cost), days already past marked past and today marked. A reward SHALL match by its name in the user's language and, for shards and mythic shards, also by the unit's other names, as the unit pickers match them; names that start with the query SHALL come first. Selecting a day SHALL open the Shop tab on that day. The field sits in the page toolbar's Find slot after the event picker on every form (on phone, on its own line below the picker), with the matches under it. Without synced player data every option of each slot is searched.

#### Scenario: Yarrick shard days

- **WHEN** the user types "yarr" in `october-2026`
- **THEN** the matches show Yarrick shards on Mon 26 Oct (past, if today is later), Thu 29 Oct and Sun 1 Nov, each "×25 · 45"

#### Scenario: Not only units

- **WHEN** the user types "orb"
- **THEN** the matches list the event's ascension orb rewards with the days each is sold
