## 1. Target identity and creation

- [x] 1.1 Consume the API's normalized Rank target/conflict data and show exact-target validation in goal creation; verify distinct Silver3/Gold1 acceptance and same-target 409 draft-preservation tests.
- [x] 1.2 Update Goals/project rows and status/delete actions for independent Rank ids and target labels; verify desktop/mobile tests including delete/recreate and completed history.

## 2. Shared planning allocation

- [x] 2.1 Extend `features/goal-farming` to allocate Rank slot and XP intervals once in effective priority order before recipe expansion; verify the worked Bellator overlap, reverse order, partial slots, crafted inventory, and shared-project cases.
- [x] 2.2 Derive per-goal detail and aggregate Insights/Dailies totals from the same allocation; verify cross-consumer tests never duplicate material, book, energy, or raid demand and never mark a planned later milestone actually complete. _(Slot and XP allocation are shared by Insights, Today/Raids Plan and shop needs; Goals rows now show the allocated slot count and "Covered by an earlier goal" through `rankSlotsByGoalId`.)_
- [x] 2.3 Update project membership/assembly/relocation eligibility to compare normalized Rank targets while preserving non-Rank rules and server-authoritative conflicts; verify multi-select, stale-save, and atomic rejection tests.

## 3. Experience and gates

- [x] 3.1 Add target-specific conflict/covered-work copy with real en/de/es/fr translations in existing namespaces; verify locale and UI tests. _(`remainingText.coveredByEarlierGoal` in en/de/es/fr.)_
- [x] 3.2 Update Goals and Projects Joyride steps with desktop/mobile selectors and `tour.<page>.steps.*` keys in all supported locales; verify automated tutorial coverage and manual tours below and at/above 768px. _(Tutorial tests cover both layouts; the Goals tour was run in Aspire at desktop width and in a 386px viewport: 8 steps, every tooltip inside the viewport with its spotlight, ending on the several-Rank-goals step.)_
- [ ] 3.3 Through Aspire, manually verify an empty project, two Bellator Rank targets, overlapping needs, reordering, shared project membership, exact conflict, pause/resume, delete/recreate, and a reached earlier milestone on both layouts; verify Goals, Insights, Today, and Raids Plan agree. _(Checked in Aspire with a temporary Lucius Stone II goal under his Gold I goal, desktop and 386px viewport: the covered goal reads "Covered by an earlier goal" on Goals and Project Detail (rows and cards); pausing the covering goal makes it claim its own 6 slots and resuming restores covered; pausing the covered goal leaves Insights total energy, Raids Plan and Today unchanged; an exact duplicate target is rejected naming Stone II with the draft kept and no goal created. Not exercised: empty project, delete/recreate, drag reorder (the browser tool cannot drive it), a reached earlier milestone. Known gap: the exact-conflict message names the target but does not link to the existing goal, though the proposal says it should.)_
- [x] 3.4 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all gates pass.
