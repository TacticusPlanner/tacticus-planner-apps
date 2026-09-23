## 1. Paired contract and draft model

- [ ] 1.1 Apply the same-named API change first, then update all apps callers/types for desired and expected goal-ID sets plus structured conflicts; verify API client tests and OpenAPI alignment.
- [ ] 1.2 Refactor the project-management sheet to keep baseline membership, pending additions, and pending removals distinct across search/group/sort; verify focused state tests and project-switch reset behavior.

## 2. Reviewed workflow

- [ ] 2.1 Add searchable/groupable/sortable rows with current and pending states and a named review summary, then one explicit save; verify tests for add, remove, mixed batch, no-op, filtered selections, and status/priority invariance.
- [ ] 2.2 Show stale, slot, and last-membership conflicts in context without discarding the draft; refresh current membership for an explicit re-review and verify each rejection test.
- [ ] 2.3 Localize all new state/action/error copy in every supported locale and update Project Detail Joyride plus its localized steps for the changed flow; verify tutorial tests at desktop/mobile widths.

## 3. Integration and gates

- [ ] 3.1 In the Aspire stack, test a large populated project, another-project-only goal, duplicate slot, last-membership removal, and concurrent membership change at mobile and desktop widths; verify atomicity and unchanged canonical priority.
- [ ] 3.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
