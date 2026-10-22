# Spec Delta

## ADDED Requirements

### Requirement: Each environment reports to its own analytics project

The staging deployment SHALL report to an analytics project distinct from production's, so staging page views, declared events and client errors never mix into production measurements.

#### Scenario: Page view on staging

- **WHEN** an identified user navigates on the staging deployment
- **THEN** the `page_view` event is recorded in the staging analytics project and not in production's

#### Scenario: Staging without its own configuration

- **WHEN** the staging build is produced without a staging-specific analytics token
- **THEN** analytics is inert on staging (no outbound request), rather than falling back to the production token

### Requirement: Client errors are a declared event

`client_error` (see `client-error-reporting`) SHALL be the only error-derived event the client reports, and it SHALL follow every privacy rule of this capability: identified users only, pseudonymous identity, no input values, no route parameters or query strings.

#### Scenario: Error while editing a goal

- **WHEN** an identified user has typed into a goal form and an uncaught error occurs
- **THEN** the reported `client_error` carries the message, stack, route group and app version, and none of the typed values
