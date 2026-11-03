# Spec Delta

## ADDED Requirements

### Requirement: Project cards show unit portraits

Each project card on the Projects page SHALL show round portraits of the first 4 distinct units among the project's in-flight goals, ordered by the global priority of each unit's highest goal, followed by "+N" when more units exist, beside the colour dot. They come from the goals list the card already joins, with no extra read. A project with no in-flight goals shows no portraits. While the goals list loads the portraits are part of the summary skeleton.

#### Scenario: Six units

- **GIVEN** project Chaos Core has in-flight goals for Kharn, Abaddon, Typhus, Lucius, Ahriman and Angrax, in that priority order
- **WHEN** its card renders
- **THEN** it shows the portraits of Kharn, Abaddon, Typhus and Lucius, then "+2"

### Requirement: Projects can be filtered by target kind

The Projects page SHALL show filter chips All, LE, BP, GR, GW, Date and None (no target), listing only kinds present among the listed projects, and only when at least 2 kinds are present. The default is All. Choosing a chip SHALL list only projects with that target kind. The choice SHALL be kept in `?kind=` so it survives reload and back navigation, and SHALL reset to All when no listed project has that kind any more. On mobile the chips scroll horizontally in one row.

#### Scenario: Filter to Guild War projects

- **GIVEN** projects target LE Uthar R3, GW S29, GW (rolling), and two have no target
- **WHEN** the user picks GW
- **THEN** only the two Guild War projects are listed and the URL carries `?kind=guildWarSeason`

#### Scenario: One kind only

- **GIVEN** no project has a target
- **WHEN** the Projects page renders
- **THEN** no filter chips are shown
