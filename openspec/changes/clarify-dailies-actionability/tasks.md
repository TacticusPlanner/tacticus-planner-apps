## 1. Evidence and scope

- [ ] 1.1 Walk Today (Dailies › Raids) and Plan › Schedule in the Aspire stack at narrow (<768px), ordinary desktop, and wide (≥1440px) viewports with usable, exhausted, locked, and already-satisfied Unlock/active Rank states; capture first action, order, real attempts, simulated caps, and “Max raids” placement; verify each reported symptom is reproduced or explicitly ruled out.
- [ ] 1.2 In the same walkthrough record a decision for each UserJot input: one "what do I do today" view vs. separate Raids/Shops tabs; "X attempts used" wording; upgrade names inline on Today (desktop and mobile); wide-desktop empty space. Write the decisions into design.md and, where a delta is accepted, add `daily-raids-today` delta specs via `/opsx:update` before starting section 2.
- [ ] 1.3 Confirm the shipped Day-1 availability toggle's effect on the observed states; record which display issues remain after it and verify no future-day real-availability claim is made.

## 2. Presentation and regression

- [ ] 2.1 Demote/group only confirmed non-actionable content and clarify cap/exhaustion and attempts-used copy while keeping all detail accessible; verify `RaidSchedule`/Today rendering tests and unchanged schedule snapshots.
- [ ] 2.2 Apply the accepted inline-name and wide-layout decisions from 1.2, if any; verify on both platforms.
- [ ] 2.3 Add or update localized copy (de/es/fr translated, not placeholders) and the Today tutorial steps if layout changes materially; verify all supported locales and tutorial tests at desktop/mobile widths.
- [ ] 2.4 Repeat the walkthrough including no-actionable-node, short mobile, and wide-desktop cases; verify an actionable item leads when one exists and explanations remain reachable.
- [ ] 2.5 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
