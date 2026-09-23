## 1. Canonical data

- [ ] 1.1 Trace existing goal need, eligible-node, blocker, and XP-book allocation outputs for a populated Rank/Level project; verify which fields are already available client-side and whether a same-named API companion is required.
- [ ] 1.2 Reconcile Rank/Level ownership and global-priority dependencies with their OpenSpec changes, then derive shared guidance rows and project summaries from one canonical result; verify unit tests for quantity, allocation, locked/exhausted, and no-source states.

## 2. Surfaces and verification

- [ ] 2.1 Add concise resource/source guidance and next action to goal detail, keeping raw XP and correctly labeled additional book equivalent; verify goal-detail tests and the worked Bellator fixture.
- [ ] 2.2 Add project-level summary/link and explicit preview label for a project not selected in Dailies; verify tests for populated, empty, and blocked projects.
- [ ] 2.3 Localize new copy in all supported locales and update materially changed goal/project Joyride steps with localized content; verify desktop/mobile tutorial tests.
- [ ] 2.4 In the Aspire stack, inspect mixed eligible/locked nodes, owned books across two Level goals, selected/unselected projects, and no-actionable-source states at mobile and desktop widths; verify no preview claims to be today's schedule.
- [ ] 2.5 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check` (and API gates if paired); verify all pass.
