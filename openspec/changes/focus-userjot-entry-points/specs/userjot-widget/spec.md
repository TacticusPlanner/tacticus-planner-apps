## ADDED Requirements

### Requirement: Send feedback opens the Feedback list

The account menu's Send feedback row, on desktop and in the mobile drawer, and the Submit feedback search quick action SHALL open the widget on its Feedback list, where the player's and other players' requests are listed and a new one can be posted, rather than on the widget's Home. Without unread activity the desktop feedback button in the global bar SHALL keep opening Home.

#### Scenario: Send feedback from the account menu

- **WHEN** a user activates Send feedback in the account menu
- **THEN** the widget opens on its Feedback list and the menu closes

#### Scenario: Submit feedback from search

- **WHEN** a user selects the Submit feedback quick action
- **THEN** the widget opens on its Feedback list

### Requirement: Changelog opens the newest unread post

While the widget reports unread activity, the Changelog entry points (the desktop feedback button, the account menu's and guest menu's Changelog rows, and the mobile guest settings' Changelog row) SHALL open the newest changelog post directly, identified from the public updates feed the widget itself reads. The app SHALL remember the post it last opened this way and, when the newest post is that one, SHALL open the Updates list instead. Without unread activity, or when the newest post cannot be determined (the feed fails, times out after 3 seconds or returns an unexpected shape), they SHALL open the Updates list. The feed request SHALL send no credentials.

#### Scenario: Unread post opens directly

- **GIVEN** a new changelog post the user has not read, so the unread dot shows
- **WHEN** the user activates Changelog
- **THEN** the widget opens on that post

#### Scenario: A dot that stays lit opens the list

- **GIVEN** the user already opened the newest post from Changelog and the dot still shows for another reason
- **WHEN** the user activates Changelog again
- **THEN** the widget opens the Updates list

#### Scenario: The feed is unavailable

- **WHEN** the user activates Changelog with unread activity and the updates feed cannot be read
- **THEN** the widget opens the Updates list
