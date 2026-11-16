## 1. Catalog package

- [x] 1.1 Accept null `startUtc` and `definitionId`; split the served record type from the dated one
- [x] 1.2 `isDatedEventShop` and `compareEventShopsByStart`; `getEventShops` orders undated events last

## 2. Event shop page

- [x] 2.1 Generate the game's seasonal event names into `eventMissions.events`
- [x] 2.2 Extract the event picker; list undated events with "Start date TBA"
- [x] 2.3 Undated event view; default event skips undated ones unless nothing else exists
- [x] 2.4 Copy in en, de, es and fr

## 3. Tests

- [x] 3.1 Schema and ordering of undated events
- [x] 3.2 Page: default event, TBA view, name from game text
