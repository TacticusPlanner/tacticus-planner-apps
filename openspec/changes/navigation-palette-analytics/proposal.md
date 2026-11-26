## Why

Nothing tracks how navigation search is used. The app runs PostHog without autocapture, the project's event list has no navigation-search event, and `$pageview` doesn't record whether a page was reached through search, the section menu or a link. Without numbers we can't tell whether people search or browse, which results they pick, or whether entity search and recent pages earn their place.

## What Changes

Three declared events, sent only for identified users like every other event (`product-analytics`):

- `navigation_search_opened`: how it was opened (`shortcut`, `top_bar` or `mobile_menu`) and the platform.
- `navigation_search_item_selected`: the kind of item (page, recent page, action or entity kind), its target (route pattern, action id, or entity kind and game id), its position in the list, which group it came from, the query length, and whether it was picked with the keyboard or the pointer.
- `navigation_search_dismissed`: closed without a pick, with the query length and the number of results shown.

No event carries what the user typed. Only its length is sent, matching the capability's rule that the contents of what a user types are never reported.

## Capabilities

### Modified Capabilities

- `product-analytics`: navigation search usage is a declared event.

## Impact

- `apps/web/src/fsd/shared/analytics/analytics-event.ts` and `analytics-provider.tsx`, the desktop and mobile search surfaces, and tests.
- No API change.

Stacked on `navigation-palette-entity-search`.
