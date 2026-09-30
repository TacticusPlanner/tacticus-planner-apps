# account-menu Specification

## Purpose

Defines how the signed-in user's account menu presents itself and its identity on desktop — its trigger, its position and shape relative to that trigger, and the identity information shown when it opens — so it reads as a self-contained "account card" rather than a plain unlabeled dropdown. This capability covers the authenticated desktop account menu only; the sign-in button shown when signed out, and the mobile account drawer, are unaffected and out of scope.

## Requirements

### Requirement: Desktop account menu shows the signed-in user's identity above its actions

Opening the desktop account menu SHALL show the signed-in user's account avatar, display name, and email address as an identity header above the menu's existing actions (importing from V1, managing the account, and signing out). This identity header SHALL NOT be interactive.

#### Scenario: Opening the menu shows the user's identity

- **WHEN** a signed-in user opens the desktop account menu
- **THEN** the menu shows their account avatar, display name, and email address above its list of actions

#### Scenario: Existing menu actions are unaffected

- **WHEN** a signed-in user opens the desktop account menu
- **THEN** the same actions available before this change (import from V1, manage account, sign out) are still present and still behave as they did before

### Requirement: Desktop global bar account trigger shows the account avatar

The desktop global bar SHALL show the signed-in user's account avatar at the far right, with their display name when space permits. The trigger SHALL be independent of sidebar expansion and SHALL have an accessible account-menu label. At narrow desktop widths the name SHALL truncate or hide without losing access to the menu. No duplicate account trigger SHALL remain in the sidebar.

#### Scenario: Wide desktop trigger shows identity

- **WHEN** a signed-in user views the global bar with sufficient space
- **THEN** its far-right account trigger displays the avatar and display name regardless of main rail expansion

#### Scenario: Narrow desktop trigger remains accessible

- **WHEN** the global bar has insufficient width for the full account name
- **THEN** the name truncates or hides while the avatar and accessible account-menu trigger remain usable

### Requirement: Desktop account card opens below its top-right trigger

The desktop account card SHALL now open below the top-right global-bar trigger, aligned to its right edge, with a visible pointer and collision handling to stay within the viewport. The trigger SHALL remain visibly highlighted while open. Escape and outside click SHALL dismiss the card, and Escape SHALL return focus to the trigger.

#### Scenario: Opening the menu positions it below the trigger

- **WHEN** a signed-in user opens the desktop account menu
- **THEN** the card appears below and right-aligned to its trigger with a pointer connecting them and no content clipped outside the viewport

#### Scenario: Trigger stays highlighted while the menu is open

- **WHEN** the desktop account menu is open
- **THEN** the trigger is visually highlighted

#### Scenario: Keyboard dismissal returns focus

- **WHEN** the user presses Escape inside the account card
- **THEN** it closes and focus returns to the top-right trigger

### Requirement: Desktop account card is organised into identity, preferences, account, and session sections

The account card (desktop popover and mobile drawer share the same layout) SHALL present, top to bottom: (1) an identity header with the account avatar, display name, email, and an edit button that opens Account settings on its profile tab; (2) a Preferences section with the Light/System/Dark theme as an inline three-icon switch using the existing theme preference and persistence, and a Language row that shows the current language on its right with a chevron and opens an in-card language picker; (3) an "Account settings" row that opens the existing Account settings dialog, an "Import from V1" row that navigates to the existing V1 import page, a "Send feedback" row that opens the existing UserJot widget, and a "Roadmap" row that opens the public UserJot roadmap (`https://tacticusplanner.userjot.com/roadmap`) in a new tab with `rel="noopener noreferrer"`; (4) a "Sign out" row; and (5) the game catalog version from the existing catalog status as a quiet footer line. The card SHALL NOT have an Import & export submenu. The language picker SHALL list the supported languages, mark the current one, apply a selection immediately through the existing language logic, and return to the main card. Selecting a row that navigates or opens a dialog SHALL close the card. Changing theme SHALL apply immediately without navigation. Existing loading states, fallbacks, and authentication guards SHALL remain. Mobile account and theme behavior SHALL remain unchanged.

