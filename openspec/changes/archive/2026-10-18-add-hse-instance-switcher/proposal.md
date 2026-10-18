# Proposal

## Why

Dailies > HSE always shows one event: the running Home Screen Event, else the next one. There is no way to look at the event after next (to plan energy or roster for it) or to look back at one that just ended (to check its rules or milestones). When two HSEs overlap (2026-10-26: Operation Imperator and Faction Focus), one of them can never be shown at all. Severyn asked for a switcher: open on the current event (or the next when none runs) by default, and let the player move to any other upcoming or past instance.

## What Changes

- **Event switcher** in the HSE tab header: a select listing every Home Screen Event instance in the catalog calendar, grouped Running, Upcoming, Past, each named by its localized event name and date range, plus Previous / Next buttons that step through instances by start time.
- **Default selection unchanged:** with nothing picked the tab shows the running event (existing overlap rule), else the next upcoming one, else the "nothing scheduled" state.
- **Selection lives in the URL** (`/dailies/hse?event=<key>`), so it survives reload and can be shared, and is dropped when the key no longer resolves.
- **Upcoming instances** other than the next one get the same labelled preview the next one gets today (lists for a rule-bearing event, countdown always).
- **Past instances** show the event's name, "ended on" date and rules, without the farm list, top-10 lists or raid header controls (raiding now cannot score for an ended event).
- Tour step for the switcher; copy in en/de/es/fr.

Out of scope: the points projection and team suggestions for events without raid points (`add-hse-points-projection`, `add-hse-team-suggestions`, which build on this switcher); deep links from the Home events widget.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `daily-raids-home-screen-event`: the tab shows a selected instance instead of only the derived active/next one; new switcher requirement; preview and empty-state requirements generalized to any selected upcoming or past instance.

## Impact

- **Apps only.** No API change: authored past occurrences and projected placeholders are already in the served `events-calendar` dataset.
- `features/daily-raids/model/select-active-home-screen-event.ts` (instance list and key), `use-active-home-screen-event.ts` (loads past entries too), new `features/daily-raids/ui/home-screen-event/event-switcher.tsx`, `event-status-line.tsx`, `event-preview-banner.tsx`, `pages/dailies/ui/hse-page.tsx`, new `pages/dailies/ui/hse-page.tutorial.tsx`, locales `dailies.json` in four languages.
