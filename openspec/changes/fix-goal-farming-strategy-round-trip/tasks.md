## 1. Diagnose the round trip

- [ ] 1.1 Reproduce `PLAN-013` on the Aspire stack with a supported Rank goal and two distinct strategies, recording draft, request, response, fresh GET, reopened editor, and plan/Dailies result; verify the first failing stage is identified.
- [ ] 1.2 If the server is at fault, create the same-named API OpenSpec companion with endpoint/persistence tests and apply it before apps work; verify the paired contract and generated OpenAPI plan. If client-only, record why no API companion is needed.

## 2. Fix and verify

- [ ] 2.1 Correct the failing layer without changing strategy semantics, preserving draft/error behavior; verify focused save, reload, and cache regression tests.
- [ ] 2.2 Add a persisted round-trip integration check and confirm a strategy change affects the intended goal/plan and Dailies calculations; verify both values survive refresh.
- [ ] 2.3 Manually verify success and rejected-save states at desktop/mobile widths on an account with a Rank goal and plan data; record results.
- [ ] 2.4 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check` (plus API gates if paired); verify all pass.
