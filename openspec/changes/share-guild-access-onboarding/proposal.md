## Why

`/dailies/guild-raids` must use the same guild eligibility and registration journey as `/guild`, but that flow currently lives inside the Guild page. Sharing it first prevents the Guild Raids feature from duplicating access logic or drifting into a second onboarding experience.

## What Changes

- Extract a reusable guild-access state surface for loading, load failure, missing Tacticus user id, unregistered guild, registered-but-never-synchronized guild, and ready guild states.
- Reuse the existing registration/integration actions and refresh the shared guild query after successful setup.
- Replace the Guild Raids Under Construction placeholder with a page shell that shows shared onboarding until guild access is ready and a neutral ready-state slot afterward.
- Preserve the full `/guild` management experience, including members, synchronization, and deletion, while both consumers share entity-owned access behavior.
- Add localized copy, automated coverage, and a Guild Raids page tutorial for the access flow on desktop and mobile.

## Capabilities

### New Capabilities

- `guild-access-onboarding`: Defines the reusable guild eligibility, registration, synchronization-readiness, retry, and handoff behavior shared by Guild and Dailies.

### Modified Capabilities

- `dailies-navigation`: Replaces the Guild Raids placeholder with its access-aware page shell.

## Impact

- Affects the guild entity/page boundary, the Dailies Guild Raids route, TanStack Query state, localized resources, Joyride steps, and page/component tests.
- Uses existing guild endpoints and player integration flows; no API companion change is required.
- Establishes the prerequisite shell consumed by subsequent Guild Raid status and recommendation changes.
