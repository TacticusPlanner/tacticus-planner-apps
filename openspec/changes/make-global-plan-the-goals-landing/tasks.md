## 1. Dependency and routing

- [ ] 1.1 Confirm the global-plan route and empty state from the completed `establish-global-goal-priority` artifacts/API+apps implementation; update the provisional route in this change if needed and verify the destination exists before redirect work.
- [ ] 1.2 Change bare `/goals`, desktop first-entry default, and mobile bottom-bar Plan entry to the global ordered view while preserving desktop last-visited child and direct All Goals/project URLs; verify navigation tests for all cases.

## 2. Copy, tour, and verification

- [ ] 2.1 Distinguish global plan, All Goals, and Projects labels/descriptions in every supported locale and update shared shell `general.tutorial.tsx` plus its i18n steps if navigation guidance changes; verify locale and tutorial tests at desktop/mobile widths.
- [ ] 2.2 Manually check first entry, last-visited entry, reload, mobile repeated entry, empty account, and direct/deep links in the Aspire stack; verify expected route and Back behavior.
- [ ] 2.3 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
