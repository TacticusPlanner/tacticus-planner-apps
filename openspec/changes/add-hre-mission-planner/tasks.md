# Tasks

Companion data fix in `tacticus-planner-api` (no OpenSpec change): the Zapspitta occurrence and the Sekhetar Robot id. It ships first.

## 1. Calendar data (tacticus-planner-api)

- [ ] 1.1 Add the Zapspitta occurrence (`orksWeirdboy`, 2026-10-18T00:00Z to 2026-11-01T00:00Z), correct Sekhetar Robot to `thousSekhetar`, set `dailyAttempts` to 3 for Indomitus I03 to I15 in `CampaignDenormalizer` (confirm in game first), and verify with the catalog tests and `dotnet test`

## 2. Mission tracker (`features/hre-missions`)

- [ ] 2.1 Implement HRE instance selection (running, otherwise next, otherwise none; tie-breaks) in a `.ts` model and verify with unit tests for the window boundary, preview and overlap scenarios
- [ ] 2.2 Add the 21-mission constant (design D1) and objective wording inputs (kind, target, resolved alliance, featured hero, or the generic fallback), and verify with unit tests for Zapspitta's mission 10, an Imperial hero, mission 20 and an unresolved hero
- [ ] 2.3 Implement guarded local-storage progress (`tp.dailies.hre.progress.v1`, clamping, "Mission complete" advance, invalid-data drop) and verify with tests for reload, a new instance and throwing storage
- [ ] 2.4 Build the `MissionTracker` UI (current mission card, progress inputs, done and locked list, all-complete state, read-only preview) and verify with a component test covering the mission 5 scenario
- [ ] 2.5 Add `selectCampaignObjective` and `remainingCampaignBattles`, and verify the 663-battle worked example with a unit test

## 3. Mission guidance (`features/hre-missions`)

- [ ] 3.1 Map each objective kind to its tip key and render tips on the current mission and on expanded missions; verify with a component test for missions 20 and 8
- [ ] 3.2 Implement the tokens-needed calculation and card from synced buckets (short, not unlocked and hidden states), and verify the day-1 worked example and the progress-reduction scenario with unit tests

## 4. Campaign raid suggestions (`features/daily-raids`)

- [ ] 4.1 Implement pure `planMissionRaids`. It counts Today's remaining planned raids first and reserves their energy and attempts. It orders candidates by energy, then goal priority, then id, and fills greedily, capped by the battles left, the budget and the attempts. Verify with unit tests for the plan-covers-part, plan-completes, planned-energy-fills-budget, worked example (3-attempt Indomitus cap), goal tie-break, budget-first and no-candidate scenarios, plus the lightning-victory scenarios (event nodes only, both objectives, no campaign event running)
- [ ] 4.2 Build `HreRaidsSection` (rows reusing `LocationRow`, totals, "battles left after today", empty states including the filtered-out notice, the minimum-energy and days summary) and export it with `planMissionRaids` from the slice's public API; verify with a component test

## 5. Event pace (`features/hre-missions`)

- [ ] 5.1 Add the reward tables and `projectHrePace` (projection chain plus target inverse), and verify with unit tests for the 30,000-point worked example (6,996 currency, tier 21, 480 shards, Epic 1 red), the 28,000-point Epic target, the day-7 pace and Oh So Close
- [ ] 5.2 Add points and rank inputs (stored with progress) and the pace card showing every intermediate value and the target picker; verify with a component test for the no-rank and target-reached states

## 6. Mission teams (`pages/dailies/model`)

- [ ] 6.1 Build the summoner set from `npcAbilityText` and verify with a unit test that Hollan is in it and a non-summoner is not
- [ ] 6.2 Add `useHreTeamRecommendations` (all-alliance, summon-free, featured-hero lead) and its team card, and verify with tests for the all-Xenos, too-few-units, summon-free, locked-hero and roster-failure scenarios

## 7. Page, navigation and tour

- [ ] 7.1 Add `pages/dailies/ui/hre-page.tsx` composing header controls, tracker, guidance and raids per design D5 (desktop grid, mobile single column with collapsed "All missions"), add the `hre` route and nav item after HSE, and verify with page tests that `/dailies/hre` loads directly and that the tab order is Raids, HSE, HRE, Shops, Guild Raids
- [ ] 7.2 Add `useIsHreLive` and the `hre` live indicator on the HRE entry and Dailies, and verify with nav tests for HRE-only, both and neither running
- [ ] 7.3 Add `hre-page.tutorial.tsx` with desktop and mobile steps registered through `useTourPageSteps`, plus its `tour.hre.steps.*` keys, and verify with a tutorial test at both viewports
- [ ] 7.4 Add the new `hre` i18n namespace (objective templates, tips, states, tab label and description) in en, de, es and fr with real translations, register its resource type, and verify with the i18n key-parity test

## 8. Desktop verification (≥768px, Aspire stack, synced account)

- [ ] 8.1 With Zapspitta running, a project with active goals, and progress set to mission 5 at 37 / 100: verify the two-column layout, the raid list order (Indomitus 3-energy first), the totals and the tokens card, the pace card at 14,500 points and rank 3,200, the mission team on mission 14, and the live dot
- [ ] 8.2 With an empty project, and with the Raids Filters hiding Indomitus: verify the fallback ordering and the filtered-out empty state; run the desktop tour

## 9. Mobile verification (<768px, iframe at 420px)

- [ ] 9.1 Verify the single-column order, the collapsed "All missions" toggle, the icon-only header controls and the progress inputs on the same data as 8.1
- [ ] 9.2 Run the mobile tour and confirm every step targets a rendered element

## 10. Gates

- [ ] 10.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`, all clean

## Workflow follow-up

- Archive this change in the PR before merge.
