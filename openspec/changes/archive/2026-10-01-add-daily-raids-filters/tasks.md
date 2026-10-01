## 1. Catalog schema (depends on the API change being applied first)

- [x] 1.1 Add `alliesAlliance` (`z.enum(Alliance)`) and `alliesFactions` (`z.array(factionIdSchema)`) to `campaignBattleViewSchema` in `packages/game-catalog/src/schemas/campaign.ts`; update record types and every fixture/builder that constructs a battle view
- [x] 1.2 Verify against the real served `campaign-battles` payload (API change running locally) that every battle has a non-empty `alliesFactions`

## 2. Filter model and matcher

- [x] 2.1 Add `RaidsFilters` domain type (upgrade rarities are `Rarity[]` only), `emptyRaidsFilters`, and `countActiveFilterGroups` under `features/daily-raids/model/raids-filters/`
- [x] 2.2 Port V1 `passLocationFilter` as a pure function (slots default 5, rarity only restricts upgrade materials) with unit tests mirroring V1 `upgrades.service.spec.ts` cases (min/max count, enemy types, slots, campaign type, alliances/factions, combined); allies read from the battle's catalog fields
- [x] 2.3 Add the campaign-type mapping (design Decision 6): `Elite` = `Elite`/`EliteMirror`; `Mirror` = `Mirror`; `Extremis` = `Extremis`; `Standard` = `Standard` in event-release groups; `Normal` = `Standard` in standard-release groups except Early; `Early` = group `campaign1` `Standard` with `energyCost` 5. Test over every real catalog battle: each maps to exactly one option, except Indomitus SuperEarly nodes (`energyCost` below 5) which map to none, as in V1

## 3. Engine integration (Today, Bonus and HSE tab only)

- [x] 3.1 Add optional `FarmNodeFilter` `(battleId, resourceId) => boolean` to `selectFarmNodes`/`classifyNeed`: pick the least-energy tied set first, then drop failing nodes; goal-pinned `farmingLocationIds` are filtered like any other set (no bypass); a non-empty pick that is fully removed yields blocker `FilteredOut`, flagged `pinned` when the goal has `farmingLocationIds`
- [x] 3.2 Add `nodeFilter?` to `EstimatePlanParams`/`runPlanSchedule` only; no other caller of `estimateGoal`/`selectFarmNodes` passes it (Goals, Insights, previews, `shard-energy-estimate.ts`, urgency stay unfiltered)
- [x] 3.3 (REOPENED: wording was wrong, the HSE tab no longer runs the day loop, so no node score is accepted; the tied-node score was removed with the HSE rework, see `add-home-screen-event-tracking` 3.1 and 3.2) In `calculateDailyRaids`, run `estimateTodaySchedule` and `estimateBonusRaids` with `nodeFilter` and `estimatePlanSchedule`, blocked goals and urgency without it; expose the Today run's `FilteredOut` blockers (with the `pinned` flag) as a Today-only view-model field; hand the built `nodeFilter` to the HSE farm list (a filter-then-pick candidate rule there); export `buildFarmNodeFilter`, `useRaidsFilters`, `passLocationFilter` and the notice component for reuse by the HSE tab
- [x] 3.4 Add `"FilteredOut"` to `EstimateBlockedReason` (`estimate.domain.ts`, `estimate-blocked.ts`) and handle it in every exhaustive consumer (compile-time check); Today shows a filtered-out notice with a Reset action, worded separately for pinned goals (design Decision 3); Plan and Goals blocker UI never receive it
- [x] 3.5 Engine tests: filter removes the cheapest node (blocked, no fallback) for an upgrade and for a character shard; a tied node that passes keeps the material scheduled; preferred node passes (unchanged); empty filter identical; a goal pinned to a failing node is blocked `FilteredOut` with `pinned` set and is not bypassed, while a pinned goal whose node passes is scheduled; with a filter, Today/Bonus change while `planDays`, `blockedGoals` and urgency are identical to the unfiltered run
- [x] 3.6 Confirm `plan-surface-agreement.test.tsx` and existing daily-raids/goal-farming tests pass unchanged; add a case that Goals and Schedule still agree while a filter is active

## 4. Persistence

- [x] 4.1 Add `useRaidsFilters()` (localStorage `raids-filters.v1`, zod-validated, try/catch, shared subscription across mounts and tabs)
- [x] 4.2 Tests: round trip, invalid data falls back to empty, storage throwing, two consumers stay in sync

## 5. UI

