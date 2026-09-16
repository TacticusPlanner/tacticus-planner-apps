# product-analytics Specification

## Purpose

Defines when the web client may report product usage to the external analytics destination, whose identity it reports, and the privacy floor it holds to — capturing only signed-in users, only events the product has deliberately declared, and never the contents of what a user types into the planner.

## Requirements

### Requirement: Only signed-in, identified users are captured

The client SHALL NOT report any event — including page views — for a visitor who is not signed in and fully identified. Capture SHALL begin only once the user is authenticated **and** their analytics id is available, and SHALL cover no activity that happened before that point.

#### Scenario: A signed-out visitor browses the app

- **WHEN** a visitor who is not signed in navigates anywhere in the app, including anonymously-accessible pages
- **THEN** no event is reported and no analytics identity is established for them

#### Scenario: Authentication has completed but the account has not yet resolved

- **WHEN** a user is authenticated but their analytics id has not yet been retrieved
- **THEN** no event is reported until the analytics id is available

#### Scenario: The account cannot be retrieved

- **WHEN** a user is authenticated but their account record fails to load
- **THEN** no event is reported, and the failure does not surface an analytics-related error to the user

#### Scenario: Pre-sign-in activity is not backfilled

- **WHEN** a visitor browses several pages and then signs in
- **THEN** only activity from the point of identification onward is reported, and the earlier page views are not sent retroactively

### Requirement: The reported identity is the pseudonymous analytics id

When the client identifies a user to the analytics destination, it SHALL use the analytics id supplied by the API for that account. It SHALL NOT use the account's application user id, display name, email address, or any other account attribute as the reported identity, and SHALL NOT attach them as properties.

#### Scenario: Identification uses the analytics id

- **WHEN** a signed-in user is identified to the analytics destination
- **THEN** the reported identity is that account's analytics id

#### Scenario: Account attributes are never reported

- **WHEN** a signed-in user is identified to the analytics destination
- **THEN** no application user id, display name, or email address is sent as the identity or as a property

### Requirement: Signing out ends capture and clears the identity

When a user signs out, the client SHALL clear the established analytics identity and SHALL stop reporting events. Activity after sign-out SHALL NOT be attributed to the account that was signed in, nor reported anonymously.

#### Scenario: A user signs out

- **WHEN** a signed-in user signs out
- **THEN** the analytics identity is cleared and no further events are reported

#### Scenario: Browsing continues after sign-out

- **WHEN** a user signs out and then navigates to other pages
- **THEN** no event is reported for that navigation, and nothing is attributed to the previously signed-in account

#### Scenario: A different user signs in afterwards

- **WHEN** one user signs out and a different user signs in on the same device
- **THEN** the second user's events are attributed to their own analytics id and never to the first user's

### Requirement: Navigation is reported as declared page-view events

While a user is identified, the client SHALL report a `page_view` event when the active route changes. The event SHALL carry the route group and the view mode in use, so V2 navigation can be compared against the equivalent V1 measurements. The event SHALL NOT carry route parameters, query strings, or fragments that may contain user-specific values.

#### Scenario: Navigating between sections

- **WHEN** an identified user navigates from one route to another
- **THEN** a single `page_view` event is reported for the destination route, carrying its route group and the current view mode

#### Scenario: View mode reflects the layout in use

- **WHEN** an identified user is served the mobile layout rather than the desktop layout
- **THEN** the reported view mode distinguishes the two

#### Scenario: Route detail is not reported

- **WHEN** an identified user navigates to a route containing parameters or a query string
- **THEN** the reported event identifies the route and its group, and does not include the parameter or query values

### Requirement: Only declared events are captured

The client SHALL report only events the product has explicitly declared. It SHALL NOT enable automatic capture of clicks, taps, form interactions, keystrokes, or input values, and SHALL NOT record or replay user sessions.

#### Scenario: Interacting with the planner

- **WHEN** an identified user clicks buttons, edits fields, and types into planner inputs
- **THEN** no event is reported for those interactions and no input value is transmitted

#### Scenario: No session recording

- **WHEN** an identified user uses the app
- **THEN** no session recording or replay of their activity is captured

### Requirement: Analytics is inert when not configured and never degrades the app

When no analytics destination is configured, the client SHALL run normally and attempt no outbound analytics request. A slow, blocked, or failing analytics destination SHALL NOT delay rendering, block navigation, or surface an error to the user.

#### Scenario: Running without analytics configuration

- **WHEN** the app runs with no analytics destination configured
- **THEN** it behaves normally and no outbound analytics request is attempted

#### Scenario: The analytics destination is blocked

- **WHEN** a browser extension or network policy blocks requests to the analytics destination
- **THEN** the app continues to render and navigate normally and shows the user no error
