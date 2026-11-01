# Spec Delta

## ADDED Requirements

### Requirement: The Overview shows an Event board of every lane

While the `LreEventBoard` feature flag is on, the Overview tab SHALL show an Event board after the Run status card: one column per lane in lane order, side by side at or above 1024px and stacked below. Each column SHALL show the lane name with its allowed-units rule, every lane objective in objective order (icon, label, points, and "cleared / battles" from synced progress, omitted while progress is unavailable) and the lane's saved teams in stored order (readable name, member portraits, the icons of the stored objectives the members still derive). Once teams have loaded, an objective no saved team covers SHALL be marked "No team"; a lane with no teams SHALL say so. Activating a team SHALL open the page's team editor on it; activating a lane heading SHALL select that lane's tab. This is the only place lanes render side by side. While the flag is off the Overview is unchanged.

#### Scenario: Board shows every lane

- **GIVEN** the flag is on and Alpha and Beta each have one saved team
- **WHEN** the user opens the Overview tab
- **THEN** the Event board shows three lane columns with their objectives, one team row in Alpha and in Beta, and "No teams yet" in Gamma

#### Scenario: Uncovered objective

- **GIVEN** no saved Alpha team covers Alpha's second objective
- **WHEN** the Event board renders
- **THEN** that objective is marked "No team"

#### Scenario: Flag off

- **GIVEN** the flag is off
- **WHEN** the user opens the Overview tab
- **THEN** no Event board renders
