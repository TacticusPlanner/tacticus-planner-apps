# account-menu Specification

## Purpose

Defines how the signed-in user's account menu presents itself and its identity on desktop — its trigger, its position and shape relative to that trigger, and the identity information shown when it opens — so it reads as a self-contained "account card" rather than a plain unlabeled dropdown. This capability covers the authenticated desktop account menu only; the sign-in button shown when signed out, and the mobile account drawer, are unaffected and out of scope.

## Requirements

### Requirement: Desktop account menu trigger shows the account avatar

The desktop sidebar's account menu trigger SHALL show the signed-in user's account avatar (the same colored-initials avatar already used on mobile), rather than a generic person icon, in both the expanded and icon-collapsed sidebar states.

#### Scenario: Expanded sidebar trigger shows the avatar and name

- **WHEN** a signed-in user views the expanded desktop sidebar
- **THEN** the account menu trigger shows their account avatar beside their display name

#### Scenario: Collapsed sidebar trigger shows the avatar alone

- **WHEN** a signed-in user views the icon-collapsed desktop sidebar
- **THEN** the account menu trigger shows their account avatar at the collapsed trigger's size, with no name text

### Requirement: Desktop account menu opens as a card positioned above and beside its trigger

Opening the desktop account menu SHALL position it above its bottom-left trigger, allowed to visually extend beyond the sidebar's own edge into the main content area, with a visible pointer connecting the open menu back to its trigger. The trigger SHALL remain visibly highlighted while its menu is open.

#### Scenario: Opening the menu positions it above the trigger

- **WHEN** a signed-in user opens the desktop account menu
- **THEN** the menu appears above its trigger rather than below it, with a pointer connecting it back to the trigger row

#### Scenario: Trigger stays highlighted while the menu is open

- **WHEN** the desktop account menu is open
- **THEN** its trigger row is shown in a visibly highlighted state, distinct from its normal unopened appearance

### Requirement: Desktop account menu shows the signed-in user's identity above its actions

Opening the desktop account menu SHALL show the signed-in user's account avatar, display name, and email address as an identity header above the menu's existing actions (importing from V1, managing the account, and signing out). This identity header SHALL NOT be interactive.

#### Scenario: Opening the menu shows the user's identity

- **WHEN** a signed-in user opens the desktop account menu
- **THEN** the menu shows their account avatar, display name, and email address above its list of actions

#### Scenario: Existing menu actions are unaffected

- **WHEN** a signed-in user opens the desktop account menu
- **THEN** the same actions available before this change (import from V1, manage account, sign out) are still present and still behave as they did before
