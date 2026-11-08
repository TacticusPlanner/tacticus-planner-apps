## Why

Players asked for a Power sort on the Collection page ("Add Power Level Sorting" on the feedback board): V1 offers it, and since V1 matches the in-game power figure it is how many players read their roster. V2 already computes the same in-game power (`@/shared/unit-power`) for Compare, team recommendations and Incursions, so the sort only has to reuse it.

## What Changes

- The Collection Sort control (and Compare's order select, which reuses Collection's sorts) gains **Power**: owned units by in-game power descending, equipped items included, characters and Machines of War together.
- A unit whose power cannot be computed (missing game data) sorts after the owned units that have one.
- While the power data is loading under the Power sort, the page shows its loading placeholders rather than a list in the wrong order.
- The rule that Power SHALL NOT be offered is dropped; Blackstone value and faction-total sorts stay out.

## Capabilities

### Modified Capabilities

- `player-collection`: "Collection sorts units within each faction" adds the Power sort.

## Impact

- `apps/web/src/fsd/pages/my-game/model/collection-query.ts`, `collection-view.ts`, `use-collection-view.ts` and their tests.
- `apps/web/public/locales/*/common.json`: `myGame.collection.toolbar.sortOptions.power`.
