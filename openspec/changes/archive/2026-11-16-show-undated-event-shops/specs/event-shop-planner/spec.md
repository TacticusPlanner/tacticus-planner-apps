## ADDED Requirements

### Requirement: An event with no start date yet shows as Start date TBA

The event picker SHALL list an undated event (served `startUtc` null) above the dated ones, named by the game's own seasonal event name for its event key followed by the event key's month and year ("Machine Spirit Resurgent · December 2026"), with "Start date TBA" in place of its date range. Opening an undated event SHALL show the picker, a "Start date TBA" badge, its known number of weeks and its currency, and a notice that days and the cart open once the start date is announced; it SHALL show no day picker, slots or cart. The default event SHALL be chosen among dated events only, falling back to the first undated event when there is no dated one.

#### Scenario: Undated event in the picker

- **WHEN** the catalog has `october-2026` (dated) and `january-2027` (undated)
- **THEN** the picker lists `january-2027` first with "Start date TBA", and `/dailies/event-shop` still opens the running `october-2026`

#### Scenario: Opening an undated event

- **WHEN** the user opens `/dailies/event-shop/january-2027`
- **THEN** the page shows "Start date TBA", "2 weeks" and the notice, and no days or add-to-cart controls
