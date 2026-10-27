## Why

Daily actions are spread across separate Dailies tabs, and players want one place that answers "what should I do today" (UserJot "One 'What should I do today' page"). The first step is shops: today's shop buys are read against the same project as today's raids, so they belong on the Raids tab rather than a tab of their own.

## What Changes

- Show today's shop recommendations as a "Shop recommendations" section on the Raids tab (`/dailies/raids`), below the raid lanes, with the same desktop and mobile layouts and the same loading, error, no-goals and nothing-to-buy states as before.
- The Raids project selector narrows both the raids and the shop buys; the section has no selector of its own.
- **BREAKING** Remove the Shops tab from Dailies navigation (section tabs, desktop section menu, navigation search). `/dailies/shops` redirects to `/dailies/raids` so old links and bookmarks still work.
- Fold the Shops tour steps (purpose, guaranteed vs. possible, reading a card) into the end of the Today tour, reusing their existing `shops` namespace copy.
- Shop and group headings move down one level (h3/h4) so they nest under the section's h2.

Raids, guild raid tokens and events on one combined page are out of scope.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `daily-shop-recommendations`: recommendations render on the Raids tab instead of a Shops page; the tour is part of the Today tour.
- `dailies-navigation`: Shops is no longer a primary tab; `/dailies/shops` redirects to Raids.
- `app-navigation`: the Dailies last-visited-child example uses Guild Raids instead of Shops.

## Impact

`pages/dailies/route.tsx`, `pages/dailies/ui/today-page.tsx`, the new `pages/dailies/ui/today-shops.tsx` (replacing `shops-page.tsx` and its tutorial), `today.tutorial.tsx`, the shop desktop/mobile headings, `app/layout/nav-items.ts`, the `dailies` locale files (unused `tabs.shops*` keys removed), and their tests. No API or data change.
