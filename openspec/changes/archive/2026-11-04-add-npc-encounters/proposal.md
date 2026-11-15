## Why

Players browsing `/library/npcs` can see an enemy's stats but not where they will fight it
([#158](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/158)), and they can't narrow the
list to the enemies of one game mode ([#156](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/156)).
The game-mode filter was built once and pulled because its only signal was a guessed id suffix. The
companion API change now serves `npc-encounters`, a verified index of every battle each NPC appears in,
so both features can rest on real data. The same investigation showed two Variation labels in
production are wrong: `CE` is a Campaign Event (not a "Champion Event"), and `LHE` is the game's internal
name for Quest Events (not a "Legendary Hero Event").

## What Changes

- Sync, validate and store the new `npc-encounters` catalog dataset as an optional dataset, so the app
  still works against an API that does not serve it yet.
- NPC Library detail: a new **Encountered in** section for the selected variation, grouped by game mode
  (Campaign, Campaign Event, Legendary Event, Quest Event, Incursion, Guild Raid, Survival, Onslaught).
  It shows the most specific location the data gives (battle, track, tier or rounds), when time-limited
  content runs next (from the events calendar), a link to the matching planner page where one exists,
  and a clear "no recorded encounters" state.
- NPC Library filters: a single-select **Game mode** filter, driven by the encounter data, that narrows
  both the NPC list and the Variation choices like the existing filters.
- Variation labels: `CE` reads "Campaign Event", `LHE` reads "Quest Event", and `LEG` reads
  "Legendary Event" (it was "Legendary").
- Tour: one new step for the encounters section, on desktop and mobile.

Companion change: `add-npc-encounters` in `tacticus-planner-api` (serves `npc-encounters`). Apply that
half first.

## Capabilities

### New Capabilities

- `npc-encounters-catalog`: the client data layer for the `npc-encounters` dataset: sync, schema,
  storage, optional-dataset behavior, and the absent / loading / failed / present states consumers see.

### Modified Capabilities

- `npc-library`: adds the encounter section and the game-mode filter, corrects the variation mode labels,
  adds a tour step, and extends the states requirement with the encounter-data states.

## Impact

- `packages/game-catalog`: zod schema, `npc-encounters` dataset key (optional), mapper store id, Dexie
  version bump with a new store, storage type, and the regenerated `shared/api/schema.d.ts`.
- `apps/web/src/fsd/entities/npc`: encounter indexing, source order, game-mode filter predicate and
  timing lookup (pure functions + tests). `variation-mode.ts` mode ids and labels.
- `apps/web/src/fsd/pages/library/ui/npcs`: encounters section (desktop + mobile), filter control, view
  model, tour step.
- `apps/web/public/locales/{en,de,es,fr}/library.json`: new and changed keys.
- Closes apps#156 and apps#158.
