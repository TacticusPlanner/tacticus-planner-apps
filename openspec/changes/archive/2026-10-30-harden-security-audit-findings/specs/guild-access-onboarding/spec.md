## ADDED Requirements

### Requirement: Guild sync honours the per-guild cooldown

Both Sync Guild actions (the guild page summary and the first-synchronization card) SHALL treat a 429 `guildSyncCooldown` or `rateLimited` as a cooldown. The action is disabled and a translated message counts down the seconds from the response's `Retry-After` (60 when absent), once per second. When the count reaches zero the message clears and the action is enabled.

#### Scenario: Syncing within the cooldown

- **WHEN** a Leader presses Sync Guild and the response is 429 `guildSyncCooldown` with `Retry-After: 2`
- **THEN** Sync Guild is disabled and the message says the guild can be synced again in 2 seconds
- **AND** after 2 seconds the message is gone and Sync Guild is enabled

### Requirement: A refused guild sync names the role it needs

A 403 from Sync Guild SHALL read as a translated "only the Leader or Co-Leader can synchronize" message. Members who are not Leader or Co-Leader keep seeing no Sync action.

#### Scenario: A demoted caller syncs

- **WHEN** Sync Guild returns 403 `forbidden`
- **THEN** the translated "only the Leader or Co-Leader" message shows

### Requirement: A refused guild delete explains why and that nothing was deleted

The delete-guild dialog SHALL map each refusal of `DELETE guild` to a translated message that also says nothing was deleted: 403 `forbidden` (no Tacticus user id, or no longer Leader or Co-Leader in Tacticus), 400 `validation` (Tacticus rejected the stored guild token), 503 `upstreamUnavailable`, 409 `concurrency` and 429 `rateLimited`. Any other failure keeps the server's text. The dialog stays open.

#### Scenario: Tacticus is down

- **WHEN** the user confirms the delete and the response is 503 `upstreamUnavailable`
- **THEN** the dialog stays open with the translated "Tacticus is unavailable, nothing was deleted" message
