# api-contract-sync Specification

## Purpose

Keeps the web app's API request and response types bound to one identified version of the API's published contract. Contract drift then shows up at build time instead of at runtime.

## Requirements

### Requirement: Spec copy is pinned to an API commit

The web app SHALL commit a copy of the API's OpenAPI document together with the identifier of the API commit it was taken from. On the default branch, that identifier SHALL be a full commit SHA of `tacticus-planner-api`, never a branch name or a local marker.

#### Scenario: Pulling a branch records its commit

- **WHEN** a developer pulls the spec for API branch `main`
- **THEN** the copy is the document committed at `main`'s current head
- **AND** the recorded pin is that head's full SHA

#### Scenario: Local copy is marked unpinned

- **WHEN** a developer copies the spec from a local API checkout
- **THEN** the recorded pin is `local`

#### Scenario: Unpinned copy cannot pass CI

- **WHEN** CI runs on a change whose recorded pin is `local`
- **THEN** the build fails and says the spec must be pulled from an API commit

### Requirement: Client types are generated from the pinned copy

The types describing API paths, parameters, request bodies and responses SHALL be generated from the committed spec copy, and the generated file SHALL be committed. API wire shapes SHALL NOT be hand-written. Client code MAY give a generated schema a local alias name.

#### Scenario: Generation is reproducible offline

- **WHEN** types are regenerated from the committed copy without network access
- **THEN** the output is identical to the committed generated file

#### Scenario: Stale generated types fail CI

- **WHEN** the spec copy changes but the generated file is not regenerated
- **THEN** CI fails and shows the difference

#### Scenario: Contract drift fails type checking

- **WHEN** the pinned spec removes or renames a field or route the client uses
- **THEN** type checking fails at each place that uses it

### Requirement: API calls are checked against the contract

Every web app call to a `/api/v1` route SHALL name the route as declared in the spec and pass path parameters, query parameters and bodies whose types come from the spec. The response type SHALL come from the spec's success response for that route.

#### Scenario: Unknown route is a type error

- **WHEN** code calls a route the pinned spec does not declare
- **THEN** type checking fails

#### Scenario: Wrong body shape is a type error

- **WHEN** code sends a body missing a property the spec marks required
- **THEN** type checking fails

### Requirement: Failed responses surface as typed API errors

A failed API response SHALL still surface as the same typed API error, with status and issue code, plus `current`, field `errors` and extensions when the problem body carries them. Transient-failure classification SHALL be unchanged.

#### Scenario: Conflict still adopts current state

- **WHEN** an edit is rejected with a 409 problem carrying `issueCode` and `current`
- **THEN** the caller receives an API error with that issue code and `current`
