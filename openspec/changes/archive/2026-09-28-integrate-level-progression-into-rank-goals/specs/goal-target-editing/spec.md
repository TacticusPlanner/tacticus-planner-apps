## MODIFIED Requirements

### Requirement: Eligible goals expose target editing

The goal detail SHALL offer an explicit Edit target action for Active or Paused Rank, Ascension, Ability, and Upgrade goals. It SHALL prefill the stored target, not a target inferred from current progression. Unlock, Completed, and Archived goals SHALL not offer the action. There is no Level goal to edit; the level a Rank or Ability goal needs follows from that goal's own target (see `rank-level-progression`).

#### Scenario: Edit an active Rank goal

- **WHEN** an owner opens an Active Rank goal and selects Edit target
- **THEN** the editor opens with that goal's stored end rank selected

#### Scenario: Unsupported goal

- **WHEN** an owner opens an Unlock or Completed goal
- **THEN** no Edit target action is available

#### Scenario: Editing a Rank target updates its required level

- **WHEN** an owner saves a higher end rank on an Active Rank goal whose new target needs a higher character level
- **THEN** the goal's displayed required level reflects the new target, and no Level goal is created
