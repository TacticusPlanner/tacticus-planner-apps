## 1. Campaign-event status model

- [ ] 1.1 Carry the active `campaign-event` calendar entry's `confirmed` flag and `endUtc` into Today's page-local status derivation; represent confirmed countdown, unconfirmed projection, and unavailable window distinctly. Verify focused tests for each state, including live-progress active/inactive disagreement with the calendar.
- [ ] 1.2 Render localized relative time only for a confirmed active entry; render localized unconfirmed-end copy without a numeric countdown for a projection, and keep the existing no-window omission. Verify component tests with a named event, unknown campaign group ID, and absent live-progress event at desktop and mobile widths.

## 2. Tour, catalog integration, and verification

- [ ] 2.1 Add real en/de/es/fr translations for the unconfirmed-end copy in the existing Dailies namespace and update the co-located Today tour step/copy (including its `tour.*.steps.*` keys in all four locales) to explain why a projected end has no countdown; verify locale and automated desktop/mobile tour tests.
- [ ] 2.2 After the API companion has produced a verified authored occurrence, test a catalog refresh from projected `confirmed: false` to authored `confirmed: true` and verify Today switches from unconfirmed text to the correct localized countdown without a client schema change.
- [ ] 2.3 Manually verify in the authenticated Aspire stack below and at/above 768px: live-progress active with confirmed, projected, and missing windows; live-progress inactive with a calendar window; unknown campaign name; and the Today tour. Verify no numeric countdown appears for projected data and that event-node eligibility remains tied to live progress.
- [ ] 2.4 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all gates pass for the completed change.
