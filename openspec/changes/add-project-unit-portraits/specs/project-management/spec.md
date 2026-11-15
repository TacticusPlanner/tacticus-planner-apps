# Spec Delta

## ADDED Requirements

### Requirement: Project cards show unit portraits

Each project card on the Projects page SHALL show round portraits of the first 4 distinct units among the project's in-flight goals, ordered by the global priority of each unit's highest goal, followed by "+N" when more units exist, beside the colour dot. They come from the goals list the card already joins, with no extra read. A project with no in-flight goals shows no portraits. While the goals list loads the portraits are part of the summary skeleton.

#### Scenario: Six units

- **GIVEN** project Chaos Core has in-flight goals for Kharn, Abaddon, Typhus, Lucius, Ahriman and Angrax, in that priority order
- **WHEN** its card renders
- **THEN** it shows the portraits of Kharn, Abaddon, Typhus and Lucius, then "+2"
