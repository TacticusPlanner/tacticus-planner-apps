# app-error-recovery Specification

## Purpose

Defines what the app does when loading or rendering a route fails: how a tab left open across a deploy recovers on its own, what the user sees when an error is not recoverable, and the entry-file caching rule that makes recovery pick up the new build.

## Requirements

### Requirement: A stale-build failure reloads the app once

When route rendering or navigation fails because the running build is stale — a dynamic route module cannot be fetched or executed, a module preload fails before first render, or the local game-catalog or player-data database connection has been closed or outversioned by a newer tab — the app SHALL reload the current URL automatically, exactly once per browser session for that URL, without showing an error page first. The reload SHALL preserve the current path and query so the user lands where they were.

If the same URL fails in the same way again after that reload, the app SHALL NOT reload again and SHALL instead show the fallback error page (below), so a genuinely broken build cannot loop.

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

### Requirement: Non-recoverable errors show a branded fallback page

When rendering a route throws an error that is not a stale-build failure, the app SHALL render its own fallback error page in the app's visual style and current language instead of the routing library's default error output. The page SHALL state that something went wrong, SHALL offer a Reload action and a Go to Home action, and SHALL point the user to the in-app feedback entry for reporting. It SHALL NOT show a raw stack trace to the user; the error SHALL be written to the browser console for diagnosis.

#### Scenario: Render error inside a page

- **WHEN** a component on the Dailies page throws during render
- **THEN** the fallback page replaces the page content, the error is logged to the console, and the user can choose Reload or Go to Home

#### Scenario: Fallback page is translated

- **GIVEN** the user's language is German
- **WHEN** the fallback page is shown
- **THEN** its heading, description, and both actions are in German

#### Scenario: Go to Home from the fallback page

- **WHEN** the user chooses Go to Home on the fallback page
- **THEN** the app navigates to `/home` and renders it normally without a full page reload

### Requirement: The entry document is never served from a long-lived cache

The app's entry document (`/index.html`, including every path the hosting fallback rewrites to it) SHALL be served with cache directives that make the browser revalidate it on every navigation, so a plain navigation or reload after a deploy always loads the current build's entry. Content-hashed assets keep their long-lived caching.

#### Scenario: Navigation after a deploy gets the new entry

- **GIVEN** a user loaded the app before a deploy
- **WHEN** they navigate to `/dailies` by entering the address or reloading
- **THEN** the browser revalidates the entry document and receives the new build's entry, not a cached copy of the previous one
