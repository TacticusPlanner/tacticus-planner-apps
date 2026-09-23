## 1. Creation and canonical progression

- [ ] 1.1 Reproduce current Rank-only and shared-Ability Level pairs against the Aspire stack and capture fixtures; verify the case matches `PLAN-008` before adjusting UI.
- [ ] 1.2 Remove Rank-only Level auto-suggestion while retaining Ability, Unlock, and Ascension prerequisite behavior; verify creation tests for Bellator Silver3 and combined Rank+Ability cases.
- [ ] 1.3 Add one `features/goal-farming` progression interval/allocation result for Rank level XP and overlapping Level goals; verify unit tests for the 12,200-XP Bellator example, whole books, priorities, and no double spend.

## 2. Presentation and consumers

- [ ] 2.1 Render level/XP within Rank row/card and fold only legacy Rank-exclusive Level rows without deleting their detail; verify desktop/mobile Goals tests and a direct Level-detail read.
- [ ] 2.2 Suppress routine Rank missing-Level restriction but preserve Ascension/Unlock/data blockers; verify blocker tests for level-only and mixed reasons.
- [ ] 2.3 Wire canonical demand into Insights and Dailies and verify tests for one Rank milestone, shared Ability Level, and standalone Level across all consumers.
- [ ] 2.4 Translate new Rank-level copy in en/de/es/fr and update Goals tutorial desktop/mobile targets with `tour.goals.steps.*` keys in every locale; verify locale/tutorial tests and manual tours below and at/above 768px.
- [ ] 2.5 Manually verify with a new Rank goal, legacy Rank-only Level pair, shared Ability prerequisite, standalone Level, and a rarity blocker on desktop/mobile through Aspire; verify no duplicate XP or false Restricted badge.
- [ ] 2.6 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all gates pass.
