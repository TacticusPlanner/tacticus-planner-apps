## Why

`ACC-001` requires a user-chosen public name, but the current setup is complete with only a Tacticus key and Manage Account has no name editor. The API companion returns a name only once the user has chosen one; the app must let users provide it without exposing a provider or V1 login string as public identity.

## What Changes

- Add an editable name step to normal and V1 account setup; a provider/V1 value can prefill but is never saved as the name silently.
- Require a chosen name and configured Tacticus key before setup finishes, while preserving deep-link return and existing failure recovery.
- Add a Manage Account name editor and refresh account/avatar/feedback identity after a successful save.
- Use neutral identity presentation until a name is set; never derive public nickname from email/provider fallback. **BREAKING:** `/me` client mapping accepts a nullable `displayName` and a `suggestedDisplayName`.

## Capabilities

### New Capabilities

- `account-display-name`: First-run name step, later editing, and safe identity presentation.

### Modified Capabilities

- `account-setup`: Setup completion must require both a configured key and a chosen name.
- `userjot-widget`: Widget identity follows name changes and never uses a client-side fallback.

## Impact

`features/account-onboarding`, `features/account-management`, `entities/account`, app auth/identity shell, UserJot provider, tests, routes/tutorials/translations. Companion API change `establish-app-owned-display-name` provides `/me` and `PUT /me/display-name` and applies first.
