# Spec Delta

## ADDED Requirements

### Requirement: Sticky unsaved-changes bar

While the draft differs from the saved progress, the page SHALL show an unsaved-changes bar fixed to the bottom of the viewport with Save and Discard, and SHALL have no other Save button. The bar disappears when the draft matches the saved progress again. Discard returns every alliance to the saved progress.

#### Scenario: Save from the bar

- **GIVEN** the bar is shown
- **WHEN** the player chooses Save
- **THEN** the full draft is sent with the revision it was based on, both actions are disabled while saving, and on success a translated success message is shown and the saved values become the new baseline

#### Scenario: Bar appears and disappears

- **GIVEN** there are no unsaved changes
- **THEN** the bar is not shown
- **WHEN** the player changes an alliance's Tier
- **THEN** the bar is shown
- **WHEN** they change it back to the saved value
- **THEN** the bar is hidden

#### Scenario: Discard

- **GIVEN** the player changed two alliances
- **WHEN** they choose Discard
- **THEN** both alliances show their saved position and the bar is hidden

#### Scenario: On desktop, the bar spans the content area

- **GIVEN** a viewport at or above 768px
- **WHEN** the bar is shown
- **THEN** it is fixed to the bottom of the viewport within the page content area and does not cover the last alliance card when scrolled to the end

#### Scenario: On mobile, the bar sits above the bottom navigation

- **GIVEN** a viewport below 768px
- **WHEN** the bar is shown
- **THEN** it is fixed directly above the mobile bottom navigation, does not overlap it, and does not cover the last alliance card when scrolled to the end

### Requirement: Save conflicts and errors are translated

A save SHALL carry the revision of the saved progress the draft was built on, even if newer progress loaded in the background since the first edit. A revision conflict reloads the saved progress, drops the draft and shows a translated conflict message; any other failure keeps the draft and the bar and shows a translated general save-error message. Raw API error text SHALL NOT be shown.

#### Scenario: Revision conflict

- **GIVEN** the progress was saved from another tab after this page loaded
- **WHEN** the player saves
- **THEN** the page shows the other tab's saved positions, the bar is hidden, and the translated conflict message is shown

#### Scenario: Other API error

- **GIVEN** the API rejects the save with a validation error carrying its own message text
- **WHEN** the player saves
- **THEN** the translated general save-error message is shown instead of the API's text, and the edits and bar remain

### Requirement: Leaving with unsaved edits asks first

While there are unsaved changes, navigating to another route inside the app SHALL ask the player to confirm leaving, with options to stay or to leave and lose the changes. Closing or reloading the browser tab SHALL trigger the browser's own leave confirmation. With no unsaved changes, navigation SHALL NOT be interrupted.

#### Scenario: In-app navigation with edits

- **GIVEN** there are unsaved changes
- **WHEN** the player selects another My Game tab
- **THEN** a confirmation asks whether to leave; choosing Stay keeps the page and edits, choosing Leave navigates away and discards them

#### Scenario: Navigation without edits

- **GIVEN** there are no unsaved changes
- **WHEN** the player selects another My Game tab
- **THEN** navigation happens without a confirmation
