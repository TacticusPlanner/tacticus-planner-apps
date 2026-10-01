## 1. Evidence and decisions

- [x] 1.1 Walk Today (Dailies › Raids) in the Aspire stack at narrow (<768px), ordinary desktop, and wide (≥1440px) viewports with a populated plan; capture how Today's Attempts reads to a new user, whether the farmed material is identifiable without hover, how much of a wide viewport is empty, and whether Raids and Shops are used together in one session.
- [x] 1.2 Record a decision for each UserJot input: one "what do I do today" view vs. separate Raids/Shops tabs; "X attempts used" wording; upgrade names inline on Today (desktop and mobile); wide-desktop empty space. Write the decisions into design.md and, where a delta is accepted, add `daily-raids-today` delta specs via `/opsx:update` before starting section 2.

## 2. Presentation and regression

- [x] 2.1 Clarify the attempts-used copy per the 1.2 decision while keeping all detail accessible; verify Today rendering tests and unchanged schedule snapshots.
- [x] 2.2 Apply the accepted inline-name and wide-layout decisions from 1.2, if any; verify on both platforms.
- [x] 2.3 Add or update localized copy (de/es/fr translated, not placeholders) and the Today tutorial steps if layout changes materially; verify all supported locales and tutorial tests at desktop/mobile widths.
- [x] 2.4 Repeat the walkthrough at short mobile and wide-desktop sizes; verify the accepted decisions hold.
- [x] 2.5 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
