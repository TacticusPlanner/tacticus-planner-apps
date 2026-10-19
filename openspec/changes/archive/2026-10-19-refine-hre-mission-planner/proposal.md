## Why

Severyn's feedback on the HRE tab after the first release:

- Objectives need a one-click way to mark them done.
- Progress inputs show a leading 0, so typing gives "033".
- Some players skip the 3-energy Indomitus 6 to 14 nodes, which drop nothing and give little gold, so they should sit in their own section.
- The suggestions picked odd nodes. Slicing Claws came from Fall of Cadia Mirror 4 instead of Indomitus Mirror 37, which costs the same and gives more gold. Fall of Cadia Mirror 9 was suggested instead of the cheaper Indomitus 28, because a campaign-type Raids Filter hid the 5-energy Indomitus nodes.
- Common and uncommon drops should come first on 6-energy nodes, since they drop more often.
- Upgrade rows should show owned/target, as on the HSE tab.
- The "about 24 days" estimate ran past the event's end, so it was no use.

## What Changes

- Each objective gets a "Mark done" button that sets its progress to the target.
- A progress input at 0 shows as empty with a "0" placeholder.
- Suggestions list only nodes that drop something. The no-drop nodes (Indomitus 6 to 14) get their own section, offered as an alternative.
- Suggestion order: energy cost first. Within a cost, goal-drop nodes come first, by the drop rate of the goal's resource and then by gold. Other nodes are ordered by gold.
- The campaign-type Raids Filter no longer applies to mission raids. The other Raids Filters still apply.
- Each row with a goal drop shows "owned/target" next to its icon.
- The campaign summary now uses the days the event has left. It shows battles a day and energy a day at the cheapest nodes, or how many battles won't fit before the end.

## Capabilities

### Modified Capabilities

- `hre-campaign-raids`: candidate filtering, ordering, the no-drop alternative and the event-bounded outlook.
- `hre-mission-tracker`: one-click objective completion and empty progress inputs.

## Impact

- `features/daily-raids`: `mission-raids.ts`, `plan-hook-mission-raids.ts`, the new `campaign-outlook.ts`, the HRE raids UI and the shared `resource-stock.tsx`.
- `features/hre-missions`: `current-mission-card.tsx`, `hre-pace.ts` (`hreDaysLeft`) and the locales.
- `pages/dailies`: `hre-page.tsx` passes the days left.
