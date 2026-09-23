## Context

The edit form binds `draft.farmingStrategy`; `useGoalDetailSave` sends updates. API `UpdateGoalEndpoint` parses and persists the enum and `GoalMapper` returns it. The observed failure is not yet reproduced and may be draft binding, mutation payload, response/cache refresh, validation, or persistence. The API also supports non-default strategy for Character Rank and Machine-of-War Ability goals, whereas the current edit UI appears to show the field only for Rank.

## Goals / Non-Goals

**Goals:** Establish the failing layer with a recorded request/response/read trace, then repair the round trip and regression coverage.

**Non-Goals:** Redefine strategies or add new strategy values/eligible goal types.

## Decisions

- Reproduce with a supported Rank goal first, tracing UI draft → request JSON → API response → fresh GET → cache → reopened editor → planner result. A failed stage determines the fix; do not add a heuristic reset.
- Keep existing goal API contract. If a server defect is confirmed, create the matching API OpenSpec change before code, apply API first, and include endpoint/persistence tests and OpenAPI verification there.
- In the client, invalidate or update every affected goal/project/planning query after success, while retaining the edit draft and explicit error on failure. Use a real persisted round-trip test, not only a mocked optimistic UI test.

## Risks / Trade-offs

- A strategy may be valid for Rank but not another goal type → use existing eligibility rules and test supported types, not force a value into all goals.
- The reported bug may reflect old deployed code or a stale cache → compare current local response and UI before modifying either service.

## Open Questions

- Which stage first diverges from the chosen value on the current stack? The trace decides whether this remains apps-only or gains a same-named API companion; no server work is assumed without evidence.
- Does the report include Machine-of-War Ability editing? That appears separately unsupported by the current edit UI; log it as a scope decision if reproduced rather than silently broadening `PLAN-013`.
