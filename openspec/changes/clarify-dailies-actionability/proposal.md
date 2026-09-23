## Why

Several reports say users scroll past secondary, exhausted, or already-satisfied information before finding what to farm now (`DAILY-01`–`DAILY-04`, `DAILY-07`). A code read shows Today's schedule already precedes Today's Attempts and filters real exhausted nodes, so the current live behavior must be observed before changing information architecture.

## What Changes

- Walk Today and Raids Plan on mobile/desktop with actionable, exhausted, locked, and already-satisfied prerequisites; record where the first useful action appears and what “Max raids” means.
- Demote or group genuinely non-actionable information where the problem reproduces, while retaining explanations and preserving scheduling/priority semantics.

## Capabilities

### New Capabilities

- `dailies-action-hierarchy`: Visual hierarchy that makes current farming actions discoverable without losing explanatory context.

### Modified Capabilities

None; existing daily-raid schedule and ordering contracts remain intact.

## Impact

Apps Today/Raids Plan presentation and tests; no API or scheduling-engine change intended. Coordinate Day-1 presentation with `add-daily-raids-availability-filter`.
