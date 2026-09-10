## ADDED Requirements

### Requirement: Every Dailies primary tab opens its implemented page

Every Dailies primary tab SHALL render its implemented page. Guild Raids SHALL render its access-aware page shell, which may show shared guild onboarding until access is ready, rather than the shared Under Construction placeholder.

#### Scenario: Opening Guild Raids before guild access is ready

- **WHEN** the user opens `/dailies/guild-raids` while a guild prerequisite is missing
- **THEN** the Guild Raids page shows the shared guild onboarding state and the Guild Raids primary tab remains active

#### Scenario: Opening Guild Raids with ready access

- **WHEN** the user opens `/dailies/guild-raids` with ready guild access
- **THEN** the Guild Raids page shell renders its ready content slot rather than Under Construction

#### Scenario: Opening another implemented primary tab

- **WHEN** the user opens Raids, Shops, Arena, Salvage Run, or Onslaught
- **THEN** that tab's existing implemented page is shown

## REMOVED Requirements

### Requirement: Placeholder tabs show Under Construction

**Reason**: Guild Raids is the final primary Dailies placeholder and now has an access-aware page shell.

**Migration**: Direct links and navigation continue to use `/dailies/guild-raids`; the route now renders guild onboarding or its ready slot.
