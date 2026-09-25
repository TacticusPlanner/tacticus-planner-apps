## 1. Remove Level goals and derive the requirement

- [ ] 1.1 Remove the Level goal kind from the client (`GoalKind`, Level creation card, Level fields, Level estimate/progress paths, goal-detail and target-editor Level cases); verify typecheck and the affected tests no longer reference Level goals.
- [ ] 1.2 Drop Level auto-suggestion for both Rank and Ability while keeping Unlock and Ascension prerequisites; verify creation tests for Bellator Silver3, an above-cap Ability target, and combined Rank+Ability cases create no Level goal and show the required level.
- [ ] 1.3 Add one `features/goal-farming` progression allocation for Rank slots and level XP across overlapping Rank milestones (and Ability level XP); verify unit tests for the 12,200-XP Bellator example, whole books, priorities, and no double spend.

## 2. Presentation and consumers

- [ ] 2.1 Render required level, current level, remaining XP, and Potential progress on the Rank and Ability goal in the row, card, detail, and creation preview; delete the Level sub-line folding and standalone Level rows; verify desktop/mobile Goals tests.
- [ ] 2.2 Remove `MissingLevelPrerequisite` and keep Unlock, Ascension, and data blockers; verify blocker tests for level-only (no restriction) and mixed reasons.
- [ ] 2.3 Wire the allocation into Insights and Dailies; verify tests for one Rank milestone, overlapping Rank milestones, and an Ability goal below its required level across all consumers.
- [ ] 2.4 Translate the level display copy in en/de/es/fr, remove the Level strings, and update the Goals tutorial desktop/mobile targets with `tour.goals.steps.*` keys in every locale; verify locale/tutorial tests and manual tours below and at/above 768px.
- [ ] 2.5 Author the remaining delta specs (`goal-creation`, `goal-list-layout`, `goal-progress-display`, `v1-profile-import`, `goal-target-editing`) named in the design.
- [ ] 2.6 Manually verify with a Rank goal below its level, an Ability goal below its level, overlapping Rank milestones, and a rarity blocker on desktop/mobile through Aspire; verify no Level goal appears, no duplicate XP, and no false Restricted badge.
- [ ] 2.7 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all gates pass.
