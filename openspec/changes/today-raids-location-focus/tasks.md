## 1. Domain model changes

- [x] 1.1 Split `DailyRaidLocationViewModel` (`daily-raids.domain.ts`) from `{ id, label, icon? }` into `{ id, fullName, shortLabel, nodeNumber, challenge, icon? }` — `shortLabel` preserves the exact compact string the old `label` field held, for Raids Plan's unaffected chip rendering.
- [x] 1.2 Update `use-daily-raids.ts`'s `locationsByBattleId` construction to compute `fullName` via `useCampaignDisplay().fullLabel()` (new) and `shortLabel` via `useCampaignDisplay().shortLabel()` (existing formatting, preserved as-is), keeping `nodeNumber`/`challenge` as separate fields.
- [x] 1.3 Extend `DailyRaidGoalViewModel` to carry the raw goal kind and, for Rank goals, the raw `Rank` value, alongside the existing `targetLabel`.
- [x] 1.4 Update `daily-raids-calc.ts`/`use-daily-raids.ts` goal construction to populate the new raw-kind/rank fields.
- [x] 1.5 Update existing test fixtures/assertions in `daily-raids-calc.test.ts`, `dailies-pages.test.tsx`, and any other consumer of the changed shapes.

## 2. Real energy-usage data join

- [x] 2.1 Add a `battleIndex → BattleId` mapping helper scoped to standing (standard/mirror/elite/eliteMirror) campaigns: resolve via `nodeNumber = battleIndex + 1` (confirmed unambiguous for these campaign types — one `type` per group, no interleaved challenge nodes). Event campaigns are out of scope for this helper (see 2.3).
- [x] 2.2 Unit-test the mapping: standard/mirror/elite/eliteMirror campaigns at various node counts, including boundary indices (first/last node).
- [x] 2.3 In `use-daily-raids.ts`, read `live-progress.battleAttempts[]` (already fetched via `getLiveProgress()`), filter to entries whose `tacticusCampaignId` resolves to a standing (non-event) campaign definition, and resolve each remaining entry's node `energyCost` via the new mapping. Entries for event campaigns are dropped (their `battleIndex` is genuinely ambiguous between Standard/Extremis tiers in stored data — see design.md Decision 4).
- [x] 2.4 Compute the account-wide real energy total: `Σ attemptsUsed × energyCost` across every standing-campaign entry in `battleAttempts`, independent of the current project's plan.
- [x] 2.5 Expose this total (and the existing `dailyEnergy` setting) on the ready view model as a new field, distinct from the plan's own `today.energyTotal`.
- [x] 2.6 Unit-test the real-usage total: zero attempts today, attempts within budget, attempts exceeding `dailyEnergy` (percentage above 100%), attempts at nodes outside the current project's plan still counting, and attempts recorded against an event campaign being excluded from the total.

## 3. Goal-type iconography relocation

- [x] 3.1 Move `goalTypeIcon()` and `GoalTypeBadge` from `pages/goals/ui/shared/goal-visuals.tsx` into a new `entities/goal/ui/` module, exported via `entities/goal`'s public API (`index.ts`).
- [x] 3.2 Update `pages/goals` call sites to import from the new `entities/goal` location; remove the page-local copies.
- [x] 3.3 Run `pnpm lint:fsd` to confirm no page-to-page import remains and the new entity export is used correctly by both Goals and Dailies.
- [x] 3.4 Add/adjust unit tests for the relocated `goalTypeIcon()`/`GoalTypeBadge` in their new location; confirm existing Goals-page tests still pass unchanged.

## 4. Today/Bonus card UI: location-primary emphasis

