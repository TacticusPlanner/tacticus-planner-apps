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

The one exception is the sign-in steps of "Sign-in steps are reported once identified": they describe how the user got signed in, not what they did in the planner, and are sent only once that user is identified.

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

While a user is identified, the client SHALL report a page view (PostHog's `$pageview` event, so the built-in Web analytics dashboard works) when the active route changes. The event SHALL carry the route group and the view mode in use, so V2 navigation can be compared against the equivalent V1 measurements. The event SHALL NOT carry route parameters, query strings, or fragments that may contain user-specific values.

#### Scenario: Navigating between sections

- **WHEN** an identified user navigates from one route to another
- **THEN** a single `$pageview` event is reported for the destination route, carrying its route group and the current view mode

#### Scenario: A route that only redirects is not reported

- **WHEN** an identified user opens a route whose only job is to send them on to another page (a section's bare path such as `/plan` or `/dailies`, or an old address that moved)
- **THEN** a single `$pageview` event is reported for the page they land on and none for the route they were sent on from, and the redirect leaves no browser history entry of its own

#### Scenario: View mode reflects the layout in use

- **WHEN** an identified user is served the mobile layout rather than the desktop layout
- **THEN** the reported view mode distinguishes the two

#### Scenario: Route detail is not reported

- **WHEN** an identified user navigates to a route containing parameters or a query string
- **THEN** the reported event identifies the route and its group, and does not include the parameter or query values

#### Scenario: URLs the SDK adds on its own are redacted too

- **WHEN** an identified user leaves or reaches a route containing parameters, or a web vitals metric is reported for it
- **THEN** the previous-page path is reported as that page's route pattern, and every URL in the event, including those nested inside web vitals metrics, carries the route pattern or no query string, never the parameter or query values

### Requirement: Only declared events are captured

The client SHALL report only events the product has explicitly declared. It SHALL NOT enable automatic capture of clicks, taps, form interactions, keystrokes, or input values, and SHALL NOT record or replay user sessions. Every reported event SHALL carry the app version of the build that sent it (`app_version`), including after the user signs out and back in, so any event can be attributed to a release. Exception events SHALL also carry it as `build_version`, because Error Tracking sets `app_version` from the release it resolves from the stack's script files, and a script file left unchanged across builds resolves to the first build that shipped it.

#### Scenario: Events name the build that sent them

- **WHEN** an identified user's page view, web vitals or exception event is sent from a versioned build
- **THEN** the event carries that build's app version

#### Scenario: Exceptions keep the build that sent them

- **WHEN** an exception is thrown from a script file that is unchanged since an earlier build
- **THEN** the exception's `build_version` names the build that sent it, whatever release Error Tracking resolves

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

### Requirement: Each environment reports to its own analytics project

When a staging-specific analytics token is configured, the staging deployment SHALL report to an analytics project distinct from production's, so staging page views, declared events and client errors never mix into production measurements. Without one, staging SHALL send nothing and SHALL NOT fall back to the production token.

#### Scenario: Page view on staging

- **WHEN** an identified user navigates on the staging deployment
- **THEN** the `$pageview` event is recorded in the staging analytics project and not in production's

#### Scenario: Staging without its own configuration

- **WHEN** the staging build is produced without a staging-specific analytics token
- **THEN** analytics is inert on staging (no outbound request), rather than falling back to the production token

### Requirement: Client errors are a declared event

A client error (see `client-error-reporting`) SHALL be the only error-derived event the client reports. It is sent as the analytics SDK's exception event (`$exception`) so it appears in the destination's error tracking, and it SHALL follow every privacy rule of this capability: identified users only, pseudonymous identity, no input values, no route parameters or query strings. The SDK's own exception autocapture SHALL stay off, so every reported error goes through the one capture path.

#### Scenario: Error while editing a goal

- **WHEN** an identified user has typed into a goal form and an uncaught error occurs
- **THEN** the reported exception carries the message, stack, route group and app version, and none of the typed values

### Requirement: Analytics code is loaded only once a user is identified

The client SHALL NOT download or initialise the analytics SDK until a signed-in user's analytics id is available. Before that point no analytics script is requested and no analytics network traffic of any kind occurs. Loading the SDK SHALL NOT delay rendering or navigation, and a failed or blocked SDK download SHALL leave the app fully functional with capture silently off.

#### Scenario: Signed-out visitor on an anonymous page

- **WHEN** a visitor who is not signed in opens any page, including anonymously-accessible Library pages
- **THEN** no analytics script is downloaded and no request to the analytics destination is made

#### Scenario: User becomes identified

- **WHEN** a signed-in user's analytics id becomes available
- **THEN** the analytics SDK is downloaded, the identity is established, and the page view for the current route is reported once the SDK is ready

#### Scenario: SDK download blocked

- **WHEN** the analytics script cannot be downloaded (network policy, blocker, outage)
- **THEN** the app renders and navigates normally, shows no error, and reports nothing

#### Scenario: Signing out before the SDK finished loading

- **WHEN** a user signs out while the analytics SDK is still downloading
- **THEN** no event is reported for that user and no identity is established when the download completes

### Requirement: Sign-in steps are reported once identified

The client SHALL record each step the sign-in machinery takes on the device (the cached-token restore, the hidden-frame check, a quiet renewal started, skipped or returned, an interactive redirect started or returned) and SHALL report them as `auth_step` events only once the user is identified, each dated when it happened and grouped by page load. A step carries its name, outcome, protocol error code (MSAL's code plus Entra's AADSTS code, never the error message), and, where they apply, whether it started from a cached account or a remembered hint, why a renewal was skipped, whether an interactive redirect was started by the app or the user, the sign-in method and whether a fresh login was asked for. It SHALL NOT carry a username, login hint, token, URL or error message. The device keeps at most 60 steps from the last 7 days, sends each once, and drops them on sign-out.

#### Scenario: A sign-in loop is reported after the user signs in by hand

- **WHEN** a returning user's restore fails, a quiet renewal comes back without a session and the app starts an interactive redirect, and the user then signs in
- **THEN** once they are identified, each of those steps is reported as `auth_step` with its outcome and error code, dated when it happened

#### Scenario: A redirect response never arrives

- **WHEN** a redirect left the page and the page it returns to finds no response
- **THEN** a `no_response` return step is recorded

#### Scenario: Nobody signs in afterwards

- **WHEN** the recorded steps end with the visitor signed out and nobody signs in on the device
- **THEN** nothing is reported, and steps older than 7 days are dropped

### Requirement: Installing the app is a declared event

The client SHALL report `app_install_guide_opened` (source `homeCard` or `accountMenu`, the install platform, and whether the browser offered its prompt) when the install guide opens, `app_install_prompt_answered` (source and `accepted` or `dismissed`) when the browser's install prompt is answered, and `app_install_card_dismissed` (the install platform) when Not now hides the Home install card.

#### Scenario: Installing from Home

- **WHEN** an identified user taps Install on the Home card and accepts the browser's prompt
- **THEN** `app_install_prompt_answered` is reported with source `homeCard` and outcome `accepted`

### Requirement: Web vitals are reported with diagnostic attribution

While a user is identified, the client SHALL report Core Web Vitals (CLS, INP, LCP, FCP) for the pages they use, each labelled with the route pattern of the page the metric was measured on. CLS, INP and LCP SHALL carry diagnostic attribution limited to element selectors, the interaction type, the LCP resource URL without its query string, and timing values. Attribution SHALL NOT include text content, input values or any URL parameter or query values.

#### Scenario: A metric is sent after the user has moved on

- **GIVEN** an identified user loads `/library/characters/abc-123` and navigates to `/home` before that page's LCP is sent
- **WHEN** the LCP metric is reported
- **THEN** it is reported against `/library/characters/:entityId`, not `/home`

#### Scenario: A layout shift or slow interaction is sent from a later page

- **GIVEN** an identified user's page shifts, or responds slowly to a tap, on `/legendary-events/:eventId/:tab`, and the user then moves to `/home`
- **WHEN** the CLS or INP value is sent from `/home` as the page is hidden
- **THEN** the metric is labelled with `/legendary-events/:eventId/:tab`, the route open at its largest shift or at its slowest interaction, in its own `web_vitals_<metric>_route` property
- **AND** the event's own path is that route only when every metric it carries was measured there

#### Scenario: A layout shift is attributed

- **WHEN** a CLS value is reported for an identified user
- **THEN** it carries the selector of the element with the largest shift, its time and its value, and no text from the page

#### Scenario: A slow interaction is attributed

- **WHEN** an INP value is reported for an identified user
- **THEN** it carries the selector of the interaction target, the interaction type and the input-delay, processing and presentation timings, and no input value

### Requirement: Navigation search usage is a declared event

The client SHALL report `navigation_search_opened` when navigation search opens, with how it was opened (`shortcut`, `topBar` or `mobileMenu`) and the view mode. It SHALL report `navigation_search_item_selected` for each row or phone Menu chip picked, with the item's kind (page, recent page, action, a unit's Create goal, Find in Collection, or an entity kind), its target (the page's nav path, the action id or the entity's game id), its group, its 1-based position in the list or chip row, the query's length, whether it was picked with the keyboard or the pointer, and the view mode. It SHALL report `navigation_search_dismissed` when search closes without a pick, with the query's length, the number of rows listed and the view mode. No navigation search event SHALL carry the text of the query, and Find in Collection SHALL report no target.

#### Scenario: Opening a unit from the keyboard

- **WHEN** an identified desktop user opens search from the top bar, types "calgar" and presses Enter on Marneus Calgar
- **THEN** `navigation_search_opened` is reported with source `topBar`, and `navigation_search_item_selected` with kind `characters`, target `ultraCalgar`, query length 6 and method `keyboard`, and neither event carries "calgar"

#### Scenario: Closing without a pick

- **WHEN** an identified user types a query with no results and closes search
- **THEN** `navigation_search_dismissed` is reported with the query's length and 0 rows, and no pick is reported

#### Scenario: Picking a chip on the phone

- **WHEN** an identified user opens the Menu and taps the Create goal chip
- **THEN** `navigation_search_item_selected` is reported with kind `action`, target `createGoal`, group `chips`, position 1 and method `pointer`
