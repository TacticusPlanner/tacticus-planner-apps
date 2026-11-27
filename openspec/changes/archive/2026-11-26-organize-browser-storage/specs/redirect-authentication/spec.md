## MODIFIED Requirements

### Requirement: Signing out removes the account's local data

Signing out, including the sign-out that follows an account purge, SHALL delete the browser's local copy of the account's data before leaving for the identity provider: the player-data database, the in-memory local-data cache, and every localStorage entry whose key starts with `tp.user.`. Data that belongs to the account, including Dailies progress, the selected project, collapsed Goals sections and Legendary event token reports, SHALL be stored under that prefix; values kept under the earlier `tp.session.` prefix or an older unprefixed key SHALL move under it at startup (see `browser-storage-resilience`). The game-catalog database is public data shared by every visitor and SHALL be kept. Per-device preferences, such as theme and language, SHALL use other keys and are kept.

At startup, once the signed-in account is known and before anything reads the local copy, the client SHALL compare it with the account the local copy was recorded for. If they differ, the local copy SHALL be emptied first, so a session that ended without signing out (for example a cancelled re-authentication that cleared the token cache) never shows its data to the next account. A copy with no recorded account SHALL be kept and recorded for the current one.

#### Scenario: Import leftovers do not reach the next account

- **GIVEN** a V1 import left material steps waiting on the Goals page
- **WHEN** the user signs out and another account signs in on the same browser
- **THEN** the Goals page does not show the previous account's steps

#### Scenario: Other open tabs let go of the account's data

- **GIVEN** the app is open in a second tab, possibly in the middle of a player-data sync
- **WHEN** the user signs out in the first tab
- **THEN** the second tab drops the local reads it holds, and its sync writes nothing into the player-data database

#### Scenario: Another account signs in after a session that never signed out

- **GIVEN** account A's roster and Dailies progress are on the browser and A's session ended without signing out
- **WHEN** account B signs in on that browser
- **THEN** B never sees A's roster or Dailies progress

#### Scenario: Preferences survive sign-out

- **WHEN** the user signs out
- **THEN** the chosen theme and language are still applied on the signed-out pages

#### Scenario: Data under the earlier prefix moves at startup

- **GIVEN** a browser that holds Dailies quest progress under `tp.session.dailies.quest.progress.v1`
- **WHEN** the app starts
- **THEN** the progress is under `tp.user.dailies.quest.progress`, the old key is gone, and signing out removes it
