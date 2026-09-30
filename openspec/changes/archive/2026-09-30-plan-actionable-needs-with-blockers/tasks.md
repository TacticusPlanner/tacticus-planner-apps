## 1. Reproduction and canonical result

- [x] 1.1 Capture a current-stack mixed available/unavailable Rank fixture and verify it reproduces `PLAN-014` in an estimator test; if the API lacks required source data, author the paired API change before code edits.
- [x] 1.2 Extend `features/goal-farming` result types to carry actionable rows, blocked rows, and nullable completion from one allocation, and verify unit tests cover all-actionable, all-blocked, and mixed cases.
- [x] 1.3 Update shared inventory/stage scheduling to continue eligible work without declaring completion across a blocker; verify regression tests for competing goals, attempts, energy, overrides, and flat suppliers.

## 2. Consumers and verification

- [x] 2.1 Map the canonical result into Goals/Insights, Today, and Raids Plan without parallel calculations; verify integration tests show matching rows and no false date for the mixed Bellator fixture.
- [x] 2.2 Add partial-plan and blocker copy with real translations in every supported locale (en/de/es/fr); verify locale and UI tests for desktop and mobile presentations.
- [x] 2.3 Update affected Goals/Dailies Joyride steps and `tour.<page>.steps.*` keys in all supported locales, register them with `useTourPageSteps`, and verify automated tutorial tests plus manual tours below and at/above 768px.
- [ ] 2.4 Manually verify through the Aspire stack with a mixed blocked/actionable goal, an all-blocked goal, an alternate-source goal, and a goal unblocked by inventory on desktop and mobile; verify Goals, Today, and Raids Plan agree.
- [x] 2.5 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all gates pass.

## 3. Goals alignment and Restricted presentation

- [x] 3.1 Give the Goals catalog (`use-goal-catalog.ts`) the same node-eligibility rule as Today and Raids Plan (active event only, reached nodes only) through the daily-raids public API, without duplicating the rule; verify with a test that a material dropping only at an inactive event node is blocked on Goals and on the Plan for the same inputs
- [x] 3.2 Map Goals estimate results with actionable work plus unavailable requirements to the soft "Restricted" indicator and results with no obtainable work to "Blocked"; verify tests for partial, all-blocked, and non-source blocker cases (goal-blocker-reasons unchanged)
- [x] 3.3 Show each unavailable material with remaining quantity and reason on Goals (list and detail), with real en/de/es/fr copy and no completion date; verify locale-alignment and UI tests
- [x] 3.4 Add an integration test that Goals, Today, and Raids Plan agree for the mixed Ragnar-like fixture (Restricted, one blocker, no date) and an all-blocked fixture (Blocked)
- [x] 3.5 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check` after the Goals changes; verify all gates pass, and that manual task 2.4 also confirms Ragnar reads Restricted and Morvenn Vahl/Shiron read Blocked on Goals, Today, and Raids Plan
