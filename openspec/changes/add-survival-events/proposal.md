## Why

V1's Survival page (`/plan/survival`) is one of the most used V1 pages V2 still lacks (3,034 views from 1,118 users in the 30 days to Nov 17). The plan is the "Survival V2 rebuild plan" doc: 13 options Agreed; suggested teams (7) and rewards progress inputs (12) are Later.

Companion change: `add-survival-events` in `tacticus-planner-api`, which applies first (the `survival-events` dataset, Survival calendar dates and `survivalEventKey` on teams).

## What Changes

- A sign-in-only **Survival** tab in Plan at `/plan/survival`, with its own tabs as routes: **Team**, **Enemies**, **Rewards**, **Missions** and **Offers**. `/plan/survival` and an unknown tab go to Team. The event is `?event=`; without it the page shows the running event, else the next one, else the newest past one, else an undated one. An unknown event drops the parameter.
- Above the tabs: an event switcher, the event line (featured hero, dates or "Dates not announced", allowed factions, MoW rule) and "How this event works" (team caps, stamina, stat boost, Last Stand, the global summon, rarity-ups).
- **Team**: the player's team for the event (featured hero first, then the stored lineup), its issues, Edit or Create team (the team editor, Horde only, tied to the event) and a goal line with Create goal per unit.
- **Enemies**: one card per wave with power, round, score, the medal it earns, enemy tiles (with kill points in each enemy's card), clone waves and what clearing it adds. The last wave reads "Final wave" with its number and why in a hint.
- **Rewards**, **Missions**: milestones, progress chests, rarity milestones, how points are scored, daily missions and mission chains, on the same tiles as the event shop's Rewards tab (moved into a shared `widgets/event-rewards`).
- **Offers**: the event pass and other offers with USD price, purchase limit and rewards.
- Teams: the editor and the Teams page read `survivalEventKey`, check the five Survival rules on the client, show the event's caps and factions, and label a Survival team "Survival: December 2026". Past events' teams are labelled, never hidden.
- A `survival` i18n namespace in every locale, a tour, a `survival_tab_viewed` analytics event and the `survival-events` catalog dataset in the game-catalog package.

## Capabilities

### New Capabilities

- `survival-planner`: the Survival page, its event choice and its five tabs.

### Modified Capabilities

- `personal-teams`: Survival teams in the editor and on the Teams page.
- `app-navigation`: Plan gains a Survival child.

## Impact

- `packages/game-catalog`: the `survival-events` dataset, its schema, storage model and a test fixture; three Admech summon portraits.
- New `pages/survival` (the events, their status and every tab; no other slice reads them) and `widgets/event-rewards` (from `pages/dailies`).
- `entities/team` (rules, copy, `useSurvivalEventName`), `features/team-editor`, `pages/my-game` teams, `widgets/battle-preview` (an extra slot in an enemy's card).
- `app/routes`, `app/layout/nav-items.ts`, `shared/api/schema.d.ts` regenerated from the API contract, `shared/analytics`.
