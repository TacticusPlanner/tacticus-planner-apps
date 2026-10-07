# Proposal

## Why

`add-legendary-events-hub` gives the Legendary Event page its shell, run status and lane overview. The two jobs V1 users rate highest are still missing: knowing which of their units qualify for which objectives (61% of respondents) and seeing their synced battle progress (66%). This change adds both as sections on the same page, as pure client calculations over data that is already cached, per ADR 0009. It completes Stage 1 of the [Legendary Event V2 plan](../../../../tacticus-planner-docs/ai/planning-artifacts/2026-10-lre-v2-plan.md).

Wording follows the Tacticus player API and the docs glossary: **lane**, **objective**, **run**, **encounter**, **score**.

## What Changes

- **Eligibility leaderboard** section per lane on `/events/legendary-events/:eventId`: every unit the lane allows, owned / locked state with rarity and rank from the roster, which objectives it satisfies, potential points per battle and slot count; sortable; "only unlocked" filter. Ports V1's objective matching (alliance, faction, trait, damage type, min / max hits, attack type) including the damage-profile false-positive exclusions.
- **Synced progress grid** section per lane: battles × (defeat-all + five objectives) cleared from `objectivesCleared`, per-battle encounter points and high score, lane points earned versus maximum.
- **`entities/legendary-event` grows** `objective-match`, `unit-potential`, `lane-points-model` and `synced-lane-progress` libraries, all pure with tests over the real catalog fixtures.
- **i18n**: leaderboard and progress copy and tour steps added to the `legendaryEvents` namespace in en/de/es/fr.
- Out of scope: teams, manual annotations, run inputs, tokenomics, clear-depth estimates, Goals Preview, master table, sharing, analytics events.

## Capabilities

### New Capabilities

- `legendary-event-eligibility`: which units a lane allows, which objectives a unit satisfies (per filter kind, with the damage-profile exclusion rule), potential points and slots per unit, and the leaderboard's content, sorting and filter, on desktop and mobile.
- `legendary-event-synced-progress`: how `lre-progress` lane data maps to battles and objectives, per-battle and per-lane points earned versus maximum, the canonical lane points model, and how stale or missing sync data is presented in the progress grid.

### Modified Capabilities

None. The event page's placement of the two new sections and their tour steps are specified inside the two new capabilities, so this change needs no delta on `legendary-events-hub` (which `add-legendary-events-hub` introduces and must be synced first).

## Impact

- `apps/web/src/fsd/entities/legendary-event/lib/**` (four new libraries and tests), `index.ts` exports.
- `apps/web/src/fsd/pages/events/ui/legendary-event/**` gains `leaderboard/` and `progress/` components for both UI forms; the orchestrator reads the roster (`getPlayerCharacters`) and owns the shared sort / filter state; the tutorial gains two steps.
- `apps/web/public/locales/{en,de,es,fr}/legendaryEvents.json` additions and the namespace test.
- No API change. Depends on `add-legendary-events-hub` (routes, entity, page shell, queries).
- Risk carried from the plan: the `objectivesCleared` index order is asserted against a real synced account during verification; a mismatch means the API must carry an objective map before Stage 3.
