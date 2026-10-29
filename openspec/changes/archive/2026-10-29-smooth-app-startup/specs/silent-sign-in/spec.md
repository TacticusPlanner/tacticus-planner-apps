# Spec Delta

## ADDED Requirements

### Requirement: Protected routes wait for an in-progress restore

While an automatic silent restore is in progress, or the authentication library already holds a restored account that the UI has not caught up with, a protected route and the not-found redirect SHALL show the boot screen instead of sending the visitor to sign in. Once the restore fails, or when no restore was attempted, they SHALL redirect to sign in exactly as before.

#### Scenario: Launching on a protected page

- **GIVEN** a device with an account hint and no tokens in the tab
- **WHEN** the user opens `/dailies/raids` and the silent restore succeeds
- **THEN** the boot screen is shown until the restore finishes and the user lands on `/dailies/raids` without passing through the landing page

#### Scenario: Restore fails on a protected page

- **WHEN** the silent restore fails while the user is on a protected route
- **THEN** the user is sent to the landing page with that route preserved as `next`
