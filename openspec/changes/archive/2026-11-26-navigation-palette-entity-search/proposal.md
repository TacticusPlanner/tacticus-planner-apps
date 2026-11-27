## Why

Navigation search only finds pages and quick actions. "ragnar", "abaddon" or a raid boss name return nothing, although characters, Machines of War, NPCs, guild raid bosses and Legendary Events each have their own page. Players think in units more than in pages, so a unit name is the most natural thing to type.

## What Changes

- Navigation search also matches game entities from the game catalog the app already loads: characters, Machines of War, NPCs, guild raid bosses and Legendary Events. Results are grouped by kind, show the entity's icon or portrait, list at most 5 per group, and open the entity's page.
- The best matching unit's group ends with "Create goal for <unit>" (signed in) and a hand-off row, "Find '<query>' in Collection", so a unit search always leads somewhere. The unit's own page stays the top hit, so Enter opens it.
- Context-aware quick actions: on a character or Machine of War page, "Create goal for <unit>" leads the actions (and the phone's chips).
- Matching ignores accents ("uthar" finds Ûthar), for pages too. An entity the menu already lists as a page (a running LE) is not listed twice.

## Capabilities

### Modified Capabilities

- `app-navigation`: navigation search covers game entities, with entity actions and context-aware ordering.

## Impact

- The shared navigation list and ranking from `navigation-palette-core`, an entity index built from `@workspace/game-catalog`, `use-quick-actions.ts`, locales and tests.
- The entity index reads the catalog from the local database only when search opens (the dialog and drawer mount their content on open). Name namespaces load without suspending the search; until they arrive, names fall back to the catalog's English ones.
- No API change.

Stacked on `navigation-palette-phone`.
