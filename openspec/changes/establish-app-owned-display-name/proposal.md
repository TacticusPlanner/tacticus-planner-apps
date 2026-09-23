## Why

`ACC-001` requires a user-chosen public name, but the current setup is complete with only a Tacticus key and Manage Account has no name editor. The API companion makes confirmation explicit; the app must let users provide it without exposing a provider or V1 login string as public identity.

## What Changes

- Add an editable name step to normal and V1 account setup; a provider/V1 value can prefill but not silently confirm it.
- Require a confirmed name and configured Tacticus key before setup finishes, while preserving deep-link return and existing failure recovery.
- Add a Manage Account name editor and refresh account/avatar/feedback identity after a successful save.
- Use neutral identity presentation until confirmation; never derive public nickname from email/provider fallback. **BREAKING:** `/me` client mapping accepts nullable confirmed `displayName` and new state fields.

## Capabilities

### New Capabilities

- `account-display-name`: First-run name confirmation, later editing, and safe identity presentation.

### Modified Capabilities

- `account-setup`: Setup completion must require both a configured key and a confirmed name.
- `userjot-widget`: Widget identity follows confirmed-name changes and never uses an unconfirmed client fallback.

## Impact

`features/account-onboarding`, `features/account-management`, `entities/account`, app auth/identity shell, UserJot provider, tests, routes/tutorials/translations. Companion API change `establish-app-owned-display-name` provides `/me` and `PUT /me/display-name` and applies first.
