# Proposal

## Why

The 1-click Legendary Event plan (`add-legendary-event-one-click-plan`) creates goals and must file them in a project that belongs to that event, reusing it on later runs. Projects today carry only a name, description and colour, so nothing says "this project is for LE Uthar". Severyn asked to extend projects with what they relate to, starting with Legendary Events and open to other event types later.

## What Changes

- **Project target.** A project can carry an optional **target**: `{ kind: "legendaryEvent", eventId }` (the catalog `lres` id). The kind is an open enum so other event types can follow. Companion change: `tacticus-planner-api` `add-project-event-target`, which applies first.
- **Project form.** The New / Edit project Sheet gains **Related to**: None, or a Legendary Event picked from the catalog (unit portrait and name). The Default project cannot have a target.
- **Project cards** show a target chip ("LE · Uthar") linking to the event page.
- **Event page.** The Legendary Event Overview shows the event's linked projects ("Project: Uthar run 3 · 7 goals") or "No project for this event", with a link to the Projects page.
- The Projects page stays the only place with a **New project** action; the plan wizard may create a project for an event target as part of what it creates.

No **BREAKING** changes: a project without a target behaves exactly as today.

## Capabilities

### New Capabilities

- `project-event-target`: the target field, its picker, chip and the event page's linked-projects line.

### Modified Capabilities

- `project-management`: the project form carries Related to; the "only surface" rule allows the plan wizard's automatic project.

## Impact

- `entities/project`: model, API mapping, target chip.
- `features/project-management`: form field and validation.
- `pages/legendary-events` Overview: linked-projects line.
- `projects` and `legendaryEvents` i18n in en/de/es/fr.
