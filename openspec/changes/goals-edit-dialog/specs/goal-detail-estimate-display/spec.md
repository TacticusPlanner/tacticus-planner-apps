## REMOVED Requirements

### Requirement: The goal-detail estimate shows a completion date and day count

**Reason**: The read-only goal detail (including its Estimate section) is removed; the Edit goal dialog shows no estimate. The Goals list's "Done by" column remains the estimate surface (`goal-list-estimate-display`).
**Migration**: Read the estimate from the Goals list or a project's goal list.

### Requirement: The goal-detail estimate states which model produced it

**Reason**: The goal-detail Estimate section no longer exists.
**Migration**: None; the list's plan-aware estimate is defined by `goal-list-estimate-display`.
