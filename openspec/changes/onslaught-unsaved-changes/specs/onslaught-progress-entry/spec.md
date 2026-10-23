## ADDED Requirements

### Requirement: Save reflects unsaved changes and leaving asks first

The Save button SHALL be enabled only while the draft differs from the saved Onslaught progress, compared alliance by alliance on sector, tier and whether the alliance is set, and SHALL be disabled while a save is in flight. A draft whose values were changed back to the saved ones SHALL count as unchanged. Marking an alliance as set by choosing its first sector is a change, even if the chosen position equals the stored default. After a successful save, or after a revision conflict reloads the saved progress, there SHALL be nothing to save. While there are unsaved changes, navigating to another page in the app SHALL ask "Leave without saving?" with Stay and Leave, where Stay keeps the user on the page with the draft intact and Leave discards it and navigates; closing or reloading the tab SHALL trigger the browser's own leave prompt. Without unsaved changes, navigation SHALL NOT ask. The behavior is the same on desktop and mobile.

#### Scenario: Nothing changed

- **GIVEN** the saved progress has Imperial at Gold, Tier 2
- **WHEN** the page loads
- **THEN** Save is disabled

#### Scenario: A change enables Save

- **WHEN** the user changes Imperial's Tier from 2 to 3
- **THEN** Save is enabled

#### Scenario: Changing a value back

- **GIVEN** the user changed Imperial's Tier from 2 to 3
- **WHEN** they change it back to Tier 2
- **THEN** Save is disabled and leaving the page does not ask

#### Scenario: Leaving with unsaved changes

- **GIVEN** the user changed Imperial's Tier from 2 to 3 and did not save
- **WHEN** they open another page from the navigation
- **THEN** a "Leave without saving?" dialog appears; Stay keeps the page with Tier 3 still selected, and Leave opens the other page and discards the change

#### Scenario: Closing the tab with unsaved changes

- **GIVEN** the user has unsaved changes
- **WHEN** they close or reload the tab
- **THEN** the browser shows its own leave prompt

#### Scenario: After saving

- **GIVEN** the user changed a position and saved it successfully
- **WHEN** they open another page
- **THEN** Save is disabled and the page changes without asking

#### Scenario: After a revision conflict

- **GIVEN** the progress was changed on another device after the page loaded
- **WHEN** the user saves an edit and the save is rejected as stale
- **THEN** the latest saved progress is shown with the conflict message, and Save is disabled
