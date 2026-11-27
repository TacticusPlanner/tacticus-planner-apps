## MODIFIED Requirements

### Requirement: Guild War pages are sign-in only and need no registered guild

The app SHALL serve `/guild/war/offense` and `/guild/war/history` to any signed-in user, whether or not they belong to a registered guild, and `/guild/war` SHALL redirect to `/guild/war/offense`. Both pages SHALL share one header (title, one line of description and Tour this page) and page tabs listing Offense and History. Above their content both pages SHALL show a note that the Tacticus API returns no Guild War data, so attacks are logged by hand, with a Close action; once closed the note SHALL stay hidden on that device.

#### Scenario: No registered guild

- **GIVEN** a signed-in user whose guild is not registered
- **WHEN** they open `/guild/war/offense`
- **THEN** the Offense page renders, not the guild onboarding

#### Scenario: The manual-logging note is dismissed once

- **GIVEN** the user closed the manual-logging note on Offense
- **WHEN** they open History on the same device
- **THEN** the note does not show
