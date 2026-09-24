## MODIFIED Requirements

### Requirement: Campaign Event and Incursion placeholders require no confirmation step

Projected placeholders for `campaign-event` and `incursion` SHALL be usable as calendar-placement entries without requiring an authored occurrence, unless that slot introduces new content (a new campaign track or Machine of War), in which case an authored occurrence SHALL supply that flag. A projected `campaign-event` entry remains `confirmed: false` and its `endUtc` SHALL NOT be treated as an authoritative exact end time by countdown consumers. A verified authored occurrence MAY replace a campaign-event placeholder even without new-content debut when its actual time differs.

#### Scenario: Placeholder used without any authored occurrence

- **WHEN** a `campaign-event` or `incursion` slot has no authored occurrence and does not debut new content
- **THEN** the projected placeholder remains available for calendar placement for that slot, but a `campaign-event` countdown consumer does not present its end as confirmed

#### Scenario: Debut flag requires an authored occurrence

- **WHEN** a `campaign-event` or `incursion` slot introduces a new content debut
- **THEN** an authored occurrence for that slot carries the debut flag, superseding the placeholder

#### Scenario: Verified campaign-event time supersedes a projection

- **WHEN** a campaign event's actual time is verified and authored for a projected slot
- **THEN** the client receives the confirmed authored entry for that window and can use its explicit `endUtc` for a countdown
