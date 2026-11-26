## MODIFIED Requirements

### Requirement: Desktop account card is organised into identity, preferences, account, and session sections

The account card (desktop popover and mobile drawer share the same layout) SHALL present, top to bottom: (1) an identity header with the account avatar, display name, email, the sign-in method ("Signed in with Google" when the ID token's `idp` claim is `google.com`, otherwise "Signed in with email"), and an edit button that opens Account settings on its profile tab; (2) a Preferences section with the Light/System/Dark theme as an inline three-icon switch using the existing theme preference and persistence, and a Language row that shows the current language on its right with a chevron and opens an in-card language picker; (3) an "Account settings" row that opens the existing Account settings dialog, an "Import from V1" row that navigates to the existing V1 import page, a "Send feedback" row that opens the existing UserJot widget, and a "Roadmap" row that opens the widget's Roadmap (see `userjot-widget`), or, while the widget is unavailable, the public UserJot roadmap (`https://tacticusplanner.userjot.com/roadmap`) in a new tab with `rel="noopener noreferrer"`; (4) a "Sign out" row; and (5) the game catalog version from the existing catalog status as a quiet footer line. The email SHALL come from the ID token's `email` claim, falling back to the account username only for email sign-ins, because a Google account's username is a generated `<oid>@<tenant>.onmicrosoft.com`; when neither applies the email line is left out. The card SHALL NOT have an Import & export submenu. The language picker SHALL list the supported languages, mark the current one, apply a selection immediately through the existing language logic, and return to the main card. Selecting a row that navigates or opens a dialog SHALL close the card. Changing theme SHALL apply immediately without navigation.

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

#### Scenario: Roadmap opens the widget's roadmap

- **WHEN** a user (signed in or signed out) activates the Roadmap row in the desktop account or guest menu inside the app shell
- **THEN** the menu closes and the widget opens on its Roadmap, and the page header offers no separate board link

#### Scenario: Roadmap falls back to the public roadmap

- **GIVEN** the widget SDK failed to load
- **WHEN** a user activates the Roadmap row
- **THEN** the public roadmap opens in a new tab with `rel="noopener noreferrer"`

#### Scenario: Catalog status is a quiet footer

- **WHEN** the desktop account card is open
- **THEN** the existing catalog status text (for example the game catalog version) appears as a low-emphasis line at the bottom, and its error styling is preserved when the catalog is in error

#### Scenario: Mobile drawer uses the same card layout

- **WHEN** a signed-in user opens account controls below 768px
- **THEN** a full-height bottom drawer with safe-area padding and a Close button shows the same identity header, Preferences (theme switch and Language row with in-drawer picker), Account settings, Import from V1, Send feedback, Roadmap, Sign out, and catalog footer as the desktop card

#### Scenario: Mobile drawer keeps the tour reachable

- **WHEN** a signed-in user opens the mobile account drawer
- **THEN** a "Take a tour" row appears after Send feedback and before Roadmap, starts the general tour, and closes the drawer

#### Scenario: Mobile guest settings match

- **WHEN** a signed-out user opens the mobile settings popover
- **THEN** it shows the same Preferences section (theme switch and Language row with picker), a Roadmap row, and the tour row, and no separate language selector remains
