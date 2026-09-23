## 1. Reproduction and canonical result

- [ ] 1.1 Capture a current-stack mixed available/unavailable Rank fixture and verify it reproduces `PLAN-014` in an estimator test; if the API lacks required source data, author the paired API change before code edits.
- [ ] 1.2 Extend `features/goal-farming` result types to carry actionable rows, blocked rows, and nullable completion from one allocation, and verify unit tests cover all-actionable, all-blocked, and mixed cases.
- [ ] 1.3 Update shared inventory/stage scheduling to continue eligible work without declaring completion across a blocker; verify regression tests for competing goals, attempts, energy, overrides, and flat suppliers.

## 2. Consumers and verification

- [ ] 2.1 Map the canonical result into Goals/Insights, Today, and Raids Plan without parallel calculations; verify integration tests show matching rows and no false date for the mixed Bellator fixture.
- [ ] 2.2 Add partial-plan and blocker copy with real translations in every supported locale (en/de/es/fr); verify locale and UI tests for desktop and mobile presentations.
- [ ] 2.3 Update affected Goals/Dailies Joyride steps and `tour.<page>.steps.*` keys in all supported locales, register them with `useTourPageSteps`, and verify automated tutorial tests plus manual tours below and at/above 768px.
- [ ] 2.4 Manually verify through the Aspire stack with a mixed blocked/actionable goal, an all-blocked goal, an alternate-source goal, and a goal unblocked by inventory on desktop and mobile; verify Goals, Today, and Raids Plan agree.
- [ ] 2.5 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all gates pass.
