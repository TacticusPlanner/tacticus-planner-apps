## Why

The mobile Events Calendar has inconsistent page spacing and relies on `Live now` and `Projected` chips that consume scarce space without clearly surfacing the days on which an event begins or ends. Its icon-only Wiki link and chronological event ordering also make the daily list harder to scan when short-lived, recurring, and long-running events overlap.

## What Changes

- Apply the same horizontal mobile page padding used by other app pages to the Events Calendar.
- Replace the `Live now` and `Projected` text chips with start/end markers on the first and last displayed dates of multi-day event occurrences, while preserving non-text visual differentiation for active and projected entries.
- Omit start/end markers for one-day event occurrences, including recurring Double Gold and Double XP weekend occurrences.
- Render a labelled, button-styled `Wiki` external link when an event has a Wiki URL.
- Sort each mobile day’s entries by calendar relevance: a short, time-limited event first, then that day’s recurring modifier, then a longer-running event; for example, LRE → Double Gold → Battle Pass.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `home-events-calendar`: Update the home Events Calendar’s mobile presentation, occurrence-boundary indicators, Wiki-link affordance, and per-day event ordering.

## Impact

- Affected frontend code: the home page Events Calendar’s layout, event entry card, mobile renderer, day-building calculation, and their tests.
- Affected translations: event boundary and Wiki-button labels in each supported events locale.
- No API, game-catalog schema, or backend change is expected.
