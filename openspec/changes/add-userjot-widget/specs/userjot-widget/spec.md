## Purpose

Gives users an in-app entry point to send feedback, browse the roadmap, and read changelog updates, tied to their signed-in identity, without leaving the product.

## ADDED Requirements

### Requirement: Widget surfaces feedback, roadmap, and updates

The app SHALL load the UserJot widget so users can browse and submit feedback, view the roadmap, and read changelog updates from within the product. The app SHALL NOT provide any entry point to UserJot Conversations (live chat / direct messages).

#### Scenario: User reaches feedback, roadmap, and updates from the widget

- **WHEN** a user opens the widget from either entry point
- **THEN** they can navigate between feedback, roadmap, and updates without leaving the app

### Requirement: Desktop entry point lives in the section header

On desktop, the app SHALL show a feedback entry-point button in the section header's icon row, alongside the theme and language switches, in place of UserJot's default floating launcher. The button SHALL show an unread-activity indicator when the widget reports unread updates or activity.

#### Scenario: Opening the widget from the desktop header

- **WHEN** a desktop user clicks the feedback button in the section header
- **THEN** the widget opens

#### Scenario: Unread activity is reflected on the desktop button

- **WHEN** the widget reports unread updates or activity
- **THEN** the desktop header button shows an unread indicator, and the indicator clears once that activity has been seen

### Requirement: Mobile entry point lives in the account drawer

On mobile, the app SHALL show a "Feedback" row inside the existing account drawer, alongside the theme switch, language switch, and account actions, in place of UserJot's default floating launcher and in place of a separate header button.

#### Scenario: Opening the widget from the mobile account drawer

- **WHEN** a mobile user opens the account drawer and taps the Feedback row
- **THEN** the widget opens

### Requirement: Signed-in users are identified with a verified identity

When a user is signed in, the app SHALL identify that user to the widget using a signed identity token obtained from the backend, so the widget can trust the identity rather than accepting an unverified claim from the browser.

#### Scenario: Signing in identifies the user to the widget

- **WHEN** a user signs in
- **THEN** the widget receives a signed identity matching that user's account (id, email, and display name when known)

#### Scenario: Signing out clears the widget identity

- **WHEN** a signed-in user signs out
- **THEN** the app clears the widget's identity, and subsequent widget activity is anonymous

### Requirement: Widget stays usable if identification fails

If the app cannot obtain a signed identity token (for example, a network failure), the widget SHALL still open and remain usable for anonymous feedback, roadmap, and updates browsing rather than being blocked.

#### Scenario: Identity token fetch fails

- **WHEN** the signed identity token request fails while a user is signed in
- **THEN** the widget still opens and functions anonymously, without identifying the user

### Requirement: Widget theme follows the app's theme

The widget's color theme SHALL track the app's own theme setting (light or dark) rather than the browser or OS preference, and SHALL update without a page reload when the user changes the app's theme.

#### Scenario: Changing the app theme updates the widget

- **WHEN** a user changes the app's theme while the widget has already loaded
- **THEN** the widget's theme updates to match, without a page reload

### Requirement: Widget language follows the app's active language

The widget's displayed language SHALL track the app's currently active UI language rather than browser auto-detection, and SHALL update without a page reload when the user changes the app's language.

#### Scenario: Changing the app language updates the widget

- **WHEN** a user changes the app's active language while the widget has already loaded
- **THEN** the widget's displayed language updates to match, without a page reload
