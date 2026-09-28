## 1. State and precedence

- [x] 1.1 Add transient last-successful-choice memory in the shared goal-creation model, clearing it on app reload; verify a new tab/reload uses the ordinary default.
- [x] 1.2 Apply explicit launch prefill before remembered context, filter types by selected entity, ignore deleted or archived project IDs (fall back to the Default project), and reset unit-specific targets/start-paused; verify focused form/launcher tests.
- [x] 1.3 Verify the `goal-creation-entry-points` main spec's no-prefill Default-project scenario and project-scoped-launch precedence agree with this change's wording (it already conditions the default on no remembered context); verify no contradictory statement remains after both are synced.

## 2. User flow and gates

- [x] 2.1 Cover Create another, close/reopen, project-scoped launch (Project Detail and a global entry point used on `/plan/projects/:projectId`), incompatible type, removed project, and submission failure in tests; verify focused Create Goal suite passes.
- [ ] 2.2 Manually check consecutive creation from the Goals page (`/plan/goals`) and Project Detail at mobile and desktop widths with two projects and Character/Machine-of-War choices; verify targets and start-paused do not leak.
- [x] 2.3 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
