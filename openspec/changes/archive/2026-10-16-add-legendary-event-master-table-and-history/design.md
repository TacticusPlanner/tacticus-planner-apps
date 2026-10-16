# Design

## Context

- Companion API change: `tacticus-planner-api/openspec/changes/add-legendary-event-master-table-and-history`. It adds `GET /me/legendary-event-plans` (every stored plan, existing plan shape), `GET /me/legendary-event-plans/{eventId}/run-records` (records newest first: `run`, `startedAt`, `progressAt`, `points`, `lanes` with compact encounters, `teams` snapshot with the run's depth, and `rosterSnapshot`: the run's whole owned roster as a row of the API's new general `roster_snapshots` table, or null if removed) and keeps stored plans readable after their event leaves the catalog. Finished events are not added to the catalog (Severyn, 2026-10-16). A record holds the state as of the last sync that changed that run's progress.
- `entities/legendary-event` already provides `unitLanePotential` (points per battle, objectives count, satisfied indexes), `remainingLanePoints`, `buildLanePointsModel`, `buildSyncedLaneProgress`, `derivedTeamCoverage` (whose intersection with a team's stored objectives is the set that counts, the Stage 2 rule), `teamDepthForRun`, `teamEffectiveDepth`, `teamClearEstimate`, `unitClearEstimate` (null for a unit the roster lacks), `laneBattlePowers`, `currentLegendaryEventRun`, the lifecycle (`active` / `upcoming` / `archived`) and `useLegendaryEvents`, `useLegendaryEventsProgress`, `useClearEstimateConfig`. Plans are read per event with `legendaryEventPlanQueries`.
- The Legendary Events section's children are All events (static) plus one dynamic child per catalog event (`nav-items.ts`, `use-nav-items.ts`). The event page's Overview tab holds the Next token card, Run status, Token plan, lane summary and cross-lane leaderboard; a lane tab holds the lane overview, Teams, Upgrade impact, the progress grid and the leaderboard.
- `@workspace/game-catalog/queries` `getHordeModeTiers()` returns the single `horde-mode-tiers` record (tiers S, A, B, C with multipliers; characters with a tier and optional override) or null; `useClearEstimateConfig` already reads it for Stage 5 estimates. Today 21 of 119 catalog characters are tiered.
- V1 master table (`tacticusplanner` `src/fsd/1-pages/plan-lre/master-table.tsx`): ag-grid, one row per unit, Total points and slots, one column group per selected event; event multi-select defaulting to unfinished events with finished ones below a divider; unit set All / Unlocked / Selected (default Selected when any team exists); in Selected mode points are `objective points × battles` (All) or `× (battles − cleared)` (Unearned) over the objectives of the unit's teams, without kill points, and slots become "times selected"; Estimated exists only on V1's per-event points table. V1 has no history.

## Goals / Non-Goals

**Goals:**

- One page that ranks units across the events the user picks, in the same points vocabulary as the event page.
- Show the horde-mode tier list that drives clear estimates, so users can see why a unit estimates high or low.
- On a run after the first, answer "what did I clear last time, with which teams, and what is different now" without leaving the event.
- One canonical result per calculation, with summaries derived from it.

**Non-Goals:**

- Editing history, history for V1 events, or history before the first synced run.
- Persisting master table settings beyond the URL.
- A data grid, column resizing or column visibility controls.

## Decisions

**D1. Slices and public API.** Pure calculations live in `entities/legendary-event/lib`, because they read only entity types and game-domain:

- `master-table.ts`: `buildMasterTable(input) → MasterTable { events: MasterTableEvent[], rows: MasterTableRow[] }`. A row is `{ unitId, owned, total, cells: Record<eventId, MasterTableCell> }`; a cell is `{ points, objectivesCount, teamCount, laneIds, lanes: Record<laneId, { points, depth | null }> }`. Totals and the sort are derived from cells, never computed separately. Input: events, catalog units, roster, plans by event id, synced progress by event id, battle powers by lane, clear-estimate config, unit set and points mode.
- `horde-tier-list.ts`: `buildHordeTierList(record | null, characters, roster, filters) → HordeTierList { rows: { tier, multiplier, units: { unitId, multiplier, overridden, owned }[] }[], untiered: { unitId, owned }[] } | null` (null when the dataset is absent). Effective multiplier and order come from here only; `clearEstimateConfig` keeps its own read of the same record for estimates, and a shared `effectiveHordeMultiplier(record, unitId)` helper is extracted so both use one rule.
- `run-history.ts`: `selectRunRecords(records, lifecycle, progressEntry) → { current, previous, earlier[] }`, `recordLaneSummary(record, lane) → { clearedBattle, points }`, `recordTeamClearedBattle(team, recordLane)`, `rosterDeltas(recordRoster, roster, unitIds) → RosterDelta[]`, and `recordHistory(record, event, roster) → RunHistory` (lanes, teams, deltas) as the one structure the card renders.

The read hooks `useLegendaryEventPlans()` (list) and `useLegendaryEventRunRecords(eventId)` live in `entities/legendary-event/model`, with types in `model/run-record.types.ts` (wire `Dto` suffix only on request bodies, as in `plan.types.ts`). The page `pages/legendary-events/ui/master-table/` composes the lib with the entity hooks; the Last run card lives in the event page's `overview/`. The team card's last-run line is a `lastRunClearedBattle` prop on `features/legendary-event-teams` `TeamCard`, computed by the page from the entity lib, so the teams feature never reads run records.

**D2. Master table state and its owner.** The page owns its state in the URL query: `events` (comma-separated ids), `units` (`all` | `unlocked` | `inTeams`), `points` (`remaining` | `all` | `estimated`), `sort` (an event id, absent for total) and `q` (name search). Absent or invalid values fall back to defaults: events = every `active` and `upcoming` catalog event (hub order); unit set = `inTeams` when any plan of the selected events has a team, else `all` (V1 parity), re-derived only while `units` is absent; points = `remaining`; sort = total. An unknown event id in `events` is dropped. The state is not shared with the event pages and is not stored elsewhere; leaving and returning through the nav restores it only through browser history.

**D3. Cell calculation.** For unit `u`, event `e`, lane `l` (lanes that do not allow `u` contribute nothing):

- `potential = unitLanePotential(u, l)`.
- **Objectives considered**: All and Unlocked sets use `potential.satisfied`. In teams uses the union, over `u`'s non-reserve memberships on `l` in the plan, of each team's stored `objectiveIndexes` ∩ `derivedTeamCoverage` of its members, intersected with `potential.satisfied`; a unit only in reserve on `l` counts no objectives there.
- **All**: (`killPoints` + Σ considered objective points) × battle count.
- **Remaining**: as All per battle, minus defeat-all where synced id 0 is cleared and minus each considered objective cleared in that battle (the Stage 1 rule `remainingLanePoints` with the considered set).
- **Estimated**: Remaining restricted to battles `1..d`, where `d` is, in In teams, the deepest `teamEffectiveDepth` (current run's stored depth, else the team estimate) among `u`'s teams on `l`; otherwise `unitClearEstimate(u).depth`. No depth (locked unit, estimate unavailable) gives 0 on that lane.
- Cell `points` = Σ lanes; `objectivesCount` = Σ lanes of `potential.objectivesCount` (V1 slots summed over tracks); `teamCount` = distinct teams of the event's plan holding `u` as member or reserve; `laneIds` = their lanes.
- Row `total` = Σ cells of selected events. Rows are units allowed on at least one lane of a selected event, filtered by unit set (Unlocked: owned in the roster; In teams: `teamCount > 0` in some selected event) and by `q` against the localized name. Order: the sort key (total or one event's points) descending, then total, then localized name.

In teams deliberately keeps defeat-all, which V1 left out, so the figures match the event page's leaderboard rule.

**D4. Estimated needs estimates.** Estimated is offered only when the clear-estimate config and every selected event's battle powers are ready. While they load the option shows a spinner; when they fail it is disabled with "Needs clear estimates", and a URL `points=estimated` falls back to Remaining with that note.

**D5. Desktop and mobile split.**

- **Desktop** (≥768px): a controls row (event picker popover with checkboxes in hub order, archived below a divider; unit set segmented control; points mode segmented control; search) above a table. The first column (portrait, name, rarity and rank) is sticky; then Total (points, objectives); then one column group per selected event headed by the event unit's portrait and name, with Points and Objectives (In teams: Teams with lane chips). Clicking an event header sorts by it; clicking Total restores the default. The table scrolls horizontally inside its container; the page never scrolls horizontally.
- **Mobile** (<768px): a compact bar with the search field and a **Controls** button opening a bottom sheet with the same controls plus a **Sort by** select (Total or an event). Each unit is a card: portrait, name, rarity and rank, total; below it one line per selected event ("Lysander · 5,774 · 5 objectives", or "· 2 teams · Alpha, Gamma" in In teams). No horizontal scroll.
- **Tour** targets are shared `data-testid`s (`master-table-controls`, `master-table-events`, `master-table-points-mode`, `master-table-first-row`). On mobile `master-table-controls` is the Controls button; the tour opens the controls sheet before the picker step and closes it before the first-row step, so the picker and points mode keep the same ids inside the sheet. Desktop and mobile therefore differ only in when the sheet is open, not in selectors.

**D5b. Tier List layout and state (Severyn, 2026-10-16).** The page `pages/legendary-events/ui/tier-list/` reads `getHordeModeTiers` and the catalog characters, keeps `q`, `owned` and `alliance` in the URL query (own state, not shared with other pages), and renders: on desktop, horizontal bands with a fixed-width coloured tier cell (S/A/B/C colours from design tokens, never raw Tailwind colours) and wrapping tiles with portrait, name and multiplier, tile details in a popover; on mobile, a compact bar (search, Filters button opening a bottom sheet), full-width tier sections with a four-column tile grid (portrait and multiplier, truncated name), tile details in a bottom sheet. Tour targets are shared `data-testid`s (`tier-list-row-S`, `tier-list-first-tile`, `tier-list-filters`; the mobile Filters button carries `tier-list-filters`), so the forms differ only in layout. Untiered starts collapsed because it holds most of the roster.

**D6. Which record is "last run".** `selectRunRecords`: with records newest first, when the event is `active` and the newest record's `run` equals the synced `currentEventRun`, the newest is `current`, the next is `previous`, the rest `earlier`. Otherwise (event not active, or no current record yet) there is no `current`, the newest is `previous` and the rest `earlier`. The Last run card renders `previous`; Earlier runs (collapsed, archived and upcoming events only) list `earlier`. Active events show only Last run, because one prior run is what the next run needs.

**D7. Record calculations.**

- **Lane cleared battle** = the highest 1-based battle `b` whose encounter has defeat-all (id 0) in `objectivesCleared`; 0 when none.
- **Lane points** = Σ over the record's encounters of the Stage 1 earned-points rule (high score + defeat-all score when cleared + catalog scores of cleared bonus objectives), using the current catalog lane. A record whose lane count no longer matches the catalog (catalog drift) shows cleared battles but no points.
- **Team cleared battle** = the highest `b` whose encounter clears defeat-all and every objective id `index + 1` of the team's snapshot `objectiveIndexes`; a team with no objectives uses the lane cleared battle. The figure is inferred from shared lane progress, since the game does not report which team cleared what; the card says "cleared up to".
- **Roster deltas** for the distinct members and reserves of the record's teams, comparing the unit in the record's `rosterSnapshot` (`characters` or `mows`) with the current roster: `unlocked` (absent then, owned now), `progression` (from → to, when the current `progressionIndex` is later), `rank` (from → to, when later; with applied upgrades ignored), `abilities` (each ability whose level rose, from → to). Units unchanged are omitted; a unit absent from both is omitted. Lower values (never expected) are ignored.

**D8. Data states.**

- Master table: catalog loading (skeleton rows) vs failed (error with retry); plans list loading (team columns and In teams spinner) vs failed (In teams disabled with "Teams unavailable", team counts hidden); roster unknown (Unlocked disabled with "Sync your roster", Estimated disabled); no events selected ("Pick at least one event"); no rows after filters ("No unit matches"); synced progress failed (Remaining equals All, labelled "no synced progress").
- History: a record whose `rosterSnapshot` is null (no Since last run list, "Roster at the time is unavailable"); records loading (card skeleton); read failed ("History unavailable" with retry, nothing else on the page affected); no previous record (the card is not rendered on an active event's first recorded run; on an event with no records at all, a one-line "History starts with your next synced run" note sits where the card would); no teams in the record ("No teams were planned for this run" and no deltas list); roster unknown (deltas hidden with "Sync your roster to compare").

**D9. Analytics.**

- `legendary_event_master_table_viewed` (eventCount, unitSet, pointsMode).
- `legendary_event_master_table_changed` (control `events` | `unitSet` | `pointsMode` | `sort`, value or eventCount).
- `legendary_event_last_run_viewed` (eventId, run, teamCount, deltaCount), once per page view when the card is first visible.
- `legendary_event_earlier_runs_expanded` (eventId, recordCount).

## Risks / Trade-offs

- [History depends on syncs during the run] → the empty state says history starts with synced runs; the card shows the date of the last progress it saw.
- [Team cleared battle is inferred from lane progress] → labelled "cleared up to", with the lane figure beside it.
- [The master table can be wide with many events] → the column group per event is narrow (two figures), and the table scrolls inside its container; mobile uses cards.
- [In teams counts defeat-all, unlike V1] → documented in the explanation disclosure; it matches the event page.

## Migration Plan

Client-only on this side. No stored client data changes; the URL query is new.

## Open Questions

- None blocking. Whether the master table should also offer an objective filter waits on feedback.

## V1-parity checklist

- Kept: one row per unit, Total plus a column group per event, event multi-select with finished events below a divider, unit set All / Unlocked / In teams with V1's default, points modes Remaining (V1 unearned) / All, team count per event (V1 "times selected").
- Redesigned: Estimated is offered on the master table (V1 had it only on the per-event points table) and uses V2 depths; the grid is a plain table on desktop and cards on mobile; state lives in the URL query (V1 kept only the points mode there); In teams points include defeat-all.
- Dropped: ag-grid sorting on every column (sort by total or one event instead), the Rarity/Rank expand toggle (always shown), row classes by rank colour, the "grain of salt" disclaimer (replaced by the "how points work" disclosure).
- Icons: unit portraits and event unit portraits from the existing catalog id mapping; objective icons are not shown on this page.
