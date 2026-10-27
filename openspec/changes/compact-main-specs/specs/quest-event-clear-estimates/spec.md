## MODIFIED Requirements

### Requirement: The power ratio can be calibrated from samples

The planner SHALL provide `calibrateQuestPowerRatio(samples)`, where a sample is `{ E, B, cleared }`, returning the ratio r that the fewest samples contradict (a cleared sample contradicts r when E < r × B; a failed one when E ≥ r × B), choosing the median of the tied range, or null with fewer than 5 samples. Nubari's recorded powers against their NPC sums SHALL also be checked by a unit test that reports the ratio, to judge the NPC fallback. The app SHALL ship r as a constant set from this function; there is no in-app calibration UI.

#### Scenario: Too few samples

- **WHEN** it is called with 4 samples
- **THEN** it returns null
