# Proposal

## Why

The product owner used the shipped Legendary Event page (`add-legendary-events-hub`, `add-legendary-event-progress`) on a real account during Uthar run 2 and found it hard to use and wrong in one place. The synced grid showed `30 / 469` for a battle with defeat-all and two bonus objectives cleared; `30` was the battle's high score, so the synced `encounterPoints` the grid reads does not sum cleared objectives. Reaching an event takes a section, a hub list and a card; on mobile the lane tabs scroll away, and the progress grid sits below a ~100-row leaderboard. The leaderboard's sort options, "Slots" wording and check-mark indicators add noise without answering the question the owner asked: "how many points can this unit still earn for me?"

This change is the **Stage 1 follow-up** recorded in the docs plan (`tacticus-planner-docs` PR #10, `ai/planning-artifacts/2026-10-lre-v2-plan.md` §5 "Stage 1 follow-up") and amends [ADR 0010](../../../../tacticus-planner-docs/decisions/adr/0010-events-navigation-section.md). Wording follows the docs glossary: **lane**, **objective**, **objectives count** (not "slots"), **remaining points**, **earned points**.

## What Changes

- **Navigation**: the generic Events section becomes a dedicated **Legendary Events** top-level section at `/legendary-events`. Its secondary nav is data-driven: one item per **active** event (character name and portrait) linking to `/legendary-events/:eventId`, plus **All events** (the hub). The old `/events/*` routes are removed without redirects (V2 is pre-production, `tp-destructive-changes-policy`); they fall through to the app's existing not-found handling.
- **Event page tabs**: one tab strip, **Overview** first, then Alpha / Beta / Gamma, on both UI forms. The strip is sticky under the page header on mobile. Overview holds the Run status card, a per-lane summary (earned of maximum, battles fully cleared) that jumps to that lane's progress grid, and a cross-lane eligibility leaderboard. A lane tab shows, in order, lane overview → synced progress grid → eligibility leaderboard. Desktop no longer renders the three lanes side by side; it uses the same tab strip.
- **Earned points**: per battle = high score + Σ catalog scores of the cleared bonus objectives from `objectivesCleared`; lane and event totals derive from that. `encounterPoints` is no longer displayed.
- **Objective icons**: the V1 icon set. Negated objectives get the red-X overlay; hits objectives use the game's hit stat icon with a ≥ / ≤ badge; ranged / melee use the game's attack stat icons; defeat-all uses V1's defeat-all icon. Leaderboard cards show these icons (muted when not satisfied) instead of check marks.
- **Leaderboard**: "Slots" becomes **Objectives**; the sort control is removed (always points descending); an **objective multi-select filter** keeps units satisfying every selected objective; a **Deduct scored points** toggle, on by default, shows **remaining points** (per objective per battle) instead of points per battle.
- **i18n**: new and changed copy in `legendaryEvents` and `common` namespaces, en/de/es/fr; tour steps updated for the tab strip.
- **Out of scope**, deferred as the docs plan says: the per-unit clear estimate and the catalog-curated efficiency coefficient (a paired api → apps change once the dataset exists); the unit-card three-dots menu, which the owner keeps with its first action (Create goal) in Stage 6 so no empty menu ships now; teams, annotations, run inputs, tokenomics.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-navigation`: the Events section is replaced by a Legendary Events section at `/legendary-events` whose secondary nav lists active events dynamically plus All events; the old `/events*` paths are removed.
- `legendary-events-hub`: hub and event routes move under `/legendary-events`; the event page becomes a tab strip (Overview + lanes) with a sticky mobile strip and an Overview tab; Home links follow; tours follow the new structure.
- `legendary-event-eligibility`: "slots" becomes objectives count; remaining points per unit given synced progress; leaderboard section rules (points-only order, objective filter, Deduct scored points toggle, icon indicators, placement after the progress grid, cross-lane variant on Overview).
- `legendary-event-synced-progress`: earned points derive from high score + cleared objective scores, not `encounterPoints`; grid placement before the leaderboard; V1 icon set in the header; per-lane summary on Overview.

## Impact

- `apps/web/src/fsd/app/layout/nav-items.ts`, `resolve-active-navigation.ts`, `section-tabs.tsx`, `desktop-section-navigation.tsx`, `general.tutorial.tsx` and their tests: a section whose children are resolved at runtime.
- `apps/web/src/fsd/app/routes.tsx`, `pages/events/*` → `pages/legendary-events/*` (rename), no `/events/*` routes remain; `pages/home/ui/events-widget` links.
- `apps/web/src/fsd/entities/legendary-event/lib/*`: `unit-potential` (objectives count, remaining points, objective filter), `synced-lane-progress` (earned points), `objective-label` / `ui/objective-icon` (V1 icons, negation, defeat-all); new icon assets.
- `apps/web/public/locales/{en,de,es,fr}/legendaryEvents.json` and `common.json`.
- No API change. Companion `tacticus-planner-api` change: none for this change; the coefficient dataset is its own later pair.
- The archived `add-legendary-event-progress` main specs are modified here, as its archive note anticipated.
