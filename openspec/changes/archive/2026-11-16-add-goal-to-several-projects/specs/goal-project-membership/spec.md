# Spec Delta

## ADDED Requirements

### Requirement: The goal row menu offers Add to another project

Every goal row's "⋯" menu on the Goals page, scoped or not, on desktop and mobile, SHALL offer **Add to another project…** right after Edit. It SHALL open the membership picker for that goal (a dialog on desktop, a sheet on mobile) with its current projects checked, and saving SHALL submit only the membership change, without changing status, target or priority. The item SHALL be disabled while the account's projects are not loaded.

#### Scenario: Add a goal to a second project

- **GIVEN** Kharn's Ascension goal belongs to Chaos Core
- **WHEN** the user picks Add to another project… in its row menu, checks Team Lavi and saves
- **THEN** the goal belongs to Chaos Core and Team Lavi, and a toast names Team Lavi

#### Scenario: Mobile sheet

- **WHEN** the user picks Add to another project… on a mobile card
- **THEN** the picker opens as a sheet with the goal's current projects checked
