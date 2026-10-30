## ADDED Requirements

### Requirement: Project creation respects the project cap

The API keeps at most 100 non-archived projects. Creating a project from the Projects sheet or from a goal's project picker SHALL check the loaded project list first: at 100 non-archived projects nothing is sent and a translated message asks the user to archive one. A `projectLimitReached` from the API SHALL show the same message.

#### Scenario: Creating the 101st project

- **WHEN** 100 projects are not archived and the user creates another
- **THEN** no request is sent and the message "You already have 100 projects that are not archived. Archive one to make room." shows
