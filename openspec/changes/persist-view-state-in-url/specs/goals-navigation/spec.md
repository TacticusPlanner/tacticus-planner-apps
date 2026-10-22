# Spec Delta

## ADDED Requirements

### Requirement: Goals list controls are URL state

The Goals status filter and Type filter SHALL be the `status` and `type` query parameters of `/plan/goals`, written by replacing the current history entry. A missing parameter means the control's default (status Unfulfilled, all types); an unrecognized value is treated as the default and dropped from the URL. The Group selection stays persisted per browser, not in the URL.

#### Scenario: Reload keeps the filters

- **GIVEN** the user set the status filter to Reached and the Type filter to Rank on `/plan/goals`
- **WHEN** they reload the page
- **THEN** the URL still carries `status` and `type`, the status filter reads Reached, the Type filter reads Rank, and the list is filtered accordingly

#### Scenario: Filter links are shareable

- **WHEN** the user opens `/plan/goals?project={id}&status=paused`
- **THEN** the list shows that project's Paused goals with the status filter reading Paused and that project's chip selected

#### Scenario: Changing a filter adds no history entry

- **GIVEN** the user is on `/plan/goals` having arrived from `/home`
- **WHEN** they change the status filter twice and then press Back
- **THEN** Back returns to `/home`

#### Scenario: Unknown filter value falls back to the default

- **WHEN** the user opens `/plan/goals?status=nope`
- **THEN** the status filter reads Unfulfilled, the list shows Unfulfilled goals, and the URL is replaced without the `status` parameter

#### Scenario: Fresh load without parameters uses the defaults

- **WHEN** the user opens `/plan/goals` with no `status` or `type` parameter
- **THEN** the status filter reads Unfulfilled and the Type filter all types, exactly as before this change
