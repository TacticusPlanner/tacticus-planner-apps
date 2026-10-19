# Design

## Decisions

### D1. Target is a tagged value, not a foreign key

`target` is `{ kind, eventId }` validated against the served catalog at write time. Events are catalog records, not database rows, so there is nothing to join. Unknown kinds are rejected by the server until a client supports them.

### D2. Several projects may share a target

A player may keep "Uthar run 2" and "Uthar run 3" apart. The wizard offers the most recently updated active project with the same target as its default destination and lets the user pick another or create one (see the 1-click plan change).

### D3. Archived projects keep their target

Archiving does not clear the target; the event page lists only active linked projects and says how many archived ones exist.
