# client-error-reporting Specification

## Purpose

Defines what happens to an error that no component, request handler or background loop caught: it is logged for diagnosis, reported to the analytics destination when the user is identified, and never breaks the page or exposes user input.

## Requirements

### Requirement: Uncaught errors and rejections are captured once

The app SHALL capture every uncaught exception and unhandled promise rejection raised in the page, including failures of the background game-catalog and player-data sync loops, and every error that a route's error page catches while rendering, through a single capture path. A stale-build failure that the error page answers with a reload is not captured. The app SHALL write each error to the browser console exactly once with its message and stack, and SHALL report the same error object at most once. The listeners do not cancel the events, so the browser's own default report of an uncaught error may also appear; that report is not counted as the app's log.

#### Scenario: Background sync loop fails

- **WHEN** a scheduled player-data sync rejects with a network error outside any request handler
- **THEN** the error is logged once to the console, the page keeps rendering, and the next scheduled sync still runs

#### Scenario: Page crashes while rendering

- **WHEN** a page throws while rendering and the branded error page replaces it
- **THEN** the error is logged once and captured, even though React caught it before it reached the window

#### Scenario: Promise rejected outside React

- **WHEN** a promise created by a provider effect rejects and nothing awaits it
- **THEN** the rejection is logged once and no fallback error page is shown

### Requirement: Captured errors are reported only for identified users

When analytics is configured and the current user is identified (see `product-analytics`), a captured error SHALL be reported as an exception event (`$exception`) carrying the error name, message, stack, capture context, current route group and app version. It SHALL NOT attach form values, route parameters or request bodies, and query strings SHALL be stripped from the message and stack (a stack frame keeps its line and column); the error text is otherwise sent as raised, without further redaction. When the user is not identified or analytics is not configured, nothing SHALL be sent.

#### Scenario: Identified user hits an uncaught error

- **GIVEN** a signed-in user whose analytics id is available
- **WHEN** an uncaught error occurs on `/plan/goals?goal=123`
- **THEN** one exception is reported with the message, stack, route group `plan` and app version, and without the `goal` query value

#### Scenario: Anonymous visitor hits an uncaught error

- **GIVEN** a visitor who is not signed in
- **WHEN** an uncaught error occurs
- **THEN** the error is logged to the console and no event is reported

### Requirement: Reported stacks resolve to source

The production build SHALL upload its source maps to the analytics destination's error tracking, tagged with the app version, so reported stacks resolve to the original source. Source maps SHALL NOT be deployed: the built files carry no source map reference and the deploy artifact holds no `.map` file. A build without upload credentials skips the upload and still deploys no source maps.

#### Scenario: Production deploy

- **WHEN** the production build runs with upload credentials configured
- **THEN** its source maps are uploaded for that app version and removed from the deploy artifact before it is published

### Requirement: Reporting never degrades the app

A failing, blocked or slow analytics destination SHALL NOT delay, re-throw or loop error reporting. A failure inside the reporting path itself SHALL be dropped silently; the captured error has already been logged.

#### Scenario: Analytics destination blocked during reporting

- **WHEN** an error is captured while the analytics destination is unreachable
- **THEN** the capture completes, the page continues, and no second error is raised by the reporting attempt
