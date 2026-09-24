## Why

Dailies currently formats the `endUtc` of any active campaign-event calendar entry as a definite remaining-time phrase, including unconfirmed projected placeholders. A reported mismatch with the in-game Tyranid event shows why a projection should not be presented as an exact countdown.

## What Changes

- Use the calendar entry's existing `confirmed` flag as well as `endUtc` when rendering the Dailies campaign-event status.
- Show a localized remaining-time phrase only for a confirmed active occurrence; for an unconfirmed projection, keep the detected event identity and show that its end time is unconfirmed rather than an exact countdown.
- Keep the live-progress active-event ID as the source of which event is farmable. An absent or stale calendar entry must not falsely show a zero-duration countdown.
- Verify the paired API catalog occurrence against dated in-game evidence before expecting an exact timer for the reported slot.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `daily-raids-today`: Gate the event remaining-time phrase on a confirmed active calendar entry and distinguish unknown time from no active event.
- `game-events-calendar`: Clarify that projected campaign-event windows are usable for calendar placement but not authoritative exact countdowns.

## Impact

- Dailies campaign-event status derivation/rendering, tests, localized copy, and tour wording in apps. Existing catalog schema already exposes `confirmed`; no client schema or API shape change is expected.
- Companion `tacticus-planner-api/openspec/changes/correct-campaign-event-end-countdown`; API applies first.
