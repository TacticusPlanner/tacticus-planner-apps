## 1. State and precedence

- [ ] 1.1 Add transient last-successful-choice memory in the shared goal-creation model, clearing it on app reload; verify a new tab/reload uses the ordinary default.
- [ ] 1.2 Apply explicit launch prefill before remembered context, filter types by selected entity, ignore deleted project IDs, and reset unit-specific targets/start-paused; verify focused form/launcher tests.
- [ ] 1.3 Reconcile `add-contextual-goal-creation-entry-points`' no-prefill default scenario with remembered context before applying either change; verify the two specs state consistent precedence.

## 2. User flow and gates

- [ ] 2.1 Cover Create another, close/reopen, project-scoped launch, incompatible type, removed project, and submission failure in tests; verify focused Create Goal suite passes.
- [ ] 2.2 Manually check consecutive creation from Overview and Project Detail at mobile and desktop widths with two projects and Character/Machine-of-War choices; verify targets and start-paused do not leak.
- [ ] 2.3 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
