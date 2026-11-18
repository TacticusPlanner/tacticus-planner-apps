## ADDED Requirements

### Requirement: Best events to farm ranks every event campaign

The Plan > Insights "Best events to farm" card SHALL rank event campaigns over every event-campaign battle in the catalog, whether or not its event is running and whether or not the player has reached it, with the same scoring as "Best campaigns to farm". A line under its title SHALL say it covers every campaign event, running or not. Estimates, the plan date, bottlenecks and "Best campaigns to farm" SHALL keep reading only the battles the player can raid now.

#### Scenario: Between events

- **GIVEN** no campaign event is running and an event campaign's battles drop a material the plan needs
- **WHEN** the player opens Plan > Insights
- **THEN** "Best events to farm" lists that event campaign with the goals it helps, and the plan date is unchanged

### Requirement: Insights farming cards list every campaign behind Show all

"Best campaigns to farm" and "Best events to farm" SHALL each rank every campaign (or event campaign) that drops something the plan needs. Each SHALL show the top 3 by default and, when there are more, a "Show all (N)" button that lists all of them and turns into "Show less".

#### Scenario: More than three campaigns

- **GIVEN** five campaigns drop materials the plan needs
- **WHEN** the player opens Plan > Insights
- **THEN** "Best campaigns to farm" lists the top 3 and "Show all (5)", which reveals the other two