Export backup, Restore from backup, a Keyboard shortcuts list, and Delete account rows (and any Import & export submenu) are out of scope for this change; they are follow-up work that needs their own behavior and specs, and this change SHALL NOT add them.

#### Scenario: Card sections appear in order

- **WHEN** a signed-in desktop user opens the account menu
- **THEN** the identity header, Preferences, Account settings / Import from V1 / Send feedback / Roadmap rows, Sign out, and the catalog version footer appear in that order

#### Scenario: Edit button opens the profile tab

- **WHEN** a signed-in user with a confirmed account activates the identity header's edit button
- **THEN** Account settings opens on its profile tab and the card closes

#### Scenario: Change theme from the account card

- **WHEN** a signed-in desktop user opens the account menu and selects Dark
- **THEN** Dark is applied immediately and remains selected after refresh even though menu presentation states reset

#### Scenario: All supported themes remain available

- **WHEN** a user opens the desktop account card
- **THEN** Light, System, and Dark are keyboard-operable in the three-icon switch and the current selection is conveyed accessibly

#### Scenario: Language is chosen through a row-opened picker

- **WHEN** a user activates the Language row and chooses another language
- **THEN** the application language changes immediately, the card returns to its main view, and the row shows the new language

#### Scenario: Import from V1 is a top-level row

- **WHEN** a signed-in user activates the "Import from V1" row
- **THEN** the card closes and the existing V1 import page opens, with no intermediate submenu

#### Scenario: Account settings and feedback use existing flows

- **WHEN** a signed-in user activates Account settings or Send feedback
- **THEN** the existing Account settings dialog or UserJot widget opens and the card closes

#### Scenario: Roadmap opens the public roadmap

- **WHEN** a user (signed in or signed out) activates the Roadmap row in the desktop account or guest menu
- **THEN** the public roadmap opens in a new tab with `rel="noopener noreferrer"`, and the page header offers no separate board link

#### Scenario: Catalog status is a quiet footer

- **WHEN** the desktop account card is open
- **THEN** the existing catalog status text (for example the game catalog version) appears as a low-emphasis line at the bottom, and its error styling is preserved when the catalog is in error

#### Scenario: Mobile drawer uses the same card layout

- **WHEN** a signed-in user opens account controls below 768px
- **THEN** a full-height bottom drawer with safe-area padding and a Close button shows the same identity header, Preferences (theme switch and Language row with in-drawer picker), Account settings, Import from V1, Send feedback, Roadmap (new tab), Sign out, and catalog footer as the desktop card

#### Scenario: Mobile drawer keeps the tour reachable

- **WHEN** a signed-in user opens the mobile account drawer
- **THEN** a "Take a tour" row appears after Send feedback and before Roadmap, starts the general tour, and closes the drawer, and the mobile tour's drawer orchestration and test targets are unchanged

#### Scenario: Mobile guest settings match

- **WHEN** a signed-out user opens the mobile settings popover
- **THEN** it shows the same Preferences section (theme switch and Language row with picker), a Roadmap row, and the tour row, and no separate language selector remains

### Requirement: Signed-out desktop users retain account preferences access

On signed-out desktop pages, the global bar SHALL provide a guest account/preferences trigger at the far right containing the same Preferences section (theme switch and Language row with picker), the Roadmap row, and the existing sign-in action. It SHALL NOT show authenticated identity or account-only actions. Silent sign-in checking and manual sign-in behavior SHALL be preserved.

#### Scenario: Anonymous Library theme selection

- **WHEN** a signed-out user opens Library on desktop
- **THEN** they can choose Light/System/Dark through the top-right preferences menu without signing in

#### Scenario: Anonymous language selection

- **WHEN** a signed-out desktop user opens the preferences menu and activates the Language row
- **THEN** they can pick a supported language, since the page header no longer hosts a language control

#### Scenario: Sign-in while session restoration is pending

- **WHEN** silent sign-in restoration is pending and the guest menu is opened
- **THEN** the sign-in action shows its existing checking status and still supports manual sign-in
