## Why

Navigation search only finds pages and quick actions. "ragnar", "abaddon" or a raid boss name return nothing, although characters, Machines of War, NPCs, guild raid bosses and Legendary Events each have their own page. Players think in units more than in pages, so a unit name is the most natural thing to type.

## What Changes

- Navigation search also matches game entities from the game catalog the app already loads: characters, Machines of War, NPCs, guild raid bosses and Legendary Events. Results are grouped by kind, show the entity's icon or portrait, list at most 5 per group, and open the entity's page.
- A unit result also offers "Create goal for <unit>" (signed in) and a hand-off row, "Find '<query>' in Collection", so a unit search always leads somewhere.
- Context-aware quick actions: the action that fits the current page comes first ("Create goal for <unit>" on a unit page, Create goal on Goals, "Plan this event" on an LE page).

## Capabilities

### Modified Capabilities

- `app-navigation`: navigation search covers game entities, with entity actions and context-aware ordering.

## Impact

- The shared navigation list and ranking from `navigation-palette-core`, an entity index built from `@workspace/game-catalog`, `use-quick-actions.ts`, locales and tests.
- Startup bundle: the entity index loads on first open of search so it stays out of the startup budget.
- No API change.

Stacked on `navigation-palette-phone`.
