## Why

V1's LRE Teams tab shows all three tracks side by side: each track's restrictions with their cleared counts and the teams picked for them. Players use it to see the whole event at once (Discord feedback, 2026-11-01). V2 shows one lane per tab, so the same picture takes three tab switches, and the Overview only summarises progress and last run.

## What Changes

- An **Event board** section on the Overview tab, after Run status: one column per lane (side by side from 1024px, stacked below) with the lane's rule, every objective (icon, label, points, synced cleared / battles) and the lane's saved teams as compact rows (name, member portraits, covered objective icons).
- An objective that no saved team covers is marked "No team".
- A team row opens the page's team editor; a lane heading opens that lane's tab. Editing, reorder and depth stay on the lane tabs.
- Hidden behind the web-only `LreEventBoard` feature flag until it is ready.

## Capabilities

### Modified Capabilities

- `legendary-events-hub`: the Overview tab may show the Event board, the one place lanes render side by side.

## Impact

- `apps/web/src/fsd/pages/legendary-events/ui/legendary-event/overview/event-board.tsx`, `event-board.view-model.ts`.
- `apps/web/src/fsd/shared/feature-flags/feature-flags.ts`: `LreEventBoard`.
- `apps/web/public/locales/*/legendaryEvents.json`: `eventBoard.*`.
- Configuration: turn `LreEventBoard` on in `appcs-tp-stg` / `appcs-tp-prod` when ready. No API change.
