## Why

Phase 2 of the app style guide rollout (`ui-style-guide` rules 1 to 4). The Plan pages other than Goals still laid out their controls their own way: Insights and Schedule put a right-aligned, icon-only (on mobile) project selector in a row of its own, Schedule had its own Planning settings button beside it, Projects created projects from a floating button, and Event shop put its search in the tab bar on desktop and behind an icon on phone, with full-width tabs on phone.

## What Changes

- Insights and Schedule: the project selector is the page toolbar's Find slot, labelled at every width.
- Schedule: Planning settings becomes the page header's Settings button (as on Goals and Dailies > Raids).
- Projects: "New project" is the filled page action in the toolbar's Actions slot instead of a floating button.
- Event shop: the event picker and "Search the shop" are the toolbar's Find slot on every form (the phone search dialog and its icon button are gone); the status, dates, reset, sync and income line sits under the toolbar; Shop / Milestones / Missions (phone: Shop / Plan / Rewards) are the standard left-aligned underline tabs.

## Capabilities

### Modified Capabilities

- `goals-navigation`: a project selector without a tab row sits in the toolbar's Find slot.
- `planning-settings-access`: Schedule's Planning settings is the header's Settings button.
- `event-shop-planner`: picker and search in the toolbar; search field on phone too.

## Impact

- `apps/web`: Insights, Schedule, Projects and Event shop pages; `NewProjectFab` becomes `NewProjectButton`; `PlanningSettingsTrigger` is removed (no callers left); the unused `goals.planningSettings.button` and `eventShops:header.search` strings are removed.
- No API or storage changes.
