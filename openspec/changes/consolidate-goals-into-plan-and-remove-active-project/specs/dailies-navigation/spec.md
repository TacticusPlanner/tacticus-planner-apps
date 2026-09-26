## REMOVED Requirements

### Requirement: Raids tabs and project selector share one row

**Reason**: Today and Raids Plan show the account-wide plan in global goal order, so `RaidsLayout` has no project selector (a project is a filter, never an execution scope). The requirement described a control that no longer exists.

**Migration**: The Today/Raids Plan sub-tab row stays; `expose-planning-settings-from-dailies` adds the Planning Settings trigger to it under its own requirement.

### Requirement: Project selector compresses on mobile

**Reason**: There is no project selector in the Raids tab row, so there is nothing to compress.

**Migration**: None; the Today and Raids Plan sub-tab labels stay text at every breakpoint under "Raids sub-navigation".
