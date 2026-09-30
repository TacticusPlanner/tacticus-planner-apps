## ADDED Requirements

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

### Requirement: Desktop account preferences include theme selection

The desktop account card SHALL contain an inline Light/System/Dark theme selector using the existing theme preference and persistence. Changing theme SHALL apply immediately without navigation. Existing account identity, name editing, catalog status, import, account management, sign-out actions, loading states, and authentication guards SHALL remain available as before. Mobile account and theme behavior SHALL remain unchanged.

#### Scenario: Change theme from the account card

- **WHEN** a signed-in desktop user opens the account menu and selects Dark
- **THEN** Dark is applied immediately and remains selected after refresh even though menu presentation states reset

#### Scenario: All supported themes remain available

- **WHEN** a user opens the desktop account card
- **THEN** Light, System, and Dark are keyboard-operable and the current selection is conveyed accessibly

#### Scenario: Existing account actions remain available

- **WHEN** a signed-in user opens the relocated account card
- **THEN** identity, name editing, catalog status, import, account management, and sign-out retain their existing behavior and loading/error fallbacks

#### Scenario: Mobile account behavior is preserved

- **WHEN** a user opens account controls below 768px
- **THEN** the existing mobile drawer and theme controls behave as before without the desktop card

### Requirement: Signed-out desktop users retain account preferences access

On signed-out desktop pages, the global bar SHALL provide a guest account/preferences trigger at the far right containing theme selection and the existing sign-in action. It SHALL NOT show authenticated identity or account-only actions. Silent sign-in checking and manual sign-in behavior SHALL be preserved.

#### Scenario: Anonymous Library theme selection

- **WHEN** a signed-out user opens Library on desktop
- **THEN** they can choose Light/System/Dark through the top-right preferences menu without signing in

#### Scenario: Sign-in while session restoration is pending

- **WHEN** silent sign-in restoration is pending and the guest menu is opened
- **THEN** the sign-in action shows its existing checking status and still supports manual sign-in

## REMOVED Requirements

### Requirement: Desktop account menu trigger shows the account avatar

**Reason**: The account trigger moves from the sidebar to the global bar and no longer depends on sidebar expansion.
**Migration**: Use "Desktop global bar account trigger shows the account avatar".

### Requirement: Desktop account menu opens as a card positioned above and beside its trigger

**Reason**: The top-right placement needs a downward-opening card.
**Migration**: Use "Desktop account card opens below its top-right trigger".
