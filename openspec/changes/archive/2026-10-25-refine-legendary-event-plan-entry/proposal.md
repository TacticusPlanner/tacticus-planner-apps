## Why

The event page buries the plan: the wizard button sits under the tabs, the linked project sits below Run status, and the run date is only in the Run status card. A player opening an event should see when the next run is, whether they already have a plan, and the one action that matters (plan it, or refine the plan) without scrolling.

## What Changes

- The event's page header description adds its run date: "Starts <date>" for an upcoming event, "Ends <date>" for an active one, nothing when archived or to be announced.
- The linked projects line and the wizard button move from the Overview into the event header row, beside the name and lifecycle badge, on every tab; they wrap below the name on narrow screens.
- The button is a primary **Plan this event** until the event has a plan (a linked project and at least two stored teams in every lane), then a secondary **Refine plan**.
- New strings (`legendaryEvents.tabs.runStartsOn`, `runEndsOn` in `common`, `planWizard.refine` in `legendaryEvents`) in en, de, es and fr.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-navigation`: an event child's description names its run date.
- `project-event-target`: the linked projects line moves to the event header row.
- `legendary-event-plan-wizard`: the entry button moves to the header row and switches between Plan this event and Refine plan.

## Impact

`app/layout/use-nav-items.ts`, `pages/legendary-events/ui/legendary-event/` (header, page view, new `legendary-event-plan-entry.tsx`), `features/project-management` (exports `useEventProjects`), locale files, and tests. No API or data change.
