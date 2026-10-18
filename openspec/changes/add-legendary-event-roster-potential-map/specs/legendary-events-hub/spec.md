# Spec Delta

## MODIFIED Requirements

### Requirement: Lane overview section

For each lane the Lane overview SHALL show the lane's label (Alpha / Beta / Gamma) with the allowed-alliance rule derived from `allowedUnitsFilter` (for example "Alpha · No Xenos"), kill points per battle, the five objectives as chips with icon, label and score, the battle count, the roster potential mini map (`legendary-event-roster-potential`) in place of a per-battle points ladder, and a collapsed "how points work" disclosure explaining kill points, objective scores, defeat-all and high-score points in one paragraph. Each battle's points SHALL remain available through the map column's label and tooltip.

#### Scenario: Lane card content

- **WHEN** Lysander's Lane overview renders
- **THEN** the Alpha card shows "Alpha · No Xenos", "32 kill points per battle", five chips (Eviscerate 75, Suppressive Fire 95, Flying 80, Min 5 hits 85, No Resilient 40), "18 battles", an 18-column roster potential map whose first column is labelled "Battle 1 · 32 points" and last "Battle 18 · 57 points", and the collapsed disclosure
