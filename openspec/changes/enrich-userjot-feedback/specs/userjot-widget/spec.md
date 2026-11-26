## RENAMED Requirements

- FROM: `### Requirement: The public roadmap is reachable from the account menu`
- TO: `### Requirement: The roadmap is reachable from the account menu`

## ADDED Requirements

### Requirement: Feedback records the page it was sent from

The widget SHALL be initialised to record the path of the page a feedback post is sent from (not the query string), so a post says which page it is about without the user typing it.

#### Scenario: A post from the Goals page

- **WHEN** a user opens the widget on `/plan/goals` and submits a post
- **THEN** the post records `/plan/goals` as its page

### Requirement: Report a bug opens the submit form

The app SHALL offer a "Report a bug" entry that opens the widget directly on its submit form, instead of the widget's home: as a search quick action (see `app-navigation`), available signed in and signed out and disabled with the same explanation as Submit Feedback while the widget is unavailable, and as an action on the branded fallback error page (see `app-error-recovery`), which replaces the shell and its feedback button.

#### Scenario: Report a bug from search

- **WHEN** a user selects Report a bug in navigation search
- **THEN** search closes and the widget opens on its submit form

#### Scenario: Report a bug from the error page

- **WHEN** a page fails and the fallback error page shows
- **AND** the user activates Report a bug
- **THEN** the widget loads if needed and opens on its submit form

### Requirement: Deep links open a changelog post or a feedback request

Inside the app shell, a URL carrying `changelog=<UserJot update id>` SHALL open the widget on that changelog post, and one carrying `feedback=<UserJot request id>` SHALL open it on that request. The parameter SHALL then be removed from the URL (replacing the history entry), so a reload or Back does not reopen the widget. A changelog link wins when both are present. An empty id, or one longer than 64 characters, SHALL be ignored.

#### Scenario: An announcement links to a changelog post

- **WHEN** a user opens `/home?changelog=abc` from an announcement
- **THEN** the widget opens on that changelog post and the address becomes `/home`

#### Scenario: A link to a feedback request

- **WHEN** a user opens a page with `?feedback=req` in its address
- **THEN** the widget opens on that request

## MODIFIED Requirements

### Requirement: No default UserJot UI appears outside the app's own entry points

On every page and in every auth state, the app SHALL suppress UserJot's floating launcher button and auto-shown changelog announcements, so the widget only ever opens as a direct result of the user activating one of this app's own entry points (the desktop feedback button, the account menu's Send feedback, Roadmap and Changelog rows, the search quick actions, the error page's Report a bug action, or a widget deep link). The one proactive notice allowed is the widget's short "whisper" for activity on the user's own posts (a team reply or a vote); it SHALL NOT be used for changelog updates, which only show the unread indicator. This SHALL hold on pages where no custom entry point is rendered at all, such as the unauthenticated landing page, not only on pages where one is.

#### Scenario: No proactive popup on the unauthenticated landing page

- **GIVEN** a signed-out user on the landing page
- **WHEN** the page loads and remains open with no user interaction
- **THEN** no UserJot popup, toast, or launcher button appears

#### Scenario: No proactive popup on an authenticated page

- **GIVEN** a signed-in user on any page inside the app shell
- **WHEN** the page loads and remains open with no interaction with a UserJot entry point
- **THEN** no UserJot popup, toast, or launcher button appears unprompted

#### Scenario: A reply to the user's post shows a short notice

- **GIVEN** a signed-in user whose feedback post received a team reply since they last looked
- **WHEN** the widget has loaded on any page inside the app shell
- **THEN** a short notice about the reply may appear, and opening it shows the reply
- **AND** a new changelog update still shows only the unread indicator, never a notice

### Requirement: Signed-in users are identified with a verified identity

When a user is signed in, the app SHALL identify that user to the widget using a signed identity token obtained from the backend, so the widget can trust the identity rather than accepting an unverified claim from the browser. The client SHALL not substitute provider/email-like data for a display name that has not been set. After a successful display-name update, it SHALL fetch a fresh token and refresh the widget identity within the session. Each token request SHALL carry the non-identifying feedback context the API signs into the token's traits (see `userjot-identity-token`): the running app version when the build has one, whether the app runs installed or in a browser tab, and the active UI language. A language change alone SHALL NOT re-identify the widget; the next token carries the new language.

#### Scenario: Signing in identifies the user to the widget

- **WHEN** a user with a name signs in
- **THEN** the widget receives a signed identity matching that user's account id and display name; the user's email is never included

#### Scenario: Signing out clears the widget identity

- **WHEN** a signed-in user signs out
- **THEN** the app clears the widget's identity, and subsequent widget activity is anonymous

#### Scenario: No name uses only the server token fallback

- **WHEN** a signed-in user has not set a name
- **THEN** the client uses the server's signed generic identity and does not send its private suggestion to the widget

#### Scenario: Editing name refreshes identity

- **WHEN** a signed-in user successfully saves a new display name
- **THEN** a newly fetched signed token identifies the same stable account id with the new name without requiring sign-out

#### Scenario: The token carries feedback context

- **GIVEN** a signed-in user running the installed app in German
- **WHEN** the app fetches a token to identify them
- **THEN** the request carries the app version, `installed` and `de`, and the user's posts show that context to the team

### Requirement: The roadmap is reachable from the account menu

Inside the app shell, the account menu's Roadmap row (signed in and signed out, desktop and mobile; see `account-menu`) SHALL open the widget's Roadmap, so the user stays in the app and, when signed in, keeps their verified identity. While the widget is unavailable (its SDK failed to load), and on public pages where the widget is not mounted, the row SHALL instead open the public UserJot roadmap in a new tab without any sign-in or identify step. There SHALL be no separate board link beside the feedback button. The search quick actions SHALL open the widget only.

#### Scenario: The roadmap opens inside the app

- **GIVEN** a user inside the app shell whose widget is available
- **WHEN** they activate the Roadmap row in the account or guest menu
- **THEN** the menu closes and the widget opens on its Roadmap

#### Scenario: The roadmap still works when the widget cannot load

- **GIVEN** the widget SDK failed to load
- **WHEN** a user activates the Roadmap row
- **THEN** the public roadmap opens in a new tab, with no identify/sign-in step required first

#### Scenario: The roadmap works without a signed-in session on public pages

- **GIVEN** an unauthenticated user on a public page, where the widget is not mounted
- **WHEN** they activate the Roadmap row in the preferences menu
- **THEN** the public roadmap opens in a new tab
