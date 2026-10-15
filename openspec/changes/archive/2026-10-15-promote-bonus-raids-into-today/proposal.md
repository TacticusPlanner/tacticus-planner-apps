## Why

UserJot feedback "Bonus raids should replace today's plan":

> On Dailies > Raids, 'Today's plan' will just keep going even if you've spent the energy limit you've set. I would expect the 'Bonus raids' list to take over (be the only list of raids) at that point.

Today is planned on the full daily energy limit. A node drops out of the plan only once its attempts are used up, so after the player has spent their whole limit the plan still lists raids they did not budget for. The Home raids widget does the same.

## What Changes

- Once the real energy spent today (from synced attempts, the figure the energy-usage bar shows) reaches or exceeds the Planning Settings daily energy limit, Today hides the Today's-plan lane. Bonus Raids becomes the only raids list, with a caption saying the daily energy limit is reached. Its top-3 truncation and "Show more" stay. If no bonus raid is left, the Bonus Raids section still shows, saying the limit is reached and no bonus raids are left.
- The Home raids widget does the same: past the limit it shows the Bonus Raids locations with a limit-reached caption, or the caption and its empty message.
- Below the limit, and when no synced attempts exist (energy spent is 0), both surfaces are unchanged. A limit of 0 or less is treated as no limit. The Raids Plan tab is unchanged.
- The decision lives in one model function, `selectTodayRaids`, exported from `features/daily-raids` and used by both surfaces.

Not chosen: always merging Bonus Raids into one list with the plan. The post asks for Bonus Raids to take over once the energy limit is spent, not before. Merging them earlier would also hide the difference between what the energy limit affords and what it does not.

Also not chosen: an earlier draft of this change promoted Bonus Raids once every planned node was exhausted. The post makes the trigger the energy limit, so that version was dropped.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `daily-raids-today`: Bonus Raids become the only raids list once today's real energy spend reaches the daily limit.
- `home-raids-widget`: the widget mirrors Today and shows Bonus Raids once the daily energy limit is spent.

## Impact

`features/daily-raids/model/select-today-raids.ts` (new, exported from the slice's public API), `pages/dailies/ui/today-page.tsx`, `pages/home/ui/raids/raids-widget.tsx`, their tests, and the `dailies` (`bonus.limitReached`, `bonus.limitReachedEmpty`) and `common` (`home.raids.limitReached`) locale files in en/de/es/fr. No API, data, or calculation change. No companion `tacticus-planner-api` change.
