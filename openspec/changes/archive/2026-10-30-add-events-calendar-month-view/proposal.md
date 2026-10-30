# Add a month view and clearer event colours to the events calendar

## Why

Player feedback ("Add monthly view and clear event colors"): the Home events calendar only shows one week at a time, so planning a season means paging through it week by week, and its entries are hard to tell apart because each one's family colour is only a thin stripe on a grey surface.

## What Changes

- The calendar gets a Week / Month toggle. The month view shows the calendar month as whole Monday-to-Sunday weeks; desktop draws each week as compact Gantt lanes, mobile keeps its agenda for the whole month. Previous / Next step by a week or a month to match, Today returns to the current one, and the chosen view is remembered on the device.
- Guild Raid seasons are followed by a "Break" bar until the next season starts, and Guild Raid and Guild War seasons are labelled the way players write them ("Guild Raid S112", "Guild War S28"). The Guild Raid number comes from a new `seasonNumberAtAnchor` in the API's event data.
- A Guild War season bar shows each war's 36h fighting window as a darker block over its 24h preparation window, and its details list every war's preparation and war times, read from the definition's `warsPerSeason`, `preparationPhaseHours` and `activeFightingPhaseHours`.
- Events that have already ended are grayed out.
- Every entry's surface is tinted with its family colour (more strongly in dark mode), keeping the stronger left stripe, so families read at a glance. Legend swatches are drawn as miniature entries to match.

## Capabilities

### Modified Capabilities

- `home-events-calendar`: navigation by week or month, month layout, tinted family surfaces.

## Impact

- `apps/web/src/fsd/pages/home/model/` (`events-calendar-calc.ts`, `events-calendar.types.ts`, `use-events-calendar.ts`).
- `apps/web/src/fsd/pages/home/ui/events-calendar/` (navigation, legend, entry card, new `desktop/events-calendar-month.tsx`).
- `apps/web/src/fsd/shared/lib/event-colors.ts`; `events.json` navigation and tour strings in every locale.
