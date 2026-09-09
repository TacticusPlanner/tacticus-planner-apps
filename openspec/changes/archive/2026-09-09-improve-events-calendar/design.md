## Context

See `proposal.md` for motivation and `specs/home-events-calendar/spec.md` for the required behavior. The home-page calendar currently builds day buckets from raw UTC event windows, passes each entry directly to the mobile card, and sorts all visible entries only by start time. The list card owns both the visible active/projected badges and the icon-only Wiki link; the desktop bar is a separate rendering form of the same entry.

## Goals / Non-Goals

**Goals:**

- Keep date-boundary and ordering decisions in the calendar model so mobile cards receive display-ready data.
- Preserve the existing UTC/local-day and DST correctness rules while deriving boundary tags.
- Give the mobile list its own ordering without changing the desktop Gantt lane-packing order.
- Reuse the shared button component and keep every new string aligned across event locales.

**Non-Goals:**

- Change event data, recurrence definitions, projection, or the API/game-catalog schema.
- Redesign the desktop Gantt layout beyond the shared Wiki-action treatment.
- Add start/end tags to one-day events, including Double Gold and Double XP.

## Decisions

### Derive occurrence-boundary metadata while constructing local day buckets

`buildEventsCalendarDays` will annotate each entry in a day with whether that local day is the occurrence's first or last visible calendar day. The calculation will use the same local-day membership logic already used for the calendar, treating end timestamps as exclusive and treating windows of one day or less as one-day occurrences. This keeps time-zone and DST handling out of presentation components and prevents the mobile and any future list view from disagreeing.

The mobile renderer will pass this metadata to its cards and render localized `Starts`/`Ends` tags only for qualifying multi-day entries. The card will not derive dates itself.

Alternative considered: compare `startUtc` and `endUtc` directly in the card. Rejected because card-local UTC conversion would duplicate the model's local-date rules and risk boundary drift around time zones and DST transitions.

### Keep active and projected status as styling, not text chips

The list card will remove visible `Live now` and `Projected` badges. Active status will remain visible through the existing active card treatment, while projected/confirmed status will gain or retain a non-text visual treatment compatible with the desktop bar (for example, a dashed/attenuated projected treatment). Screen-reader status text can remain available without rendering a visual tag.

Alternative considered: remove active and projected state entirely. Rejected because `home-events-calendar` requires both states to remain distinguishable.

### Use an explicit per-day mobile ordering priority

Each day bucket will sort independently after membership is calculated. The priority will be: non-recurring events lasting at most seven days, recurring one-day modifiers, then events lasting more than seven days; start time and a stable identity will break ties. This is the explicit interpretation of the requested LRE → Double Gold → Battle Pass example. The desktop lane calculation will retain its current start-column/longest-span packing because it is not a daily stacked list.

Alternative considered: sort strictly by duration, which would put Double Gold above an LRE. Rejected because it contradicts the requested example. Alternative considered: hard-code named event definitions. Rejected so future recurring modifiers and short-lived events follow the same rule.

### Make the Wiki destination a shared labelled button treatment

When `resolveEventWikiUrl` returns a URL, the shared event-card rendering will use the existing UI button component rendered as an external anchor, retaining new-tab safety attributes and the external-link icon while adding visible localized `Wiki` text. A missing URL continues to render no action. The button must fit both the mobile list card and the compact desktop bar without becoming an icon-only control.

Alternative considered: make only the mobile link a button. Rejected because the request is for the Events Calendar link itself and a consistent accessible action avoids different meanings by viewport.

### Scope padding to the mobile calendar surface

The Events Calendar's mobile rendering path will add the same horizontal content inset used by sibling mobile pages, without changing the desktop grid width or the home-page header. This avoids a global shell change while making the calendar's day sections and cards align with established mobile content.

## Risks / Trade-offs

- [UTC boundary or DST regression] → Extend model tests for first/last local days, exclusive end times, and existing UTC-midnight one-day modifier behavior.
- [Ordering ambiguity for future event classes] → Centralize the duration/recurrence priority in one tested model helper and document its categories in the spec.
- [Compact desktop bar overflow from the Wiki label] → Use the shared button's compact size and retain truncation of the event title; verify both viewport forms visually.
- [Missing localized strings] → Update every `events.json` locale and rely on the namespace-alignment test.

## Migration Plan

The change is a presentation and client-side calculation update with no persisted data or API contract migration. Rollback is a revert of the frontend change; existing calendar data remains compatible.
