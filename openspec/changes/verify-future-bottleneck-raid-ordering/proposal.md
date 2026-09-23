## Why

`RAID-002` is explicitly an observation, not a verified V1/V2 difference. Current Today presentation already orders resources by estimated days then energy, while scheduling also depends on goal priority and farming strategy. A rarity-first rule would be speculative.

## What Changes

- Document the current scheduling, stage, and display-order rules and reproduce an immediate-common versus future-rare bottleneck under each relevant strategy.
- Compare the intended plan horizon to the observed output, using V1 only as reference. If a defect is confirmed, revise this proposal with the required delta spec and deterministic algorithm tests before code work.

## Capabilities

### New Capabilities

None. This change is investigation-only until an actual behavior delta is established (`skip_specs: true`).

### Modified Capabilities

None yet. `daily-raids-today` and/or `daily-raids-plan` must be revised if the investigation confirms a changed scheduling contract.

## Impact

Read-only analysis of apps planning engine and Dailies presentation initially. No code or API change is authorized by this investigation artifact itself.
