## Why

The Onslaught, Arena, and Salvage Run pages under Dailies show team recommendations that users say are not useful yet (UserJot "Dailies": the recommendations do not earn a tab, and the Onslaught page's target column is too narrow). They are premature pages that dilute Dailies. Hide them from the product until there is a real use case, without deleting the implementation.

## What Changes

- Remove Onslaught, Salvage Run, and Arena from the Dailies navigation (section tabs, desktop section menu, navigation search) so Dailies shows Raids, Shops, and Guild Raids.
- Stop serving `/dailies/onslaught`, `/dailies/salvage-run`, and `/dailies/arena`; they become unknown routes like any other unserved path.
- Keep the page slices, recommendation hooks, and their specs (`dailies-onslaught-recommendations`, `dailies-arena-recommendations`, `dailies-salvage-run-recommendations`, `dailies-team-recommendations`) in the repo unchanged; only navigation and routing change. The Onslaught **progress** page at `/progress/onslaught` is unaffected.
- Remove the three tabs' now-unused label/description translation keys from every locale.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dailies-navigation`: Dailies has three primary tabs; the hidden tabs' paths are not routes.

## Impact

`nav-items.ts`, `pages/dailies/route.tsx`, their tests, and the `dailies` locale files. No API or persisted-data change. Existing bookmarks to the three paths fall through to the app's unknown-route handling.
