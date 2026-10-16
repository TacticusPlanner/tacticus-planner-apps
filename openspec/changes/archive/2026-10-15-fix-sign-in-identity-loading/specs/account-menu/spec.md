## ADDED Requirements

### Requirement: Account identity shows a loading state until the planner account is known

While the planner account is loading, or re-authentication is starting
after an interaction-required load failure, the account trigger (desktop and
mobile) and the account card's identity header SHALL show a loading identity:
a placeholder avatar and a visible "Loading account" status. They SHALL NOT
show the neutral account label, the provider email, or the edit-name control
until the account loads. The trigger SHALL stay operable and expose a busy
state.

#### Scenario: Desktop trigger while the account loads

- **WHEN** a signed-in desktop user's account is still loading
- **THEN** the global-bar trigger shows a placeholder avatar and "Loading
  account" with a spinner, not "Signed-in account" or the email

#### Scenario: Desktop card while the account loads

- **WHEN** the user opens the desktop account card while the account is
  still loading
- **THEN** the identity header shows a skeleton name and "Loading account",
  no email, and no edit-name control, and the other card sections are usable

#### Scenario: Mobile drawer while the account loads

- **WHEN** a signed-in user below 768px opens the account drawer while the
  account is still loading
- **THEN** the avatar trigger shows a placeholder and the drawer's identity
  header shows the same loading identity as the desktop card

#### Scenario: Re-authentication starting

- **WHEN** the account load fails as interaction-required and the
  re-authentication redirect is starting
- **THEN** the loading identity stays in place instead of the neutral label
  and email

#### Scenario: Account loaded

- **WHEN** the account finishes loading
- **THEN** the trigger and card show the confirmed name (or the neutral
  label when none is set) and the email, and the trigger is no longer busy
