## 1. Shared dialog and access

- [ ] 1.1 Move Planning Settings dialog/trigger to a legal shared slice with a public API, preserving the existing query/mutation; verify Goals Overview's existing dialog tests and `pnpm lint:fsd`.
- [ ] 1.2 Add an accessible Planning Settings action to `RaidsLayout` for Today and Raids Plan on desktop/mobile, using the one dialog; verify route/layout tests and keyboard activation.
- [ ] 1.3 Update dialog/action copy in every supported locale to describe effects on raids and estimates; verify locale keys and rendering tests.

## 2. Tour and integration

- [ ] 2.1 Update Today/Raids Plan tutorial coverage and localized step content if the new control alters the guided flow; verify desktop/mobile tutorial tests.
- [ ] 2.2 In the Aspire stack, save a value from Dailies and reopen from Plan Overview, then reverse the flow; verify one persisted value and recalculated raids/estimates at mobile and desktop widths.
- [ ] 2.3 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
