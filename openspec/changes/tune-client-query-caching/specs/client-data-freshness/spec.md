# Spec Delta

## Purpose

Defines how long server-owned per-user data stays fresh in the client cache, when the client refetches it, how a mutation's response reaches the cache without a wholesale refetch, and how the first-visit catalog and player-data downloads are paced.

## ADDED Requirements

### Requirement: Server-owned per-user data is served from the cache within a freshness window

Server-owned per-user data (goals, projects, planning settings, player-data overrides, Legendary Event plans and run records, guild state, the current user) SHALL be treated as fresh for 5 minutes after it was last fetched or written by a mutation response. Within that window, mounting a page that reads such data SHALL NOT issue a request for it; outside it, the next mount SHALL refetch it. Regaining focus or network SHALL NOT refetch on their own.

#### Scenario: Warm re-navigation issues no request

- **GIVEN** the user opened `/plan/goals` two minutes ago and its goals, projects, settings and override reads succeeded
- **WHEN** the user navigates to `/plan/schedule` and back to `/plan/goals`
- **THEN** the page renders from the cached data and no request is issued for goals, projects, settings or overrides

#### Scenario: Data past the window refetches on the next mount

- **GIVEN** the goals list was fetched six minutes ago and nothing has written it since
- **WHEN** a page that reads the goals list mounts
- **THEN** the cached list renders at once and one request refetches it in the background

#### Scenario: Focus and reconnect do not refetch

- **GIVEN** a page with cached server data is open
- **WHEN** the tab regains focus or the browser reconnects
- **THEN** no request is issued for that data

### Requirement: The current user is read fresh while account setup is unresolved

While the current user's account setup is not complete (no configured Tacticus API key or no chosen display name), every read of the current user SHALL go to the server. Once setup is complete, the current user follows the standard freshness window. The feedback-widget token SHALL never be served from the cache.

#### Scenario: Setup completion is seen by the gate

- **GIVEN** a signed-in user without a configured API key is on account setup
- **WHEN** they submit an accepted API key and the setup screen refreshes the account state
- **THEN** the refreshed read goes to the server and the gate shows the requested protected route

#### Scenario: A configured user remounts within the window

- **GIVEN** a user with completed setup whose current user was read one minute ago
- **WHEN** a protected route remounts the gate
- **THEN** no current-user request is issued

#### Scenario: Feedback-widget token is never cached

- **WHEN** the feedback widget opens a second time within the window
- **THEN** a new token request is issued

### Requirement: A mutation's response is written to the cache and only logically dependent reads are refetched

Every mutation whose response carries the updated resource SHALL write that response into the cached detail and into every cached list containing the resource, before any refetch. It SHALL then refetch only the reads whose content the mutation can have changed and that the response does not carry (the goal lists and the affected projects' member lists when the account-wide order or a membership changed). It SHALL NOT refetch every goal or every project read.

#### Scenario: Pausing a goal is one request

- **GIVEN** the Goals page with cached goals and projects
- **WHEN** the user pauses one goal from its row menu (no prerequisite cascade)
- **THEN** exactly one request is issued, the row shows Paused from the response, and neither the goals list nor the projects list is refetched

#### Scenario: Editing a goal's notes applies the response

- **WHEN** the user saves the Edit goal dialog with only the notes changed
- **THEN** one edit request is issued, the row shows the new notes from the response, and no goal or project list is refetched

#### Scenario: Completing or deleting a goal refetches only the lists its position affects

- **WHEN** the user completes, archives or deletes an in-flight goal
- **THEN** the goal's rows leave the in-flight lists at once, the goal lists and the member lists of that goal's projects are refetched once, and no other goal's detail is refetched

#### Scenario: Saving a project updates the project list from the response

- **WHEN** the user renames a project on the Projects page
- **THEN** one request is issued, the row shows the new name from the response, and the goals reads are not refetched

#### Scenario: Reordering goals refetches the order reads only

- **WHEN** the user drags a goal to a new position
- **THEN** after the reorder request succeeds, only the goal lists and the cached project member lists are refetched; the project list and goal details are not

### Requirement: Mutation responses that carry the resource replace refetches of it

Guild registration and synchronization SHALL update the shared current-guild state from their responses without refetching it. A Tacticus integration update SHALL update the cached current user's configured-key and user-id state from its response. The V1 profile import SHALL issue at most one current-user read after it completes.

#### Scenario: Registering a guild

- **GIVEN** the Guild page shows the registration form
- **WHEN** the user submits an accepted guild API token
- **THEN** the page shows the registered guild from the registration response and no current-guild request is issued

#### Scenario: Synchronizing a guild

- **WHEN** a Leader synchronizes the guild from the Guild page or the never-synchronized card
- **THEN** the page shows the synchronized guild (including its last-synced time) from the synchronization response and no current-guild request is issued

#### Scenario: Saving a Tacticus user id from the guild flow

- **GIVEN** the guild flow shows the Tacticus user id card
- **WHEN** the user saves an accepted user id
- **THEN** the flow advances using the update response and no current-user request is issued

#### Scenario: V1 import refreshes the current user once

- **WHEN** a V1 import that may change the account completes from account setup
- **THEN** exactly one current-user request follows it

### Requirement: Invalidating one player-data override does not refetch another

Refreshing the Onslaught progress override SHALL NOT cause the campaign-events override to be refetched, and vice versa.

#### Scenario: Importing Onslaught progress only

- **GIVEN** cached Onslaught and campaign-events overrides
- **WHEN** a V1 import with only the Onslaught progress part selected completes
- **THEN** the Onslaught override is refetched and the campaign-events override is not
