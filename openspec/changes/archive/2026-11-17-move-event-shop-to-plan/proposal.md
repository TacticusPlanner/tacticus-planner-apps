## Why

Staging feedback on the event shop planner (#508): testers looked for the event shop in vain because it sat under Dailies, and the cart wording misled them. "Add to cart" read like the step that records a purchase, so testers ticked offers to say they meant to buy them and only noticed from the totals that ticking marks them bought.

## What Changes

- The event shop moves from Dailies to Plan: `/plan/event-shop/:eventId`, the last Plan tab after Schedule. The old `/dailies/event-shop` paths redirect there and keep `?day=` and `?tab=`, so shared links and bookmarks still work. Home's event links point at the new path.
- The page drops "cart" for "plan": "Plan to buy" adds an offer, "Remove from plan" removes it, the legend and totals call unbought packs "Planned", and every purchase action says "bought in game". Copy changes in en, de, es and fr, including the onboarding tour.

## Capabilities

### Modified Capabilities

- `event-shop-planner`: the route lives under Plan with redirects from Dailies; planning and purchase controls are worded apart.
- `event-shop-shopping-list`: totals and row actions use the new wording.
- `app-navigation`, `goals-navigation`: Plan's child pages gain Event shop.
- `home-events-calendar`, `home-events-widget`: event shop links open the Plan path.

## Impact

- `apps/web`: `app/routes` mounts the event shop routes under `/plan/event-shop` (keeping the Dailies layout, whose project filter Coverage reads); `pages/dailies/route.tsx` redirects the old paths; nav items; Home event links; `eventShops` and `dailies` copy in four locales.
