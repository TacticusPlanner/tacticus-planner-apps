## Purpose

Provides one reusable guild-access journey so guild-dependent pages consistently guide players from missing integration or registration to synchronized guild readiness.

## ADDED Requirements

### Requirement: Guild access exposes explicit prerequisite states

The system SHALL expose a shared guild-access surface with these mutually exclusive states: loading; load failure; Tacticus user id required; guild unregistered; registered but never successfully synchronized; and ready. The surface SHALL derive those states from the existing current-guild query and SHALL NOT maintain a separate guild-registration truth for each page.

#### Scenario: Guild state is loading

- **WHEN** current guild access has not resolved
- **THEN** the consuming page shows a loading state without briefly rendering registration or ready content

#### Scenario: Guild state fails to load

- **WHEN** the current-guild request fails
- **THEN** the consuming page shows the shared error and retry action while withholding guild-dependent content

#### Scenario: Guild is ready

- **WHEN** the caller is linked to a registered guild whose `lastSyncSucceededAt` is present
- **THEN** the shared surface renders its ready content

### Requirement: Missing prerequisites reuse the existing onboarding actions

The shared surface SHALL reuse the existing Tacticus user-id setup and guild registration behavior. A successful setup, registration, or synchronization SHALL refresh the shared current-guild query and advance all consumers to the resulting state without a full-page reload.

Only a current Leader or Co-Leader may register or synchronize a guild, as enforced by the existing API. Because the `unregistered` current-guild response contains no caller role or synchronization permission, the shared surface SHALL show the credential form with Leader/Co-Leader eligibility guidance and SHALL NOT claim that the caller is authorized. If registration is rejected for role or credential authorization, the surface SHALL remain gated, show the server error with Leader/Co-Leader handoff guidance, and provide Guild Raids consumers a link to Guild management.

#### Scenario: Tacticus user id is required

- **WHEN** the current-guild state is `tacticusUserIdRequired`
- **THEN** the shared flow presents the existing integration action and refreshes guild state after it succeeds

#### Scenario: Unregistered caller is offered server-authorized registration

- **WHEN** current-guild returns `unregistered` without caller-role information
- **THEN** the shared flow shows the credential form with eligibility guidance and relies on the server to authorize submission

#### Scenario: Registration authorization is rejected

- **WHEN** an unregistered caller submits a token and the server rejects role or credential authorization
- **THEN** the flow remains gated, shows the rejection and Leader/Co-Leader handoff, and does not expose Guild Raid content

#### Scenario: Authorized user registers a guild

- **WHEN** an eligible Leader or Co-Leader completes the existing guild registration flow
- **THEN** both Guild and Guild Raids consumers observe the refreshed registered state

### Requirement: Unsynchronized guilds remain gated

A registered guild with no successful synchronization timestamp SHALL NOT be treated as ready for Guild Raid status or recommendations. The surface SHALL provide the existing synchronization action to callers who can synchronize and guidance to contact a Leader or Co-Leader to other members.

#### Scenario: Manager synchronizes for the first time

- **WHEN** a registered guild has never synchronized and the caller can synchronize
- **THEN** the shared flow offers synchronization and unlocks ready content after success

#### Scenario: Member waits for guild synchronization

- **WHEN** a registered guild has never synchronized and the caller cannot synchronize
- **THEN** the shared flow explains that a Leader or Co-Leader must complete synchronization and withholds ready content

### Requirement: Consumers retain their page-specific ready content

The Guild page SHALL continue to render guild summary, member management, synchronization, and deletion inside the ready slot. The Guild Raids page SHALL render its own raid content inside the ready slot and SHALL NOT import the Guild page or its route component.

#### Scenario: Guild management remains available

- **WHEN** a ready user opens `/guild`
- **THEN** the existing guild management experience is shown through the shared access boundary

#### Scenario: Guild Raids becomes eligible

- **WHEN** a ready user opens `/dailies/guild-raids`
- **THEN** the Guild Raids ready slot is shown without guild member-management controls
