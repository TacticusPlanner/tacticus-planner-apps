## ADDED Requirements

### Requirement: A sign-in account that could not be deleted is reported

When the user purges their account with "Planner data and sign-in account", the client SHALL read the `X-Sign-In-Account-Deleted` header of the 204. If it is not `true`, the dialog SHALL NOT sign out on its own. It SHALL show a translated alert that the planner data was deleted but the sign-in account still exists, and a Sign out button that signs out when chosen. When the header is `true`, or the user chose "Planner data only", the dialog closes and signs out as before.

#### Scenario: The sign-in account is still there

- **WHEN** the user purges with "Planner data and sign-in account" and the response header is `X-Sign-In-Account-Deleted: false`
- **THEN** the account tab shows the "sign-in account could not be removed" alert and a Sign out button
- **AND** the user is not signed out until they choose Sign out

#### Scenario: The sign-in account was deleted

- **WHEN** the same purge returns `X-Sign-In-Account-Deleted: true`
- **THEN** the dialog closes and the user is signed out
