## ADDED Requirements

### Requirement: Goal creation respects the per-type goal cap

The API keeps at most 200 non-archived goals of each goal type. Goal creation SHALL count the loaded non-archived goals of each type plus the goals of that type in the request. When a type would pass 200, the form SHALL show a translated issue naming the type and the cap in that type's card and SHALL NOT submit.

#### Scenario: Rank goals are at the cap

- **WHEN** the account has 200 non-archived Rank goals and the user configures a Rank goal
- **THEN** the Rank card shows "You already have 200 Rank goals that are not archived" and Create is blocked
- **AND** no request is sent

### Requirement: A goal or project cap refusal reads as translated copy

A `goalLimitReached` from the API (the loaded list was stale) SHALL show translated copy in the create form instead of the server text, and the draft stays. The Legendary Event plan wizard SHALL show the same copy on a failed goal item, and the project-cap copy on a failed project item.

#### Scenario: The API refuses at the cap

- **WHEN** creating returns 400 `goalLimitReached`
- **THEN** the form shows the translated cap message, not the server text, and stays open with its draft

### Requirement: The create request carries only what the API accepts

The create request SHALL carry, in each goal's snapshot, only Game Catalog upgrade ids, each at most once, trimmed, non-blank and at most 128 characters, and at most 250 entries per list. Every `dependsOnIndex` SHALL hold distinct indices. An Upgrade target list is sent only on the Upgrade goal.

#### Scenario: An unresolvable material is left out of the snapshot

- **WHEN** the rank preview holds an id the catalog's upgrades do not contain
- **THEN** the snapshot's resource lists omit it

#### Scenario: A repeated id is sent once

- **WHEN** the preview lists the same material twice
- **THEN** the snapshot lists it once, with its first entry's counts
