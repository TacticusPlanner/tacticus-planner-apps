## MODIFIED Requirements

### Requirement: A stale-build failure reloads the app once

When route rendering or navigation fails because the running build is stale — a dynamic route module cannot be fetched or executed, a module preload fails before first render, or the local game-catalog or player-data database connection has been closed or outversioned by a newer tab — the app SHALL reload the current URL automatically, exactly once per browser session for that URL, without showing an error page first. The reload SHALL preserve the current path and query so the user lands where they were.

If the same URL fails in the same way again after that reload, the app SHALL NOT reload again and SHALL instead show the fallback error page (below), so a genuinely broken build cannot loop.

While a sign-in redirect (interactive or quiet) is leaving the page, a stale-build failure SHALL NOT reload it: some browsers abort the page's in-flight module loads as soon as the redirect starts, and a reload would cancel the redirect. The app renders nothing in the meantime and keeps that URL's reload attempt. If the redirect cannot start after all, stale-build failures reload as before.

#### Scenario: Lazy route chunk missing after a deploy

- **GIVEN** a signed-in user has had `/home` open since before a new build was deployed
- **WHEN** they navigate to `/plan` and the route's script cannot be fetched
- **THEN** the app reloads `/plan` once and, with the new build, renders the Goals page with the user still signed in

#### Scenario: Module preload fails before React renders

- **GIVEN** the entry page loaded but one of its preloaded modules fails to load
- **WHEN** the preload failure is reported
- **THEN** the app reloads the current URL once, without rendering the fallback error page

#### Scenario: Local database closed by a newer tab

- **GIVEN** a user has two tabs open and the second tab, running a newer build, upgraded the local game-catalog database
- **WHEN** the first tab's next catalog read fails because its connection was closed
- **THEN** the first tab reloads its current URL once and renders normally on the new build

#### Scenario: Second failure on the same URL shows the error page

- **GIVEN** the app already auto-reloaded `/plan` once in this browser session for a stale-build failure
- **WHEN** rendering `/plan` fails the same way again
- **THEN** the app does not reload and shows the fallback error page with a Reload action

#### Scenario: Module loads aborted by a sign-in redirect

- **GIVEN** a returning user whose session needs an interactive redirect, on Firefox
- **WHEN** the redirect starts while a lazy route chunk is still loading, and the browser aborts that load
- **THEN** the app does not reload, and the redirect reaches the identity provider
