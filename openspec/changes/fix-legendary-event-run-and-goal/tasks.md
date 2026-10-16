# Tasks

Paths are under `apps/web/src/fsd` unless stated. Commands from the repository root (`pnpm --filter web exec vitest run <file>` for one file). Requires the API half deployed (served run schedule) for the staging checks in group 6; unit tests need no API.

## 1. Run resolution

- [ ] 1.1 Add `entities/legendary-event/lib/run-resolution.ts` exporting `resolveLegendaryEventRuns` (inputs: lifecycle, the schedule, the synced run, whether the synced entry shows progress, the clock; outputs `kind`, `endedRuns`, `currentRun`, `nextRun`, `nextStartMs`) and export it from `entities/legendary-event/index.ts` (spec: runs are resolved from the run schedule and the clock; the synced run wins while a run is in progress; the run can be unknown). Verify: `run-resolution.test.ts` covers every scenario of those three requirements (Uthar between runs → 2 ended, next 3; Lysander → 1 ended, next 2; Fabius before run 1; between announced runs; every run ended; synced run beats the schedule; active without a synced run; Farsight unknown; progress with only a future date; fresh event).
- [ ] 1.2 Rework `lib/current-run.ts`: keep `currentLegendaryEventRun` as the depth-key adapter (`currentRun ?? nextRun ?? 1`) taking the resolution, update its doc comment (the synced run is no longer the only source) and its callers' types. Verify: `current-run.test.ts` passes with new cases for between runs (next run) and unknown (run 1).
- [ ] 1.3 Update the doc comment on `eventStageStartDatesUtc` in `packages/game-catalog/src/schemas/lre.ts` and its test fixtures to say the index is the run number minus one (shape unchanged). Verify: `pnpm --filter @workspace/game-catalog exec vitest run` passes.

## 2. Consumers of the run

- [ ] 2.1 In `features/legendary-event-tokens/lib/token-supply.ts` build the run states from the resolution (Done for ended runs, Now, Next, Planned; unknown = one Next run; none when all three ended) instead of `lastEnded` from the synced run (spec: token supply per run). Verify: `token-supply.test.ts` asserts the Uthar between-runs case (runs 1 and 2 Done, run 3 Next with 68), the Lysander case (run 1 Done, run 2 Next), the unknown case (one Next run of 68), the active worked supply unchanged (run 2 Now with 32, run 3 Planned 68) and the all-ended case (no supply).
- [ ] 2.2 In `token-plan-view.ts` and the Next token card pass the next run (or the unknown flag) and render "for when run N starts" / "for when the next run starts"; add the key to `public/locales/{en,de,es,fr}/legendaryEvents.json` with real de, es and fr translations. Verify: `next-token-card.test.tsx` and `token-plan-view.test.ts` assert "for when run 3 starts" for Uthar between runs and the unknown copy for an event with progress and no dates; locale files carry the new key in all four languages.
- [ ] 2.3 In `reward-projection.ts` replace `futureRuns = RUNS.filter(run > currentRun)` with the resolution (runs after the run in progress; runs from the next run between runs; none when unknown or all ended; all three without a synced entry) (spec: reward projection, future runs). Verify: `reward-projection.test.ts` asserts that between runs run 2's missions are not counted (run 3 only, 250) and that the unknown state counts no future inputs.
- [ ] 2.4 In `features/legendary-event-tokens/lib/run-forecast.ts` and its card use the unknown header "By the end of the next run: …" (localized in four languages) and the one-run supply. Verify: `run-forecast.test.ts` and the Run forecast component test show the unknown header and a single Next block.
- [ ] 2.5 Pass the resolved run to the teams feature (depth reads and writes), `master-table.ts` (`currentLegendaryEventRun` at line 244 of the file today) and `pages/legendary-events/ui/legendary-event/legendary-event-page.tsx`. Verify: teams and master-table tests assert a depth saved for an upcoming event is written under the next run (3 for Uthar) and read back, and that the unknown state writes to run 1.

## 3. Reward goal from the unit's step

- [ ] 3.1 In `reward-projection.ts` add the step-to-progression table (`unlock` → `Legendary:RedThreeStars`, `fourStars` → `Legendary:RedFourStars`, `fiveStars` → `Legendary:RedFiveStars`, `blueStar` → `Legendary:OneBlueStar`, `mythic` → `Mythic:OneBlueStar`, `twoBlueStars` → `Mythic:TwoBlueStars`), a function giving a unit's next step from its roster `progressionIndex` (`unlock` when absent), and a `fromStep` parameter on `nextAscensionStep` (spec: reward projection, goal). Verify: `reward-projection.test.ts` asserts the table against the game-domain progression order (a missing state fails) and the next step for an unowned unit, a unit at `Legendary:RedThreeStars` (fourStars), at `Legendary:OneBlueStar` (mythic) and at `Mythic:TwoBlueStars` (every step reached).
- [ ] 3.2 Thread the unit's roster record (`unitSnowprintId` of the event) into the projection and the run forecast so both start from the same step; the forecast's `stepsBetween` markers and "steps reached" use `fromStep`. Verify: the worked Uthar owned-unit scenario passes (4 stars at 120, 25 shards, 4 chests to 21, 5,250 currency, 1,611 points to 14,750, 9.8 battles per lane) and the existing worked scenarios pass with the unit not in the roster.
- [ ] 3.3 Update the Run status card tests: Uthar (owned) shows "Next: 4 stars · 25 / 120 shards", "4 more chests (5,250 currency in total)" and "1,611 points to reach 14,750 · about 9.8 battles per lane"; Fabius (not owned) stays "Next: Unlock · 0 / 400 shards", "16 more chests (3,350 currency in total)", "13,000 points to reach 13,000". Verify: the page and card tests pass.

## 4. Fixtures and parity

- [ ] 4.1 Update `reward-projection.test.ts`, `run-forecast.test.ts` and page fixtures so the existing worked examples state the unit not in the roster, and add the V1 parity cases (Dante 13,000 and 12,500) with the unit not in the roster. Verify: all pass and `grep -rn "currentEventRun" features entities` shows no consumer that still treats the synced run as the only source.
- [ ] 4.2 Run `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `pnpm test:run`. Verify: all four succeed.

## 5. Documentation

- [ ] 5.1 In `tacticus-planner-docs`, update the Legendary Event feature spec and architecture note: the catalog serves run starts by run, the run is derived client-side, the synced run is null between runs, and the unknown state. Verify: the docs lint passes and the old statement ("between runs the synced run is the run that last ended") no longer appears.

## 6. Verification on staging (after the API half is deployed with the dates)

- [ ] 6.1 At 1280px and in a same-origin 420px frame, open `votanUthar`: the Next token card ends "for when run 3 starts", the forecast marks runs 1 and 2 Done and run 3 Next, the reward outlook reads "Next: 4 stars · 25 / 120 shards · 4 more chests · 1,611 points to reach 14,750", and a depth set on a team is stored for run 3. Verify: figures match the spec and V1's Uthar page.
- [ ] 6.2 Open `lostaBile` (before run 1), `tauFarsight` (runs 1 and 2 ended, next run 3) and `astarLysander` (run 1 ended, next run 2): Fabius reads run 1 and its reward outlook is unchanged; Farsight and Lysander show "for when run 3 starts" and "for when run 2 starts". The unknown state has no live event once the dates are in, so it is covered by the unit and component tests. Verify: each page matches the spec's scenarios and no wrong run number appears.

## Workflow follow-up

- Archive this change together with the API half after staging is verified.
- Revisit the open question on carrying manual depths across runs when users ask.
