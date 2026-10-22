# client-error-reporting Specification

## Purpose

Defines what happens to an error that no component, request handler or background loop caught: it is logged for diagnosis, reported to the analytics destination when the user is identified, and never breaks the page or exposes user input.

## Requirements

### Requirement: Uncaught errors and rejections are captured once

The app SHALL capture every uncaught exception and unhandled promise rejection raised in the page, including failures of the background game-catalog and player-data sync loops, through a single capture path. Each error SHALL be written to the browser console exactly once with its message and stack.

#### Scenario: Background sync loop fails

- **WHEN** a scheduled player-data sync rejects with a network error outside any request handler
- **THEN** the error is logged once to the console, the page keeps rendering, and the next scheduled sync still runs

#### Scenario: Promise rejected outside React

- **WHEN** a promise created by a provider effect rejects and nothing awaits it
- **THEN** the rejection is logged once and no fallback error page is shown

### Requirement: Captured errors are reported only for identified users

When analytics is configured and the current user is identified (see `product-analytics`), a captured error SHALL be reported as a declared `client_error` event carrying the error message, stack, current route group and app version. It SHALL NOT carry form values, query strings, route parameters or request bodies. When the user is not identified or analytics is not configured, nothing SHALL be sent.

#### Scenario: Identified user hits an uncaught error

- **GIVEN** a signed-in user whose analytics id is available
- **WHEN** an uncaught error occurs on `/plan/goals?goal=123`
- **THEN** one `client_error` event is reported with the message, stack, route group `plan` and app version, and without the `goal` query value

#### Scenario: Anonymous visitor hits an uncaught error

- **GIVEN** a visitor who is not signed in
- **WHEN** an uncaught error occurs
- **THEN** the error is logged to the console and no event is reported

### Requirement: Reporting never degrades the app

A failing, blocked or slow analytics destination SHALL NOT delay, re-throw or loop error reporting. A failure inside the reporting path itself SHALL be logged and dropped.

#### Scenario: Analytics destination blocked during reporting

- **WHEN** an error is captured while the analytics destination is unreachable
- **THEN** the capture completes, the page continues, and no second error is raised by the reporting attempt
