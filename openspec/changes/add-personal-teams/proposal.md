## Why

V1 players keep reusable lineups for Guild War, Guild Raid, Tournament Arena, Horde, Campaign and Incursion, each with its own rules. V2 has nowhere to keep them and V1 import leaves them behind, so a player moving to V2 loses their teams (#26). Teams is also the foundation of the later War Defense and War Offense tools.

Companion change: `add-personal-teams` in `tacticus-planner-api`, which applies first. This is the first slice of #26: War Defense and War Offense follow as their own changes, and guild-wide War Zones stay with #22.

## What Changes

- New sign-in-only **Teams** page at `/my-game/teams`, the last child of My Game. It does not depend on guild membership.
- Players can create, edit, delete and filter up to 20 teams, see them as cards or a table, group them by mode, and reorder them by dragging, as on the Goals board. Each team shows its state as status chips (broken rules, shared units, its rarity cap).
- A new team editor, a large dialog on desktop and a tabbed bottom sheet on a phone, enforces each mode's rules as the player builds: core and flex characters and Machines of War (War and Tournament Arena allow 1 core MoW), Campaign and Incursion restrictions, and a rarity cap saved with the team that marks what in the lineup is under it.
- Teams imported from V1 that break a rule are flagged with translated reasons, and must be fixed the next time they are saved.
- V1 import gains a **Teams** part, with one outcome per V1 team.
- A tour for the new page, and full de, en, es and fr copy.

## Capabilities

### New Capabilities

- `personal-teams`: the Teams page, team cards, filters, ordering, the team editor and its per-mode behavior, and how issues are shown.

### Modified Capabilities

- `app-navigation`: My Game gains a Teams child that requires sign-in. The child lists also name Incursions, which the code already has but the spec omits.
- `v1-profile-import`: the import offers a Teams part and reports per-team outcomes.

## Impact

- New `entities/team`, `features/team-editor` and `pages/my-game/ui/teams`.
- `pages/my-game/route.tsx`, `app/layout/nav-items.ts`, `features/v1-import`, `app/setup-v1-import.tsx` and `pages/v1-import`.
- A new `teams` i18n namespace in every locale, plus keys in `common.json`.
- `shared/api/schema.d.ts`, regenerated from the API contract.
- No game-catalog package change: campaigns, characters, MoWs and Incursions are already served.
- Merges alongside `add-automatic-roster-snapshots`, which adds a part to the same import screen.
