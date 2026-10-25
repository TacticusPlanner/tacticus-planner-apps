## MODIFIED Requirements

### Requirement: The event Overview lists linked projects

The Legendary Event page SHALL show, for signed-in users, in the event header row beside the wizard button (on every tab), a **Projects** line listing the unarchived (active or paused) projects targeting the event ("Project: Uthar run 3 · 7 goals", each linking to that project on Goals), "+N archived" when archived ones exist, or "No project for this event" with a link to the Projects page. While projects load it SHALL show a one-line skeleton; when the read fails it SHALL be hidden.

#### Scenario: One linked project

- **GIVEN** the active project "Uthar run 3" targets Uthar and holds 7 goals
- **WHEN** Uthar's page renders
- **THEN** the line reads "Project: Uthar run 3 · 7 goals" and links to that project on Goals
