## 1. Target identity and creation

- [x] 1.1 Consume the API's normalized Rank target/conflict data and show exact-target validation in goal creation; verify distinct Silver3/Gold1 acceptance and same-target 409 draft-preservation tests.
- [x] 1.2 Update Goals/project rows and status/delete actions for independent Rank ids and target labels; verify desktop/mobile tests including delete/recreate and completed history.

## 2. Shared planning allocation

- [ ] 2.1 Extend `features/goal-farming` to allocate Rank slot and XP intervals once in effective priority order before recipe expansion; verify the worked Bellator overlap, reverse order, partial slots, crafted inventory, and shared-project cases.
- [ ] 2.2 Derive per-goal detail and aggregate Insights/Dailies totals from the same allocation; verify cross-consumer tests never duplicate material, book, energy, or raid demand and never mark a planned later milestone actually complete.
- [x] 2.3 Update project membership/assembly/relocation eligibility to compare normalized Rank targets while preserving non-Rank rules and server-authoritative conflicts; verify multi-select, stale-save, and atomic rejection tests.

## 3. Experience and gates

- [ ] 3.1 Add target-specific conflict/covered-work copy with real en/de/es/fr translations in existing namespaces; verify locale and UI tests.
- [ ] 3.2 Update Goals and Projects Joyride steps with desktop/mobile selectors and `tour.<page>.steps.*` keys in all supported locales; verify automated tutorial coverage and manual tours below and at/above 768px.
- [ ] 3.3 Through Aspire, manually verify an empty project, two Bellator Rank targets, overlapping needs, reordering, shared project membership, exact conflict, pause/resume, delete/recreate, and a reached earlier milestone on both layouts; verify Goals, Insights, Today, and Raids Plan agree.
- [x] 3.4 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all gates pass.
