## Why

The game data ships an event's shop before its start date is published, and the API now serves such an event with `startUtc` and `definitionId` null (companion API change `serve-undated-event-shops`). The client must accept those records, and the planner should list the event as "Start date TBA" instead of hiding it. This half deploys first: today's schema rejects the whole dataset when one record has a null `startUtc`.

## What Changes

- The `event-shops` schema accepts a null `startUtc` and `definitionId`; dated events sort by start, undated ones after them.
- The event picker lists an undated event (newest first, so on top) with "Start date TBA" instead of a date range. Its name is the game's own seasonal event name for its event key (generated from the datamine into the `eventMissions` namespace as `events.<EventKey>`), followed by the event key's month.
- Opening an undated event shows the picker, a "Start date TBA" badge, its known week count and currency, and a notice that days and the cart open once the start date is announced. Which slot sells on which day follows the weekday, so the day-by-day planner needs the start date.
- The default event ignores undated events unless there is nothing else.

## Capabilities

### Modified Capabilities

- `game-event-shops-catalog`: undated records are stored and ordered after the dated ones.
- `event-shop-planner`: the picker lists undated events and an undated event has its own "Start date TBA" view.

## Impact

- `packages/game-catalog`: event shop schema, `GameCatalogEventShopRecord` (served, maybe undated) beside `GameCatalogEventShop` (dated), `isDatedEventShop`, `compareEventShopsByStart`.
- `apps/web` event shop page: picker extracted, undated view, event name fallback; `eventShops` copy in four locales; generated `eventMissions.events`.
- `openapi/api.json` re-pinned to the API change.
