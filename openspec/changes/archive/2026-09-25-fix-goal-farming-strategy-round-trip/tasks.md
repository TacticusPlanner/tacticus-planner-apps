## 1. Diagnose the round trip

- [x] 1.1 Reproduce `PLAN-013` on the Aspire stack with a supported Rank goal and two distinct strategies, recording draft, request, response, fresh GET, reopened editor, and plan/Dailies result; verify the first failing stage is identified.
- [x] 1.2 If the server is at fault, create the same-named API OpenSpec companion with endpoint/persistence tests and apply it before apps work; verify the paired contract and generated OpenAPI plan. If client-only, record why no API companion is needed.
  - Finding (1.1/1.2): PUT 200, fresh GET and list refresh returned the saved strategy; the first failing stage is the client edit draft. `FarmingStrategyField`'s fallback effect had an inverted guard, so any available non-default strategy was reset to `TotalUpgrades` on mount. Client-only; no API companion needed.

## 2. Fix and verify

- [x] 2.1 Correct the failing layer without changing strategy semantics, preserving draft/error behavior; verify focused save, reload, and cache regression tests.
- [x] 2.2 Add a persisted round-trip integration check and confirm a strategy change affects the intended goal/plan and Dailies calculations; verify both values survive refresh.
- [x] 2.3 Manually verify success and rejected-save states at desktop/mobile widths on an account with a Rank goal and plan data; record results.
  - Manual results (Arjac Rank goal, local Aspire stack): desktop and mobile (<768px) success path PASS — change strategy, save, view shows new value, editor reopens on it, reload keeps it; original strategy restored afterwards. Rejected-save state NOT verified live: stopping `api` made the request hang (no error shown; client has no request timeout), which is not a rejection. Accepted by user: failed-save message stays covered by existing unit tests only. Hang-with-no-timeout is a separate, unspecified behavior.
- [x] 2.4 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check` (plus API gates if paired); verify all pass.
