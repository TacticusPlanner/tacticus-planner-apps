# Tasks

## 1. Model

- [x] 1.1 Resolve the week and month ranges (month padded to whole Monday-to-Sunday weeks) and build per-week lanes for the month grid, with unit tests.
- [x] 1.2 Track the view (persisted per device) and a week-or-month offset in `useEventsCalendar`.

## 2. UI

- [x] 2.1 Add the Week / Month toggle and month-aware navigation labels.
- [x] 2.2 Render the desktop month grid; mobile shows the month's agenda.
- [x] 2.3 Tint entry surfaces and legend swatches with the family colour.
- [x] 2.4 Add navigation and tour strings in en, de, es and fr.

## 3. Guild seasons and past events

- [x] 3.1 Derive Guild Raid breaks and Guild War phases, mark ended entries past, with unit tests.
- [x] 3.2 Show "Break" bars, war blocks and the phase list; label guild seasons "S<n>"; gray out past entries.
- [x] 3.3 Add `seasonNumberAtAnchor: 112` to the API's `guild-raid-season` definition (tacticus-planner-api).
