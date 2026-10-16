# Tasks

Companion API change: `tacticus-planner-api/openspec/changes/add-legendary-event-master-table-and-history`. Apply the API change first; this change needs the plan list, the run-records endpoint and the `bloodDante`, `custoTrajann` and `emperLucius` catalog entries in the Aspire stack.

## 1. Entity: data

- [ ] 1.1 Add `model/run-record.types.ts` (record, lanes, encounter, team snapshot, roster unit) and the list type, matching the API OpenAPI artifact; add `listLegendaryEventPlans` and `getLegendaryEventRunRecords` to `api/legendary-event-plan.api.ts` and their queries to `legendary-event-plan.queries.ts`; seed the per-event plan cache from the list; verify `legendary-event-plan.api.test.ts` covers both reads, 404 on run records and the cache seeding.
- [ ] 1.2 Add `model/use-legendary-event-plans.ts` and `model/use-legendary-event-run-records.ts` returning the shared `ReadState` (`loading | failed | ready`); invalidate plan list on every plan write in `use-plan-write-queue.ts`; verify hook tests cover each state and the invalidation.
- [ ] 1.3 Add fixtures for `bloodDante`, `custoTrajann` and `emperLucius` to `@/test/fixtures/legendary-events` and check the lifecycle archives all three; verify `lifecycle.test.ts`.

## 2. Entity: calculations

- [ ] 2.1 Add `lib/master-table.ts` (`buildMasterTable`) with the cell rule, unit sets, the three points modes, totals and ordering derived from cells (design D3); verify `master-table.test.ts` covers every worked example of `specs/legendary-event-master-table/spec.md` with intermediate values (152 / 211 / 189 / 67 per battle; 6,534, 4,608, 11,142; 5,774 and 10,382; 304, 844, 1,148, 1,134, 603, 1,737, 2,885; In teams 3,078), a reserve-only unit, a locked unit in Estimated, and sort by one event.
- [ ] 2.2 Add `lib/run-history.ts` (`selectRunRecords`, `recordLaneSummary`, `recordTeamClearedBattle`, `rosterDeltas`, `recordHistory`) (design D6, D7); verify `run-history.test.ts` covers each classification scenario, the Uthar Alpha example (cleared battle 4; 434, 291, 130, 135, 12 = 1,002), Ultras 2 and Melee 3, a team with no objectives, catalog drift, and the Calgar and Tigurius deltas.
- [ ] 2.3 Export the new libs, hooks and types from `entities/legendary-event/index.ts`; verify `pnpm lint:fsd`.

## 3. Master table page

- [ ] 3.1 Add the `master-table` route before `:eventId` in `pages/legendary-events/route.tsx` and the **Master table** static child after All events in `app/layout/nav-items.ts`; verify the `app-navigation` delta scenarios in the navigation tests (order, catalog pending, search, active child).
- [ ] 3.2 Add `ui/master-table/master-table.view-model.ts`: URL query state with defaults and fallbacks, the derived default unit set, Estimated availability, and the `buildMasterTable` input from the entity hooks (design D2, D4); verify `master-table.view-model.test.ts` covers each URL scenario and default.
- [ ] 3.3 Add `master-table-page.tsx`, `master-table-controls.tsx` (desktop row; mobile bar and bottom sheet with Sort by), `master-table-table.tsx` (sticky unit column, Total and event groups, header sort, internal horizontal scroll) and `master-table-list.tsx` (mobile cards), the "How points work" disclosure and every data state (design D5, D8); verify `master-table-page.test.tsx` covers each scenario of the layout and data-state requirements on both forms.
- [ ] 3.4 Add `master-table.tutorial.tsx` (`useMasterTableTutorial`, registered with `useTourPageSteps`; mobile opens and closes the controls sheet around the picker and points steps) with `tour.legendaryEventsMasterTable.steps.*` keys in en/de/es/fr; verify a tutorial test covers both step lists.
- [ ] 3.5 Add `legendary_event_master_table_viewed` and `legendary_event_master_table_changed`; verify the page test asserts both.

## 4. History on the event page

- [ ] 4.1 Add `ui/legendary-event/overview/last-run-card.tsx` (`data-testid="legendary-event-last-run"`; desktop lanes side by side, mobile stacked with "Teams (N)" toggles; Since last run list; Earlier runs collapsed on archived and upcoming events; every data state) and place it after Run status; verify `last-run-card.test.tsx` covers each scenario of the card and data-state requirements.
- [ ] 4.2 Compute each lane team's last-run cleared battle in `legendary-event-page.view-model.ts` and pass it to `TeamCard` through a new `lastRunClearedBattle` prop in `features/legendary-event-teams` (beside the depth on desktop, wrapped below on mobile); verify `team-card.test.tsx` covers the three `legendary-event-teams` delta scenarios and `pnpm lint:fsd` shows no import of run records in the feature.
- [ ] 4.3 Add the conditional Last run step after Run status in `legendary-event.tutorial.tsx` with `tour.legendaryEvent.steps.lastRun.*` in en/de/es/fr; verify the tutorial test covers the step present and skipped.
- [ ] 4.4 Add `legendary_event_last_run_viewed` (once per page view on first visibility) and `legendary_event_earlier_runs_expanded`; verify tests.

## 5. i18n

- [ ] 5.1 Add every new string (master table controls, modes and explanations, cells, empty and error states, Last run card, Earlier runs, Since last run lines, team card line) to `legendaryEvents.json`, and the nav label and description to `common.json`, with real de/es/fr translations in all four locales; verify the locale key-parity test.

## 6. Desktop verification (viewport ≥ 768px)

Data states needed: a signed-in synced account with Uthar plans holding teams, an account with no plans, and run records for Uthar (current and previous) and Dante (three records) seeded through the API.

- [ ] 6.1 Master table: defaults, event picker with archived below the divider, each unit set and points mode against the worked figures, header sort, search, internal horizontal scroll with the sticky column, tour.
- [ ] 6.2 Event page: Last run card on Uthar (current run 2), Earlier runs on Dante, team card last-run line, the history tour step present and skipped.

## 7. Mobile verification (viewport < 768px, same-origin iframe)

- [ ] 7.1 Master table: Controls sheet with Sort by, unit cards and per-event lines, no horizontal scroll, tour opening and closing the sheet.
- [ ] 7.2 Event page: stacked Last run card with Teams toggles, team card line wrapped under the stepper, history tour step.

## 8. Shared verification

- [ ] 8.1 Empty and failure states: plan list failed, run records failed, no records, first recorded run, roster unknown, Estimated unavailable.

## 9. Gates

- [ ] 9.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check`.
