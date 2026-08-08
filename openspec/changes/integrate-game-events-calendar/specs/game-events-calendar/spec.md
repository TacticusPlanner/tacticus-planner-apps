## Purpose

Gives the client a queryable model of game events — reusable definitions decoupled from scheduled occurrences — so it can determine what's active right now, what's coming up, and what a given event means, without relying on a hand-maintained image.

## ADDED Requirements

### Requirement: Event definitions carry no display text or icon

Event definitions and event occurrences SHALL NOT store a display name or icon. The client SHALL resolve both from the definition's `id` (and, where the definition declares parameters that affect presentation, the occurrence's `parameters`) via i18n and id-based icon mapping.

#### Scenario: Rendering an event's name and icon

- **WHEN** the client renders any event definition or occurrence
- **THEN** its display name and icon are resolved via i18n/icon mapping keyed by `definitionId`, not read from a stored display field

### Requirement: Event occurrences have explicit start and end times

Every event occurrence SHALL carry explicit `startUtc` and `endUtc` timestamps. No other signal (e.g. a fixed lookback window from a single start date) SHALL be used to infer when an occurrence ends.

#### Scenario: Occurrence exposes explicit UTC boundaries

- **WHEN** an event occurrence is scheduled
- **THEN** it has both an explicit `startUtc` and an explicit `endUtc`

### Requirement: Active event determination from UTC time

The system SHALL determine whether an occurrence is active by comparing the current UTC time against its `startUtc` (inclusive) and `endUtc` (exclusive).

#### Scenario: Occurrence active within its window

- **WHEN** the current time is at or after an occurrence's `startUtc` and before its `endUtc`
- **THEN** the occurrence is considered active

#### Scenario: Occurrence not active outside its window

- **WHEN** the current time is before an occurrence's `startUtc`, or at/after its `endUtc`
- **THEN** the occurrence is not considered active

### Requirement: Occurrence parameters satisfy their definition's required parameters

When an event definition declares required parameters, every occurrence referencing that definition SHALL supply a value for each one. The catalog build SHALL reject an occurrence that omits a required parameter.

#### Scenario: Occurrence missing a required parameter fails validation

- **WHEN** an occurrence references a definition that declares a required parameter (e.g. a targeted faction)
- **AND** the occurrence does not supply a value for that parameter
- **THEN** the catalog build fails validation for that occurrence

### Requirement: Fixed-recurrence definitions are projected into a rolling window

A definition with `Fixed` recurrence (an interval and a duration) SHALL be projected into placeholder calendar entries covering every slot from now through 15 weeks ahead, recomputed on each catalog build. An authored occurrence covering the same window as a projected slot SHALL supersede that slot's placeholder.

#### Scenario: Placeholder appears before any occurrence is authored

- **WHEN** a `Fixed`-recurrence definition's next slot falls within the projection window
- **AND** no occurrence has been authored for that slot
- **THEN** a projected placeholder entry appears in `eventsCalendar` for that slot's date range

#### Scenario: Authored occurrence supersedes its placeholder

- **WHEN** an occurrence is authored covering the same date range as a previously projected placeholder for the same definition
- **THEN** `eventsCalendar` shows only the authored occurrence for that date range, not both

#### Scenario: Projection does not extend beyond the window

- **WHEN** a `Fixed`-recurrence definition's slot falls more than 15 weeks ahead of now
- **THEN** no placeholder is generated for that slot

### Requirement: None-recurrence definitions are never projected

A definition with `None` recurrence SHALL never produce a projected placeholder. It SHALL appear in `eventsCalendar` only once an occurrence has been authored for it.

#### Scenario: No placeholder for an unscheduled irregular event

- **WHEN** a `None`-recurrence definition has no authored occurrence within or beyond the projection window
- **THEN** no entry for that definition appears in `eventsCalendar` for any future date

### Requirement: Legendary Event placeholders confirm as the featured character is announced

Projected placeholders for the `legendary-event` definition SHALL start unconfirmed, with no featured-character parameter. Each SHALL become a confirmed occurrence once the featured character is announced, without changing the slot's date range.

#### Scenario: Placeholder before the character is announced

- **WHEN** a `legendary-event` slot is within the projection window and its featured character has not yet been announced
- **THEN** the calendar entry for that slot is unconfirmed and carries no featured-character parameter

#### Scenario: Slot becomes confirmed once announced

- **WHEN** the featured character for a previously-unconfirmed `legendary-event` slot is announced
- **THEN** the calendar entry for that same date range becomes a confirmed occurrence carrying the featured character parameter

### Requirement: Campaign Event and Incursion placeholders require no confirmation step

Projected placeholders for `campaign-event` and `incursion` SHALL be usable as-is, without requiring an authored occurrence, unless that slot introduces new content (a new campaign track or Machine of War), in which case an authored occurrence SHALL supply that flag.

#### Scenario: Placeholder used without any authored occurrence

- **WHEN** a `campaign-event` or `incursion` slot has no authored occurrence and does not debut new content
- **THEN** the projected placeholder is the complete, final calendar entry for that slot

#### Scenario: Debut flag requires an authored occurrence

- **WHEN** a `campaign-event` or `incursion` slot introduces a new content debut
- **THEN** an authored occurrence for that slot carries the debut flag, superseding the placeholder

### Requirement: Weekly standing modifiers recur indefinitely

`always-double-xp-sunday` and `always-double-gold-saturday` SHALL recur weekly via `Fixed` recurrence and SHALL appear as projected placeholders throughout the entire projection window without ever requiring an authored occurrence.

#### Scenario: Every Sunday and Saturday within the window has an entry

- **WHEN** the projection window is computed
- **THEN** an `always-double-xp-sunday` entry appears on every Sunday within the window and an `always-double-gold-saturday` entry appears on every Saturday within the window

### Requirement: Calendar entries are date-indexed and multi-day occurrences appear on every date they span

`eventsCalendar` SHALL be indexed by date. An occurrence or placeholder spanning multiple dates SHALL appear as a self-contained entry under every date it spans, sharing the same occurrence identity across those dates.

#### Scenario: Multi-day occurrence appears on each spanned date

- **WHEN** an occurrence's `startUtc`/`endUtc` spans more than one calendar date
- **THEN** an entry for that occurrence appears under every date in its span, referencing the same occurrence

### Requirement: Client exposes active and upcoming event selectors

The client SHALL provide selectors to retrieve events active at a given time, events active right now, and upcoming events, without requiring callers to join `eventsCalendar` against `eventDefinitions` themselves.

#### Scenario: Retrieving currently active events

- **WHEN** a caller requests events active now
- **THEN** the result includes every occurrence whose window contains the current time, with its definition's rules resolvable from the same result
