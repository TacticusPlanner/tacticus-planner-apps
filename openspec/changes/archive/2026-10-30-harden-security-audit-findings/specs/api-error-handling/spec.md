## ADDED Requirements

### Requirement: A failed response's Retry-After is kept on the error

When a failed response carries a numeric `Retry-After` header, the `ApiError` SHALL expose it in whole seconds, so a feature can tell the user how long to wait. Without the header the value SHALL be absent.

#### Scenario: A cooldown carries its wait

- **WHEN** a request fails with 429, `issueCode` `guildSyncCooldown` and `Retry-After: 42`
- **THEN** the error's issue code is `guildSyncCooldown` and its retry-after is 42 seconds
