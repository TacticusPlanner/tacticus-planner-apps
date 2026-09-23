## 1. Establish rules

- [ ] 1.1 Trace the current apps scheduler and Dailies presentation, recording goal priority, farming stages, resource urgency, eligible nodes, energy, attempts, and inventory in order; verify the documented rules against existing tests.
- [ ] 1.2 Build deterministic immediate-common versus future-rare fixtures for each relevant farming strategy and a cross-goal priority case; verify observed allocation and displayed order are recorded separately.

## 2. Decide whether a behavior change exists

- [ ] 2.1 Compare fixtures with the strategy's intended horizon, using V1 as reference only and checking `PLAN-013` persistence and `PLAN-014` blockers; verify a specific mismatch or document that no bug reproduces.
- [ ] 2.2 If wrong, update this proposal/design/tasks, remove `skip_specs`, add the exact delta specification and deterministic regression tasks before implementation; verify `openspec validate --strict` passes. If correct, record evidence and close without algorithm code.
