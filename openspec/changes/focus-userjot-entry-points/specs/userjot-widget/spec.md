## ADDED Requirements

### Requirement: Send feedback opens the Feedback list

The account menu's Send feedback row, on desktop and in the mobile drawer, and the Submit feedback search quick action SHALL open the widget on its Feedback list, where the player's and other players' requests are listed and a new one can be posted, rather than on the widget's Home. The desktop feedback button in the global bar SHALL keep opening Home, or Updates while there is unread activity.

#### Scenario: Send feedback from the account menu

- **WHEN** a user activates Send feedback in the account menu
- **THEN** the widget opens on its Feedback list and the menu closes

#### Scenario: Submit feedback from search

- **WHEN** a user selects the Submit feedback quick action
- **THEN** the widget opens on its Feedback list
