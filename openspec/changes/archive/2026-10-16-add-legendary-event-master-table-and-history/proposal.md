# Proposal

## Why

Stage 7 of the V2 Legendary Event plan ("Cross-event: master table and history", docs plan §5) closes the last two survey rows of the plan: "cross-event prioritisation" (V1's master table: which units score across every event I care about) and "team reuse" (pain #6: on an event's next run or re-run, show what I cleared last time, with which teams, and what changed on my roster since; "Last time this team cleared battle 6" next to the depth field). Stages 2 and 3 are done, so plans, teams, depths per run and the lane points model exist; Stage 5's clear estimates and Stage 6's shared libs are merged (apps PR #220), so this change builds on `main` with no open dependency.

V1 never kept history (one progress entry and one team set per event), so history starts from what the companion API change records at each sync.

## What Changes

- **Master table** at `/legendary-events/master-table`, a new static child of the Legendary Events section after All events. One row per unit allowed by any selected event; per event its points and objectives count (or, in In teams mode, its team count and lanes); a total; sorted by total descending, with an event to sort by instead. Controls: event picker (default: every active and upcoming event; archived events below a divider), unit set (All, Unlocked, In teams; default In teams when the selected events have any team, else All), points mode (Remaining, the default; All; Estimated) and a name search. Desktop is a table with a sticky unit column; mobile is a card list with the controls in a sheet. No data grid, no persisted column layout. Controls live in the URL query, so back navigation and shared links keep them.
- **Points modes.** All = points per battle × battle count per lane; Remaining = the Stage 1 remaining-points rule; Estimated = remaining points within the battles the unit is expected to clear on that lane (its teams' effective depth in In teams mode, else its Stage 5 per-unit estimate). In In teams mode a unit's points count only the objectives its teams cover on that lane, as V1 did, plus defeat-all.
- **Last run card** on the event page's Overview: the previous run of this event (the newest record that is not the current run) with run number and last played date, per-lane cleared battle and points earned, the teams used with the battle each cleared, and "Since last run" roster changes for those teams' members (rank, stars, ability levels, unlocked). Archived and upcoming events show their newest record as Last run and list older ones under **Earlier runs**.
- **Tier List** at `/legendary-events/tier-list`, a static child after Master table (Severyn, 2026-10-16). It shows the curated horde-mode tier list (S, A, B, C, then a collapsed Untiered row) as tier bands of character tiles with their effective multiplier and an override mark, plus search, Only owned and alliance filters in the URL, tile details with an Open in Library link, and a short explanation of how the multiplier feeds clear estimates.
- **Team card line.** A lane team that also appears in the previous run's teams snapshot shows "Last run: cleared battle 6" beside its depth stepper.
- **Data**: the plan list (`GET /me/legendary-event-plans`) for the master table's team membership, and run records (`GET /me/legendary-event-plans/{eventId}/run-records`) for history.
- **Tour, analytics and i18n**: master table and tier list page tours (desktop and mobile), a Last run step on the event page tour when the card renders, master table and history analytics, all copy in en/de/es/fr.

Out of scope: sharing and export (Stage 8), editing or deleting run records, history for V1 events (V1 has none), objective filters on the master table, a points mode per event, and the V1 "grain of salt" disclaimer (the modes now say what they count).

## Capabilities

### New Capabilities

- `legendary-event-master-table`: the page, its controls and their URL state, row and cell calculations with worked examples, both forms, data states and tour.
- `legendary-event-tier-list`: the Tier List page, tile order and effective multiplier, filters and their URL state, both forms, data states and tour.
- `legendary-event-run-history`: choosing the current, previous and earlier records, the cleared-battle, points and roster-delta calculations with worked examples, the Last run card and Earlier runs list, data states and the tour step.

### Modified Capabilities

- `app-navigation`: the Legendary Events section gains static **Master table** and **Tier List** children after All events.
- `legendary-event-teams`: a team card shows the battle the same team cleared in the previous run.

## Impact

- Companion API change: `tacticus-planner-api/openspec/changes/add-legendary-event-master-table-and-history`; apply API first. Shared contracts: `GET /api/v1/me/legendary-event-plans` (`LegendaryEventPlanListResponse`), `GET /api/v1/me/legendary-event-plans/{eventId}/run-records` (`LegendaryEventRunRecordsResponse`). The Tier List reads the already-served `horde-mode-tiers` dataset, so neither the API nor `packages/game-catalog` changes for it.
- `apps/web/src/fsd/entities/legendary-event/` (`model/run-record.types.ts`, `api/legendary-event-plan.api.ts` list and run-records reads, `api/legendary-event-plan.queries.ts`, `lib/master-table.ts`, `lib/run-history.ts`), `pages/legendary-events/` (new `ui/master-table/` with page, view model, table, list, controls and tutorial; new `ui/tier-list/` with page, view model, tier rows, tile details and tutorial; `entities/legendary-event/lib/horde-tier-list.ts`; `route.tsx`; `ui/legendary-event/overview/last-run-card.tsx`; team card line through the teams feature's props; page tutorial), `features/legendary-event-teams/ui/team-card.tsx` (last-run line prop), `app/layout/nav-items.ts`, locales `legendaryEvents.json` and `common.json` (nav label) in four languages, test fixtures.
- Overlap: none with open changes; Stage 8 will add share actions to the master table.
