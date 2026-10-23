# api-error-handling Specification

## Purpose

Defines how the client reads the API's single RFC 7807 problem-details error shape, how it identifies a failure by its `issueCode`, and how a conflict's `current` state is used to recover without losing the user's draft.

## Requirements

### Requirement: Every API failure is read as a problem-details error

A non-2xx API response SHALL be read as one error carrying the HTTP status, the `issueCode` extension (or none), the human-readable `detail` (falling back to `title`, then to a generic "API request failed with status N" text), and, when present, the `current` resource state and the `errors` field map. A failure whose body is not `application/problem+json` (a proxy error page, an empty body) SHALL still produce an error with the status and the generic text, never an unhandled parse failure.

#### Scenario: Problem body with an issue code

- **WHEN** a request is answered with 409 `application/problem+json` carrying `issueCode: "goalRevisionStale"`, a `detail` and a `current` goal
- **THEN** the error exposes status 409, that issue code, that detail text and that current goal

#### Scenario: Non-problem body

- **WHEN** a request is answered with 502 and an HTML body
- **THEN** the error exposes status 502, no issue code and the generic "API request failed with status 502" text, and the caller's generic error path runs

#### Scenario: Validation failure names its fields

- **WHEN** a request is answered with 400 and an `errors` map keyed by field path
- **THEN** the error exposes that map so the caller can mark the offending sections, and the first field message is the error's text

### Requirement: Failure handling keys on the issue code, not on the body shape

A feature that reacts to a specific failure (a stale revision, a stale order, an occupied slot, a stale membership, a stale plan, a last-membership removal) SHALL decide by the error's `issueCode` alone. The same issue code SHALL be handled the same way whichever route produced it. An unknown issue code SHALL fall back to showing the error's text with the feature's generic failure handling. The one exception is the campaign-events overrides page, whose route answers only with a `concurrency` 409: it treats every 409 as a stale revision, adopts the state it carries (or re-reads it when absent) and drops its draft.

#### Scenario: Same code from two routes

- **WHEN** a goal edit and a status change both fail with `slotOccupied`
- **THEN** both surfaces show the occupied-slot message naming the goal carried under `current`

#### Scenario: Unknown issue code

- **WHEN** a save fails with a 409 whose issue code the client does not know
- **THEN** the surface shows the error's detail text as an ordinary failure and keeps the user's draft

### Requirement: A conflict's current state is adopted without discarding the draft

When a 409 carries `current`, the cached resource SHALL be replaced by it at once. A surface without a draft (the campaign-events overrides page, the Legendary Event plan) SHALL then save against that revision. A surface holding an unsaved draft (the Edit goal dialog) SHALL keep the draft and its own base until the user chooses to refresh; refreshing rebases the draft on the cached current state, so the next save carries its revision and never an unspecified one.

#### Scenario: Stale goal revision in the Edit goal dialog

- **WHEN** Save fails with `goalRevisionStale` and a `current` goal
- **THEN** the dialog keeps the draft, shows that the goal changed elsewhere, and after the user chooses to refresh the next Save carries the current goal's revision without a separate read

#### Scenario: Stale plan revision in a Legendary Event plan write

- **WHEN** a plan write fails with `planRevisionStale` and a `current` plan
- **THEN** the current plan replaces the cached one, one "reloaded" notice is shown, and queued writes are discarded as before

#### Scenario: Slot conflict names the goal

- **WHEN** a goal create, edit or status change fails with `slotOccupied`
- **THEN** the message names the conflicting existing goal (its unit and kind, and for Rank its target) and no project list is shown
