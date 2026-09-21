# userjot-widget Specification

## Purpose

Gives users an in-app entry point to send feedback, browse the roadmap, and read changelog updates, tied to their signed-in identity, without leaving the product.

## Requirements

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

### Requirement: Both entry points also link to the full public board

Alongside each in-app widget entry point (the desktop header button and the mobile account drawer row), the app SHALL show a link to the project's public UserJot board that opens in a new tab, so the full board is reachable without prior knowledge of its URL or a separate announcement post. This link SHALL NOT depend on the user being signed in or identified to the widget — the public board is browsable anonymously.

#### Scenario: Reaching the full board from the desktop header

- **GIVEN** a user viewing the desktop header
- **WHEN** they activate the "view full board" link beside the feedback button
- **THEN** the project's public UserJot board opens in a new tab

#### Scenario: Reaching the full board from the mobile account drawer

- **GIVEN** a user with the mobile account drawer open
- **WHEN** they activate the "view full board" row beside the Feedback row
- **THEN** the project's public UserJot board opens in a new tab

#### Scenario: The link works without a signed-in session

- **GIVEN** an unauthenticated user
- **WHEN** they activate the "view full board" link
- **THEN** the public board opens in a new tab, with no identify/sign-in step required first

### Requirement: No default UserJot UI appears outside the app's own entry points

On every page and in every auth state, the app SHALL suppress all of UserJot's proactive default UI — the floating launcher button, ephemeral "whisper" notification toasts, and auto-shown changelog announcements — so the widget only ever opens as a direct result of the user activating one of this app's own entry points (the desktop header button, the mobile drawer row, or the full-board link). This SHALL hold on pages where no custom entry point is rendered at all, such as the unauthenticated landing page, not only on pages where one is.

#### Scenario: No proactive popup on the unauthenticated landing page

- **GIVEN** a signed-out user on the landing page
- **WHEN** the page loads and remains open with no user interaction
- **THEN** no UserJot popup, toast, or launcher button appears

#### Scenario: No proactive popup on an authenticated page

- **GIVEN** a signed-in user on any page inside the app shell
- **WHEN** the page loads and remains open with no interaction with a UserJot entry point
- **THEN** no UserJot popup, toast, or launcher button appears unprompted

### Requirement: Signed-in users are identified with a verified identity

When a user is signed in, the app SHALL identify that user to the widget using a signed identity token obtained from the backend, so the widget can trust the identity rather than accepting an unverified claim from the browser.

#### Scenario: Signing in identifies the user to the widget

- **WHEN** a user signs in
- **THEN** the widget receives a signed identity matching that user's account (id and display name); the user's email is never included, for privacy

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
