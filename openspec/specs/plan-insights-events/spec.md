# plan-insights-events Specification

## Purpose

Defines the farming cards on Plan > Insights ("Best campaigns to farm" and "Best events to farm"): which campaigns and campaign events they rank, how they rank them, and which locations they cover.

## Requirements

### Requirement: Best events to farm ranks every event campaign

The Plan > Insights "Best events to farm" card SHALL rank event campaigns over the event-campaign battles the Locations control selects (see "Insights farming cards switch between reached and all locations"), with the same ranking as "Best campaigns to farm". A line under its title SHALL say it covers every campaign event, running or not. Estimates, the plan date, bottlenecks and "Best campaigns to farm" SHALL NOT read battles the player cannot raid now.

#### Scenario: Between events

- **GIVEN** no campaign event is running, the player has reached nodes of an event campaign, and those battles drop a material the plan needs
- **WHEN** the player opens Plan > Insights with Locations set to Reached
- **THEN** "Best events to farm" lists that event campaign with the goals it helps, and the plan date is unchanged

### Requirement: Insights farming cards list every campaign behind Show all

"Best campaigns to farm" and "Best events to farm" SHALL each rank every campaign (or event campaign) that drops something the plan needs. Each SHALL show the top 3 by default and, when there are more, a "Show all (N)" button that lists all of them and turns into "Show less".

#### Scenario: More than three campaigns

- **GIVEN** five campaigns drop materials the plan needs
- **WHEN** the player opens Plan > Insights
- **THEN** "Best campaigns to farm" lists the top 3 and "Show all (5)", which reveals the other two

### Requirement: Insights farming cards switch between reached and all locations

The Insights toolbar SHALL offer a "Locations" segmented control in its View slot with the options "Reached" (default) and "All". It SHALL apply to both "Best campaigns to farm" and "Best events to farm".

- Reached SHALL cover the nodes the player has reached by campaign progress. A campaign event node SHALL count once reached by event progress, whether or not its event is running.
- All SHALL cover every node of every campaign and campaign event.
- With Reached selected and no reached event node dropping a needed material, "Best events to farm" SHALL stay visible with a line saying no reached event nodes drop what the plan needs.

#### Scenario: Switching to All

- **GIVEN** the player has not reached a campaign whose battles drop a needed material
- **WHEN** they switch Locations from Reached to All
- **THEN** that campaign appears in "Best campaigns to farm"

### Requirement: Insights farming cards rank by share of needed items

Both farming cards SHALL rank campaigns by the share of the plan's needed items they can drop, counting each resource at the campaign's cheapest node for it. Ties SHALL go to the lower energy per item, then to the higher existing score. Each row SHALL show "X% of needs · ⚡N/item". Expanding a row SHALL add a line with the needed items, the resource count, the total energy and the days that energy takes.

#### Scenario: Equal share

- **GIVEN** two campaigns drop the same needed items
- **WHEN** one costs less energy per item
- **THEN** that campaign ranks first
