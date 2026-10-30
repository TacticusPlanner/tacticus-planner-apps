## ADDED Requirements

### Requirement: Unarchiving respects the per-type goal cap

Moving goals out of Archived SHALL first count the loaded non-archived goals of each restored goal's type plus the restored goals. When a type would pass 200, no request is sent and one translated toast names the type and the cap. A `goalLimitReached` from the API SHALL read as translated copy in the status-failure toast.

#### Scenario: Restoring past the cap

- **WHEN** the account has 200 non-archived Rank goals and the user unarchives a Rank goal
- **THEN** no request is sent and a toast says the account already has 200 Rank goals that are not archived
