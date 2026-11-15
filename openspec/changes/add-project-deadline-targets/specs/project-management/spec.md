# Spec Delta

## ADDED Requirements

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
