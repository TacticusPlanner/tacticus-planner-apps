## REMOVED Requirements

### Requirement: Machines of War shows a placeholder instead of an entity picker

**Reason**: Machines of War now has a list page and a unit page (`mow-unit-details`), so no Library
collection shows the "not available yet" placeholder any more.

**Migration**: `/library/machines-of-war` shows the Machines of War list and
`/library/machines-of-war/{id}` the MoW unit page; links keep working. The capability has no requirements
left and is retired when this change is archived.
