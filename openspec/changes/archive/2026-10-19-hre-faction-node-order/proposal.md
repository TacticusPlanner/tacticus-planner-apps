## Why

Severyn asked that the Necron node list for mission 11 put the nodes with the most enemies first, so the kills finish as soon as possible. He also pointed out that Indomitus nodes below 19 have no lightning-victory condition. The mission expects each raid to serve both objectives, so those nodes must not be suggested.

## What Changes

- The faction-kill node list orders nodes by enemy count, most first, then as raids are.
- While lightning victories are open, the list keeps only nodes with a lightning-victory condition (not Indomitus below node 19) and says so.

## Impact

- `features/daily-raids` (`mission-raids.ts`, `plan-hook-mission-raids.ts`, `hre-raids-extras.tsx`, `hre-raids-section.tsx`), `hre.json` locales and tests.
