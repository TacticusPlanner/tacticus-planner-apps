# account-purge Specification

## Purpose

The account-deletion flow in the web app: what the user is told after deleting their Planner account, including when the separate sign-in account could not be removed.

## Requirements

### Requirement: A purge always signs out

After any successful purge the dialog SHALL close, clear the local planner data and sign out at once, whichever scope was chosen and whatever the `X-Sign-In-Account-Deleted` header says. Staying signed in would let the next `GET /account` provision a new, empty planner account for the purged identity.

#### Scenario: The sign-in account was deleted

- **WHEN** the user purges with "Planner data and sign-in account" and the response header is `X-Sign-In-Account-Deleted: true`
- **THEN** the dialog closes and the user is signed out
- **AND** no notice is shown after sign-out

#### Scenario: The sign-in account is still there

- **WHEN** the same purge returns `X-Sign-In-Account-Deleted: false`
- **THEN** the dialog closes and the user is signed out immediately

### Requirement: A sign-in account that could not be deleted is reported after sign-out

When the user purged with "Planner data and sign-in account" and the `X-Sign-In-Account-Deleted` header of the 204 is not `true`, the client SHALL store a one-shot notice in session storage before signing out. The landing page reached after sign-out SHALL show it once as a translated toast: the planner data was deleted but the sign-in account still exists, and how to retry or get help. Showing it SHALL clear it.

#### Scenario: The notice is shown once

- **WHEN** the purge kept the sign-in account and the user lands on the landing page after sign-out
- **THEN** the "sign-in account could not be removed" notice is shown
- **AND** it is not shown again on a later visit
