## Why

Players plan HSE and HRE raids for one project at a time, and want to narrow them with the Raids Filters without going back to Today. The HRE tab also only showed the running (or next) event, while the HSE tab can browse past and upcoming events.

## What Changes

- HSE tab: the Dailies project selector and the Raids Filters action sit above the raid lists. The farm list follows the selected project (it used to ignore it); the top-10 lists stay goal-independent.
- HRE tab: the same two controls sit in the raids section. The suggestions serve the selected project's goals first.
- The project selection stays the one Dailies-wide, session-only selection shared with Today.
- HRE tab: an event switcher (Running / Upcoming / Past, Previous / Next, `?event=` URL state) like the HSE tab's. A past event shows its header and missions only.
- The switcher becomes a shared `EventInstanceSwitcher` (`shared/ui`) used by both tabs.

## Impact

- Specs: `daily-raids-home-screen-event`, `hre-campaign-raids`, `daily-raids-filters`, `hre-mission-tracker`.
- Code: `pages/dailies/ui/{hse-page,hre-page,raids-section-controls}.tsx`, `features/hre-missions` (instance list and selection, header, switcher), `features/daily-raids` (HRE raids section props, HSE switcher wrapper), `shared/ui/event-instance-switcher*`.
- Strings: `hre.json` (`status.past`, `status.pastNote`, `switcher.*`) and `dailies.json` (`tour.hre.steps.switcher`) in en, de, es, fr.
