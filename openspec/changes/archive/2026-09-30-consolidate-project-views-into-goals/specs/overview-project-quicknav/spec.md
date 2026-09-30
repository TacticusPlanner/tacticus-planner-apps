## REMOVED Requirements

### Requirement: Overview renders a project quick-nav above its control row

**Reason**: The capability is retired. The row above Goals' controls is now the URL-backed project scope filter, defined by `goals-navigation` "Goals project scope chip row"; it no longer navigates anywhere and no longer reuses the home page's project widget on mobile. Delete `openspec/specs/overview-project-quicknav` when this change is archived.
**Migration**: `goals-navigation` "Goals project scope chip row".

### Requirement: The quick-nav lists projects, Default first, archived excluded

**Reason**: Retired with the capability; ordering and archived exclusion carry over to the scope chip row.
**Migration**: `goals-navigation` "Goals project scope chip row".

### Requirement: Desktop's chip row links to the full Projects dashboard

**Reason**: The Projects tab is one tap away in the section navigation; the chip row is a filter, not a launcher.
**Migration**: None needed.

### Requirement: Activating an entry navigates to the project's detail route

**Reason**: The detail route no longer exists; a chip selects a scope in place.
**Migration**: `goals-navigation` "Goals project scope is URL state".

### Requirement: No projects yet

**Reason**: Retired with the capability.
**Migration**: `goals-navigation` "Goals project scope chip row" (only the "All goals" chip renders with no projects); project creation lives on the Projects page (`project-management` "Creating and editing a project uses a form Sheet").

### Requirement: Loading and failure states

**Reason**: Retired with the capability.
**Migration**: `goals-navigation` "Goals project scope chip row" (skeleton while loading; "All goals" only, no error, on failure).

### Requirement: The Goals project area can create a project directly

**Reason**: Goals no longer creates projects; the Projects tab's New project action is the single entry point.
**Migration**: `project-management` "Creating and editing a project uses a form Sheet".
