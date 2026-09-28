## 1. Shared picker

- [x] 1.1 Add validated unmatched-name Create action to `GoalProjectsField`, with pending and in-place error states; verify component tests for existing, invalid, and unmatched names.
- [x] 1.2 Call existing project creation, select returned ID, refresh project data, and preserve outer goal draft on success/failure; verify creation and edit-form tests including retry and cancellation, and that the created project is a custom (non-Default) project and the goal's status/global position are unaffected by the membership choice.
- [x] 1.3 Add all new action/error copy to every supported locale; verify translation keys and rendered accessibility names.

## 2. Integration

- [x] 2.1 Update Create Goal and goal-edit tutorials with the inline-project action and localized step content where the guided flow materially changes; verify tutorial tests at desktop/mobile widths.
- [ ] 2.2 In the Aspire stack, test valid creation, duplicate/invalid name, request failure, and cancel-after-create in both forms at mobile and desktop widths; verify goal draft and membership behavior.
- [x] 2.3 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
