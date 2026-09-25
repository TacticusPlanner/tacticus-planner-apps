## 1. Raided section implementation

- [x] 1.1 In `raids-plan-page.tsx`, for Day 1 only, partition the day's entries with the existing `isLocationVisible` predicate against the current real attempts map: predicate true (including unknown attempts) is actionable, false is raided. Derive per render; add no state, toggle, or persistence. Do not mutate or recalculate the canonical plan.
- [x] 1.2 Render the actionable entries through `RaidSchedule` as today, then, only when raided entries exist, a "Raided" divider (centered label on a rule, as in V1) followed by the raided entries in the same material emphasis, density, and card presentation. Preserve relative order within each section and omit empty resource/goal groups. Pass every later day its original entries, including when a battle ID is also present on Day 1.
- [x] 1.3 When every Day-1 entry is raided, keep the day card and original summary and show only the Raided section, without goal-completion or empty-plan wording. Preserve existing behavior for an originally empty day.
- [x] 1.4 Add the translated "Raided" heading to `apps/web/public/locales/en/dailies.json`, `de/dailies.json`, `es/dailies.json`, and `fr/dailies.json`, then re-read each edited file.

## 2. Tests

- [x] 2.1 In the existing Raids Plan test file(s), cover a Day-1 exhausted node appearing under "Raided" after actionable nodes, positive and unknown attempts staying actionable, no divider when nothing is raided, the same battle ID on Day 1 and a later day, and refreshed attempt data moving a node between sections.
- [x] 2.2 Test that both sections preserve card presentation/order/density and canonical day/plan totals, that empty groups are omitted from the main section, and that an all-raided Day 1 shows only the Raided section. Verify with the matching focused Vitest run.
- [x] 2.3 Confirm existing Raids Plan tests (density toggle, "Show all days", per-day summary stats) still pass unchanged.

## 3. Verification and gates

- [x] 3.1 Manually verify in the browser (Aspire AppHost stack, signed-in session, account with at least one exhausted node today): confirm exhausted Day-1 nodes appear under a "Raided" divider after actionable ones, unknown and future-day entries are unaffected, totals and layout are preserved, and the section renders correctly at both a sub-768px and an at/above-768px viewport. Confirm Today's page behavior is completely unchanged.
- [x] 3.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all must pass before this change is considered done.