- [x] 5.1 Decide/reuse a multi-select checkmark component (search `shared/ui` and `@workspace/ui` first); add if absent, with icon-chip summary
- [x] 5.2 Build `RaidsFiltersDialog` on `responsive-dialog` with the four sections, draft state, Close/Reset/Apply, faction options limited by alliance, Min/Max searchable selects, data-derived fields disabled while battles load; rarity options Common to Mythic only
- [x] 5.3 Build `RaidsFiltersTrigger` with active-count badge; mount on `today-page.tsx` beside Planning Settings (not on Schedule); the same component is exported for the HSE tab, which mounts it in `add-home-screen-event-tracking`
- [x] 5.4 Wire `useRaidsFilters` into `use-daily-raids.ts` (the Home raids widget inherits the filtered Today); export from `features/daily-raids/index.ts`
- [x] 5.5 Add `en` i18n (dailies `raidsFilters.*`, filtered-out notice in both auto-picked and pinned-goal wordings, alliance and campaign-type labels) using id-keyed namespaces; other languages fall back
- [x] 5.6 Icons: alliance/faction/rarity by id with `EntityIcon` fallbacks; copy missing alliance assets from V1 `src/assets/images` into `public/game_catalog` or document the text fallback
- [x] 5.7 Tour: add a filters step to the Today tutorial, or record why not
- [x] 5.8 Verify light and dark, mobile and desktop

## 6. Tests and verification

- [x] 6.1 Dialog tests: draft vs Apply vs Close vs Reset, faction-by-alliance narrowing, badge count, loading state
- [x] 6.2 Today render tests: trigger present at both breakpoints, filter changes the rendered raids and shows the filtered-out notice, including the pinned-goal wording when a pinned goal's node fails; Schedule has no trigger and ignores the filter; Home widget follows Today. The HSE-tab scenarios of the filters spec are implemented and tested by `add-home-screen-event-tracking` (applied after this change)
- [x] 6.3 Run the `apps/web` and `packages/game-catalog` test suites, lint and typecheck
- [x] 6.4 Manual verification through the Aspire stack (`tp-manual-ui-verification`) on mobile and desktop widths, with the API change running locally

## 7. Enemy traits group (reopened: the 25/25 completion is reopened for these tasks)

- [x] 7.1 Add `enemiesTraits: string[]` to `RaidsFilters`, `emptyRaidsFilters` and `countActiveFilterGroups` (one group), and `enemiesTraits` to `RaidsFilterBattle`; extend `passLocationFilter` with the any-overlap criterion. Verify: `pass-location-filter.test.ts` (any enemy with any selected trait passes, several traits any-overlap, empty selection passes, a battle without traits fails a selection, combined with campaign type/alliance) and `raids-filters.domain` tests for the badge count.
- [x] 7.2 Add a shared enemy-trait lookup next to the HSE rules (`battleEnemyTraits(battle, npcsById)` over `detailedEnemyTypes[].id`, built on the rules' `RuleNpc`/`RuleBattle` shapes, unresolved id contributes nothing) plus a pure `listEnemyTraits(battles, npcsById)` for the option list; make `buildRaidsFilterBattles` take the npc map and fill `enemiesTraits`. Verify: unit tests (union and de-duplication, unresolved id, Mechanical present, Summon/Steppable-free real data check against the catalog fixture).
- [x] 7.3 Persistence: add `enemiesTraits: z.array(z.string()).default([])` to the stored schema in `use-raids-filters.ts` (key stays `raids-filters.v1`). Verify: `use-raids-filters.test.tsx` (a value stored without the field parses and keeps its other groups, round trip with traits, invalid still falls back to empty).
- [x] 7.4 Dialog: add the Enemy Traits multi-select (after Factions in the Enemies section; trait icons via `traitIcon`, labels via `traits:<id>` with a humanised-id fallback, disabled while battles or npcs load, sanitize drops traits the catalog lacks), and pass the npc map into every `buildRaidsFilterBattles` call (`use-daily-raids.ts`, the HSE hooks). Verify: `raids-filters-dialog.test.tsx` (draft/Apply/Close/Reset with traits, options derived from the battles, badge counts it, loading disabled) and a Today render test that a trait filter changes the raids.
- [x] 7.5 i18n for the group (field label, placeholder "All traits") in en, de, es, fr with real translations. Verify: the dailies translation-parity tests pass and no key is missing in any locale.
- [x] 7.6 Re-run `pnpm test:run`, `pnpm typecheck`, `pnpm lint` (full), `pnpm lint:fsd`, `git diff --check`. Verify: all green.
- [ ] 7.7 Manual verification (`tp-manual-ui-verification`, desktop and mobile): select Mechanical on Today and on the HSE tab, see the badge and the list change, Reset clears it; restore the original `raids-filters.v1` afterwards. Status: Mechanical applied from the HSE dialog, seen on Today (badge, filtered-out notice) and on the HSE tab, Reset cleared it and the original stored value was restored (desktop); the filters dialog at 420px was not exercised, so this stays open.

## Deferred / out-of-session

Archived with the following task left unchecked (archive explicitly authorised by the user). Tracking issue: not filed yet.

- 7.7 Manual verification: Mechanical applied from the HSE dialog, seen on Today (badge, filtered-out notice) and on the HSE tab, Reset cleared it and the original stored `raids-filters.v1` was restored (desktop). Not done: the filters dialog at 420px (mobile) was not exercised in-session.
