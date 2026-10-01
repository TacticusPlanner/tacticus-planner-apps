# dailies-action-hierarchy Specification

## Purpose

Makes Today's Attempts wording on Dailies unambiguous about attempts used versus attempts remaining.

## Requirements

### Requirement: Attempts wording distinguishes used from remaining

Today's Attempts SHALL state unambiguously whether a count is attempts used or attempts remaining, so a count of used attempts cannot be read as remaining attempts. A planned "Max raids" label SHALL NOT be presented as proof that the player has used every real attempt.

#### Scenario: Used attempts shown

- **WHEN** Today's Attempts shows how many attempts have been used
- **THEN** the label makes clear the number is used, and remaining attempts are available without inferring them

#### Scenario: Planned maximum with real attempts remaining

- **WHEN** a plan allocates a node's full cap but synced attempts remain
- **THEN** the node's label does not state that real attempts are exhausted
