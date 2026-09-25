## 1. Account contract and setup

- [x] 1.1 Consume the paired API's nullable `displayName` and private `suggestedDisplayName` in `entities/account`; verify contract-mapping tests for a chosen name, a suggestion-only account, and missing suggestions.
- [x] 1.2 Add the addressable name step and both-field setup guard while preserving deep links, Back/reload, and fail-open request-error behavior; verify route/onboarding tests at mobile and desktop widths.
- [x] 1.3 Implement the editable name step after key or V1 import, using the `/me` suggestion or the V1 import response's suggestion, with draft preservation and retry; verify normal, V1, failed-save, and existing-key/no-name tests.

## 2. Editing and identity

- [x] 2.1 Add Manage Account display-name editing through `PUT /me/display-name`, with an edit icon beside the name in the desktop and mobile account menu that opens it on the name editor; verify success/failure tests preserve email/auth identifiers and draft state.
- [x] 2.2 Refresh `/me`, avatar/menu, and a newly signed UserJot token after save; verify provider/email-like suggestions never appear in the shell/widget and a fresh token uses the edited name.
- [x] 2.3 Add all new setup/editor/error copy with real en/de/es/fr translations in the existing namespaces; verify locale and UI tests.
- [ ] 2.4 Update the account-shell tour copy (`tour.steps.accountDrawer` and `tour.steps.sidebarFooter`) to mention the planner name in every locale; the setup screen has no tour and none is added; verify locale files and tutorial tests, and manually the tours below and at/above 768px.

## 3. End-to-end verification

- [ ] 3.1 Through Aspire, verify new provider name, email-like provider claim, missing claim, V1 setup/import, and later re-import on mobile and desktop; verify saving a name, reload, deep-link return, account menu, and public feedback identity.
- [x] 3.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all gates pass.
