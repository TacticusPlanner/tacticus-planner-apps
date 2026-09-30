## Why

On `/progress/onslaught`, changing an alliance's Sector keeps the previously selected Tier, so Gold 4 (sector complete) becomes Diamond 4 and Diamond 1 becomes Gold 1. Both are wrong positions that feed shard estimates through `progressForAlliance`. Reported on UserJot ("Clarify Onslaught Tier and Sector Progression", Planned) and tracked as GitHub issue #159 (point 1).

## What Changes

- When the Sector moves **up**, the Tier resets to 1. When the Sector moves **down**, the Tier becomes 4 (sector complete). Re-selecting the same Sector leaves the Tier unchanged. The user can still change the Tier afterwards.
- The Tier control, its "sector complete" option, and the Save button behaviour stay as they are. Issue #159 points 2 (Tier 4 presentation) and 3 (Save enabled without changes) are deliberately out of scope; they remain open on the issue.

## Capabilities

### New Capabilities

- `onslaught-progress-entry`: manual entry of Onslaught sector/tier position per alliance, including the sector-change tier rule.

### Modified Capabilities

None.

## Impact

`pages/onslaught/ui/onslaught-page.tsx` and its test. Stored value stays `tier: 1..4`; no API or storage change.
