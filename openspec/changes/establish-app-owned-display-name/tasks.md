## 1. Account contract and setup

- [ ] 1.1 Consume the paired API's nullable confirmed name, private suggestion, and confirmation fields in `entities/account`; verify contract-mapping tests for confirmed, unconfirmed, and missing suggestions.
- [ ] 1.2 Add the addressable name step and both-field setup guard while preserving deep links, Back/reload, and fail-open request-error behavior; verify route/onboarding tests at mobile and desktop widths.
- [ ] 1.3 Implement editable suggested-name confirmation after key or V1 import, with draft preservation and retry; verify normal, V1, failed-save, and existing-key/unconfirmed-name tests.

## 2. Editing and identity

- [ ] 2.1 Add Manage Account display-name editing through `PUT /me/display-name`; verify success/failure tests preserve email/auth identifiers and draft state.
- [ ] 2.2 Refresh `/me`, avatar/menu, and a newly signed UserJot token after save; verify provider/email-like suggestions never appear in the shell/widget and a fresh token uses the edited name.
- [ ] 2.3 Add all new setup/editor/error copy with real en/de/es/fr translations in the existing namespaces; verify locale and UI tests.
- [ ] 2.4 Create or update setup and account-shell Joyride steps with `tour.<page>.steps.*` translations for every locale and desktop/mobile selectors; verify automated tutorial tests and manual tours below and at/above 768px.

## 3. End-to-end verification

- [ ] 3.1 Through Aspire, verify new provider name, email-like provider claim, missing claim, V1 setup/import, later re-import, and legacy unconfirmed profile on mobile and desktop; verify name confirmation, reload, deep-link return, account menu, and public feedback identity.
- [ ] 3.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all gates pass.
