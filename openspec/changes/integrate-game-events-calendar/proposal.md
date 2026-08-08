## Why

V1 shows the game events calendar as a static image that a maintainer manually pastes from Snowprint's Discord post each season (`tacticusplanner/src/fsd/1-pages/home/desktop-home.tsx` + `assets/images/calendar/README.md`) — it can't be queried, has no notion of "what's active right now," and can't back any feature that needs to reason about live events. V2's home page (`apps/web/src/fsd/pages/home`) is currently just an authenticated placeholder with no calendar at all. This change gives V2 structured, queryable event data and a dynamically rendered calendar as the home page's primary content, closing GitHub issue [TacticusPlanner/tacticus-planner-apps#81](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/81).

## What Changes

- Add `eventDefinitions` and `eventOccurrences` authored datasets to the backend game catalog (`TacticusPlanner.GameCatalog`), plus a server-denormalized `eventsCalendar` served dataset (date-indexed, self-contained per-day entries), following the existing dataset/denormalization/validation pipeline used by the other 14 catalog datasets.
- Model events as reusable **definitions** (mechanic, scoring, required parameters, recurrence) decoupled from scheduled **occurrences** (dates + parameters) — replacing V1's pattern of one hand-authored JSON per event instance.
- Event definitions and occurrences carry no display text or icon; the client resolves both from `definitionId` (and occurrence `parameters`) via i18n and id-based icon mapping, consistent with this repo's existing game-data conventions.
- Support two recurrence kinds on definitions:
  - `Fixed` (known interval + duration): `campaign-event`, `incursion`, `legendary-event`, and two weekly standing modifiers (`always-double-xp-sunday`, `always-double-gold-saturday`).
  - `None` (no schedule, never projected — shown only once authored): every Tournament Arena ruleset, every Home Screen Event, `new-character-event`, `game-version-release`, and one-off special events.
- Server-side project `Fixed`-kind definitions into placeholder calendar entries covering a rolling now→now+15-week window; any authored occurrence covering the same window supersedes its placeholder. `legendary-event` placeholders start unconfirmed (`featuredCharacterId` unknown) and are confirmed roughly a month ahead of each slot; `campaign-event`/`incursion`/weekly-modifier placeholders need no such confirmation step since they carry no centrally-announced content.
- Add `eventDefinitions` and `eventsCalendar` IndexedDB stores to the client `game-catalog` package (mirroring the existing dataset-sync pipeline), plus selectors for events active at a given time, active now, and upcoming.
- Replace the V2 home page's placeholder content with a dynamically rendered events calendar sourced from `eventsCalendar` (desktop and mobile).

## Capabilities

### New Capabilities

- `game-events-calendar`: event definition/occurrence data model, recurrence-based projection, and active/upcoming event determination, exposed via the client game-catalog package.
- `home-events-calendar`: dynamic rendering of the events calendar as the home page's primary content, desktop and mobile.

### Modified Capabilities

- none — the game-catalog package's dataset pipeline is extended with new dataset keys following its existing pattern; no existing capability's requirements change.

## Impact

- **Backend** (`tacticus-planner-api`, `TacticusPlanner.GameCatalog`): new `Data/events/event-definitions.json` and `Data/events/event-occurrences.json`, a new denormalizer producing `eventsCalendar` (including `Fixed`-kind projection/reconciliation), new required-parameter cross-reference validation, new dataset keys and served endpoints. This is a separate repo/submodule from where this proposal lives — backend work is planned here but implemented in that repo.
- **Client** (`tacticus-planner-apps/packages/game-catalog`): new dataset keys (`eventDefinitions`, `eventsCalendar`), zod schemas, Dexie tables, mapper updates, and `queries.ts` selectors (active-at, active-now, upcoming).
- **Client UI** (`apps/web/src/fsd/pages/home`): placeholder content replaced with the events calendar; new i18n namespace entries and id-based icon mapping for every event definition/parameter value introduced.
- No impact to V1 (`tacticusplanner`) — its static-image calendar is untouched by this change.
- No impact to authentication, routing structure, or other existing pages.
