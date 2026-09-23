## 1. Evidence and scope

- [ ] 1.1 Walk Today and Raids Plan in the Aspire stack at narrow/wide viewports with usable, exhausted, locked, and already-satisfied Unlock/active Rank states; capture first action, order, real attempts, simulated caps, and “Max raids” placement; verify each reported symptom is reproduced or explicitly ruled out.
- [ ] 1.2 Reconcile Day-1 visibility with `add-daily-raids-availability-filter`; record which display issues remain after the toggle and verify no future-day real-availability claim is made.

## 2. Presentation and regression

- [ ] 2.1 Demote/group only confirmed non-actionable content and clarify cap/exhaustion copy while keeping all detail accessible; verify `RaidSchedule`/Today/Plan rendering tests and unchanged schedule snapshots.
- [ ] 2.2 Add or update localized copy and Today/Raids Plan tutorial steps if layout changes materially; verify all supported locales and tutorial tests at desktop/mobile widths.
- [ ] 2.3 Repeat the walkthrough including no-actionable-node and short mobile viewport cases; verify an actionable item leads when one exists and explanations remain reachable.
- [ ] 2.4 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