- [x] 4.1 Add an `emphasis?: "material" | "location"` prop to `RaidSchedule` (default `"material"`), threaded down to `ResourceCard`; leave `raids-plan-page.tsx`'s call site unchanged (implicit default).
- [x] 4.2 In `ResourceCard`, implement the `"location"` emphasis path: campaign icon + full name (`fullName`) + "Battle {{nodeNumber}}" as the card's primary element; resource name/progress rendered as a secondary caption.
- [x] 4.3 When a resource has more than one location entry, render one full-weight location row per entry (replacing the current `LocationChips` list) under `emphasis="location"`.
- [x] 4.4 Preserve the `combinesShardIdentity` merge: unit portrait/name stays the card's primary identity; its location(s) render in the new full-weight row style beneath it.
- [x] 4.5 Update `today-page.tsx` and the Bonus Raids section to pass `emphasis="location"` to `RaidSchedule`.
- [x] 4.6 Render the goal-type icon in `GoalHeader`/the merged-identity caption: relocated `goalTypeIcon()` paired with `RankBadge` (`showLabel={false}`) for Rank goals (both icons, no text); relocated `goalTypeIcon()`/icon+text treatment for every other kind.

## 5. Fully Raided section

- [x] 5.1 Derive the set of fully-raided locations (combined raids across Today + Bonus Raids equal to the location's daily attempt cap) from the already-computed `attemptsUsedByBattle` data.
- [x] 5.2 Filter fully-raided locations out of the normal schedule/Bonus Raids location rows in `ResourceCard` (`emphasis="location"`); when every location for an entry is fully raided, omit that entry's card from the schedule/Bonus Raids entirely.
- [x] 5.3 Add a new "Fully Raided" section to `today-page.tsx`, rendered after the Bonus Raids section, listing those locations (location-primary presentation, consistent with section 4).
- [x] 5.4 Add an explicit empty state for the Fully Raided section when no location is fully raided yet.
- [x] 5.5 Confirm (via test) that a fully-raided location is excluded from its normal resource card's location listing once it appears in the new section (dedup, per design.md Decision 3), and that an entry whose every location is fully raided is omitted from the schedule/Bonus Raids while remaining visible in the Fully Raided section.

## 6. Energy-usage progress bar

- [x] 6.1 Add a `Progress` bar (`@workspace/ui/components/progress`) next to the "Today's Raids" title in `today-page.tsx`, bound to the real-usage percentage from section 2 (uncapped, can exceed 100%).
- [x] 6.2 Ensure the progress bar (and the rest of Today) defers rendering until the real-usage data source (`live-progress`) has loaded, consistent with Today's existing readiness gating.
- [x] 6.3 Add an accessible label/value text for the progress bar reflecting the exact percentage (including values above 100%).

## 7. i18n

- [x] 7.1 Add a "Battle {{number}}" key (or equivalent) to `apps/web/public/locales/en/dailies.json`.
- [x] 7.2 Add the Fully Raided section's title/empty-state keys to `dailies.json`.
- [x] 7.3 Add the energy-usage progress bar's accessible label key to `dailies.json`.
- [x] 7.4 Add/port the same new keys to `de`, `es`, and `fr` locales.
- [x] 7.5 Update `dailies-translations.test.ts` to cover the new keys across all locales (existing generic key-parity test already covers them — no changes needed).

## 8. Joyride tutorial

- [x] 8.1 Update `today.tutorial.tsx` with new/updated steps covering the location-primary cards, the Fully Raided section, and the energy-usage progress bar, for both desktop and mobile.
- [x] 8.2 Add the corresponding `tour.today.steps.*` i18n keys across all locales.
- [x] 8.3 Update `dailies-tutorial.test.tsx` for the new/changed steps (existing generic assertions already cover the new steps — no changes needed).

## 9. Verification

- [ ] 9.1 Manual verification at a viewport below 768px and one at or above 768px, using a project with: no farmable needs (empty state), a farmable schedule with a single-location resource, a resource farmed at multiple locations, at least one fully-raided location, and real synced attempts pushing the energy-usage bar above 100%.
- [ ] 9.2 Confirm Raids Plan's rendering (card layout, location chips, density toggle) is visually and behaviorally unchanged.
- [x] 9.3 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`.
