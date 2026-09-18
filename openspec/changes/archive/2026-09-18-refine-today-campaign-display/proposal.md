## Why

Today's raid location cards put the whole campaign/tier name on their first line ("Fall of Cadia Elite") and a generic "Battle 40" on the second, so the line that carries the node number says nothing about which tier that node belongs to, and the four tiers of one storyline read as four unrelated campaign names. Moving the tier word down to the number ("Fall of Cadia" / "Elite 40") makes the first line a real grouping key and the second line self-describing, and gives the card somewhere to show the challenge-node "B" suffix it currently drops.

Separately, Today silently depends on the active campaign event: event-campaign nodes are only farmable while `live-progress.activeCampaignEventId` names their campaign group, and event nodes appear in and vanish from the schedule with no on-screen explanation. Today should state which campaign event it detected and when it ends.

## What Changes

- **BREAKING (internal):** `DailyRaidLocationViewModel.fullName` (whole campaign/tier name) and `nodeNumber` are replaced by `campaignName` (bare campaign name) and `nodeLabel` (tier words + node number + challenge "B"). No consumer outside this repo reads these.
- Raid location cards render `campaignName` on the first line and `nodeLabel` on the second, in all three places that share this presentation: Today's/Bonus Raids' resource cards, Today's Attempts, and the Home page's Daily Raids widget. Raids Plan's compact chips are unchanged.
- Challenge nodes show their "B" suffix on the node line ("Extremis 12B"), matching the suffix the Raids Plan chips and the Create Goal shard-locations field already show. The card form currently drops it.
- `useCampaignDisplay` gains `tierLabel(descriptor)` returning just the tier words ("Standard", "Elite", "Mirror", "Mirror Elite", "Extremis"). `fullLabel` is re-expressed as `name + tierLabel`, which produces identical output for every descriptor; the tier-word branching moves into `tierLabel` so those words are composed in one place instead of two. `fullLabel`'s four existing consumers are unaffected.
- The `dailies:schedule.battle` key ("Battle {{number}}") becomes unused and is removed from every locale.
- Today gains a campaign-event status line stating the auto-detected active campaign event and how long until it ends, or "Campaign event is not active" when none is detected. On mobile it sits above the energy-usage row; on desktop it shares that row.
- Today's Joyride tour gains a step for the new status line.

## Capabilities

### New Capabilities

None — both halves change behavior already owned by existing capabilities.

### Modified Capabilities

- `daily-raids-today`: "Campaign locations use the Character Lookup presentation" changes from a one-line full campaign/tier name plus a bare battle number to the campaign-name/tier-and-node split, adds the challenge "B" suffix, and widens its scope sentence to name Today's Attempts (which already renders this same block but is not currently covered). A new requirement covers the campaign-event status line, its two layouts, and its inactive state.
- `home-raids-widget`: "The widget shows the real (energy-budget) schedule only, one row per location" adopts the same two-line location presentation. Its current "compact chip location" wording also no longer describes the shipped widget, which has rendered the two-line form since the Character Lookup presentation landed.

## Impact

- `apps/web/src/fsd/shared/lib/use-campaign-display.ts`: add `tierLabel`; re-express `fullLabel` over it.
- `apps/web/src/fsd/features/daily-raids/model/daily-raids.domain.ts`: `DailyRaidLocationViewModel` swaps `fullName`/`nodeNumber` for `campaignName`/`nodeLabel`.
- `apps/web/src/fsd/features/daily-raids/model/use-daily-raids.ts`: build the two new fields from `name`/`tierLabel` instead of `fullLabel`.
- `apps/web/src/fsd/pages/dailies/ui/resource-card.tsx`, `apps/web/src/fsd/pages/dailies/ui/today-page.tsx` (Today's Attempts), `apps/web/src/fsd/features/daily-raids/ui/location-row.tsx`: render the two new fields.
- `apps/web/src/fsd/pages/dailies/ui/today-page.tsx` plus a new page-local hook and component under `apps/web/src/fsd/pages/dailies/ui/`: the campaign-event status line, reading `getLiveProgress()` and `getEventsActiveAt()` (`@workspace/game-catalog/queries`) and formatting via the existing `formatRelativeTime` (`@/shared/lib`).
- `apps/web/src/fsd/pages/dailies/ui/today.tutorial.tsx`: a tour step targeting the new status line.
- `apps/web/public/locales/{en,de,es,fr}/dailies.json`: remove `schedule.battle`; add the campaign-event status copy and its tour step keys.
- No `tacticus-planner-api` companion change. `live-progress.activeCampaignEventId` and the events calendar are already synced to the client; nothing new is needed from the API.
