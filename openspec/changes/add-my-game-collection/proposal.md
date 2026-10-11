## Why

V1 spreads the player's roster across several pages (Who You Own, bulk goals, unit details). V2 has the synced roster data already but no page that simply shows _which units I own and how far they are_. This change starts the **Collection** feature request (https://tacticusplanner.userjot.com/board/p/collection-who-you-own-page) with its first stage: a read-only Collection page inside a new **My Game** section that becomes the home for all player-state pages.

The feature request is deliberately staged; this change is Stage 1 only:

| Stage | Change (planned)                | Scope                                                                                                                                   |
| ----- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `add-my-game-collection` (this) | My Game section, read-only units list                                                                                                   |
| 2     | follow-up                       | Standalone filters (alliance, faction, rarity, rank, ...) and V1 predefined filters (Ready to Rank Up, Need to Ascend, Can Ascend, ...) |
| 3     | follow-up                       | Unit selection and bulk goal creation                                                                                                   |
| 4     | follow-up                       | Clickable units opening the Library character page, extended with V1 unit details (mythic quest, traits, abilities)                     |
| -     | tracked as a separate issue     | View switching (flat grid, sort options, overlay toggles)                                                                               |

## What Changes

- **BREAKING** The authenticated **Progress** section (`/progress`) is renamed **My Game** and moves to `/my-game`. Its existing children move with it: `/progress/onslaught` → `/my-game/onslaught`, `/progress/campaigns` → `/my-game/campaigns`, `/progress/campaign-events` → `/my-game/campaign-events`. The old `/progress/*` URLs are removed without redirects (V2 is pre-production).
- **My Game** gains a new first child, **Collection** (`/my-game/collection`), which is the section's default child.
- **My Game** becomes visible to anonymous users. Only Collection is available anonymously; Onslaught, Campaigns and Campaign Events remain sign-in only and are hidden from anonymous users everywhere navigation lists children. This introduces per-child anonymous access to the navigation model, which today is only per section.
- The Collection page shows every catalog character and Machine of War in one list, grouped by faction:
  - owned units with everything V1 Who You Own shows by default except power and Blackstone value: rarity frame and stars, rank (characters), XP level, ability levels, equipment (characters), shards and mythic shards;
  - unowned units greyed out with their shard and mythic-shard progress;
  - when no roster is available (signed out, or signed in but not yet synced), every unit greyed out with a prompt to sign in or sync.
- The page is read-only. It does not edit units (V2's roster comes only from Tacticus sync), and units are not clickable in this stage.

Out of scope for this change: filters and name search (Stage 2), selection and bulk goals (Stage 3), unit details and click-through (Stage 4), view switching and sort options (separate issue), power and Blackstone value.

## Capabilities

### New Capabilities

- `player-collection`: The My Game Collection page: which units it lists, how they are grouped and ordered, what each owned, unowned and no-roster tile shows, and its loading, failure, signed-out and not-synced states.

### Modified Capabilities

- `app-navigation`: The Progress section becomes My Game at `/my-game` with Collection as its first, default child; a section can mix anonymous and sign-in-only children; the Legendary Events requirement's references to Progress are updated.

## Impact

- **Apps only.** No API change and no companion `tacticus-planner-api` change: the page reads the existing game catalog (characters, MoWs, unlock shard costs, equipment) and the existing player-data chunks (`characters`, `mows`, `inventory-shards`).
- `apps/web/src/fsd/app/layout/nav-items.ts`, `app-shell.tsx`, the desktop section menu, mobile tab row/drawer and navigation search (per-child visibility); `apps/web/src/fsd/app/routes.tsx` (route move, per-child `ProtectedRoute`).
- `apps/web/src/fsd/pages/progress` is renamed/moved to a My Game page slice; internal links to `/progress/*` are updated.
- New reusable unit tile in an entity slice, which Legendary Events, dailies team lists and later Collection stages can reuse.
- i18n: `progress.*` / `nav.progress*` copy is renamed to My Game in every locale; new Collection and tour copy in en/de/es/fr.
- Tours: new Collection page tour; the general navigation tour mentions My Game instead of Progress.
- `onslaught-progress-entry` spec's Purpose names `/progress/onslaught`; it is updated directly at sync time (a delta cannot change a Purpose).
