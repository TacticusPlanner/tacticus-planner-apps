# Spec Delta

## ADDED Requirements

### Requirement: Widget cards show unit portraits

Each project card in the home widget SHALL show the same unit portraits as the Projects page card (`project-management`), at a smaller size, with "+N" past 4 units. They come from the goals list the widget already reads, with no extra request.

#### Scenario: Portraits without extra reads

- **GIVEN** the player has five non-archived projects with goals
- **WHEN** the widget renders
- **THEN** each card shows its unit portraits, and the projects list and the goals list are still the only reads
