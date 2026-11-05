## ADDED Requirements

### Requirement: The HRE tab switches between Hero Release Event instances

The HRE tab SHALL offer an event switcher in its title row listing every Hero Release Event instance in the game-events calendar (deduplicated by occurrence key), grouped as Running, Upcoming (ascending by start) and Past (newest first), the same control as the HSE tab's switcher. Each option SHALL show the featured hero's icon (the event icon when the hero does not resolve), the hero's localized name and the event's start and end dates in the player's locale. Previous and Next buttons SHALL step to the instance with the closest earlier or later start and SHALL be disabled at either end.

With no instance selected the tab SHALL show the default instance (the running one, else the next upcoming one, per "The HRE tab shows the running or next Hero Release Event"). The selection SHALL be held in the HRE tab's `event` URL search parameter, keyed by the occurrence id or `definitionId@startUtc`; it SHALL survive a reload, selecting the default SHALL remove the parameter, and a key that no longer resolves SHALL fall back to the default and be removed from the URL. A key SHALL only be judged once the calendar has synced.

A selected upcoming instance SHALL render as the preview does. A past instance SHALL show its header labelled "Ended" with its window and no countdown, a note that the event has ended, and its read-only mission list; it SHALL NOT show the tracker, the raids section, the teams, the tokens card or the pace.

#### Scenario: Step back to a past event

- **GIVEN** Zapspitta's HRE is running and an earlier HRE ended on 4 October 2026
- **WHEN** the player presses Previous
- **THEN** the URL holds `?event=<that occurrence>` and the tab shows the earlier event labelled "Ended", with its missions and no raids, tracker or pace

#### Scenario: Back to the default

- **WHEN** the player then presses Next
- **THEN** the `event` parameter is removed and the running event shows again

#### Scenario: Stale key

- **GIVEN** the URL holds `?event=gone`
- **THEN** the tab shows the default event and removes the parameter
