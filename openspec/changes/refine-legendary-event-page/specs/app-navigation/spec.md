# Spec Delta

## MODIFIED Requirements

### Requirement: Events is a top-level authenticated section with Legendary Events as its child

The navigation model SHALL include a top-level **Legendary Events** section at `/legendary-events`, authenticated-only, with `mobilePlacement: "menu"` and a calendar-style icon, in the position the Events section held (after Progress, before Guild). Its children SHALL be resolved at runtime: one child per **active** Legendary Event (catalog `lres` lifecycle `active`), labelled with the event unit's localized name and carrying the unit's portrait, at `/legendary-events/:eventId`; then one static child **All events** at `/legendary-events`, which is the landing page. While the catalog read is pending or fails, or no event is active, only All events SHALL be listed. `/events` and `/events/legendary-events` SHALL redirect to `/legendary-events`, and `/events/legendary-events/:eventId` to `/legendary-events/:eventId`, replacing the history entry. The section and its static child SHALL carry localized labels and descriptions in every supported locale, be indexed by navigation search, and follow the existing header, breadcrumb, document-title and last-visited-child rules for a section with children; a dynamic child SHALL be indexed by its localized name. The general navigation tour SHALL mention the Legendary Events section on desktop and mobile. `/legendary-events/:eventId` SHALL activate that event's child when it is active, else the All events child.

#### Scenario: Desktop sidebar lists Events

- **WHEN** a signed-in user views the desktop sidebar
- **THEN** Legendary Events appears after Progress and before Guild, and activating it lands on `/legendary-events`

#### Scenario: Secondary nav lists active events then All events

- **GIVEN** Uthar and Farsight are active and Lysander is upcoming
- **WHEN** a signed-in user opens the Legendary Events section on desktop or the mobile section tabs
- **THEN** the children read Uthar, Farsight (each with the unit's portrait, in hub order), then All events; Lysander is not listed

#### Scenario: No active event

- **GIVEN** no event is active, or the catalog read is pending or failed
- **WHEN** the section's children render
- **THEN** only All events is listed

#### Scenario: Mobile drawer lists Events, bottom bar does not

- **WHEN** a signed-in mobile user opens the Menu drawer
- **THEN** Legendary Events and its All events child are listed with descriptions, and the bottom bar is unchanged

#### Scenario: Anonymous users do not see Events

- **WHEN** an anonymous user views the navigation (desktop sidebar or mobile drawer)
- **THEN** Legendary Events is absent, like Plan, Progress and Guild

#### Scenario: Search finds Legendary Events

- **GIVEN** Uthar is active
- **WHEN** a user types "uthar" into navigation search
- **THEN** Uthar appears under Legendary Events and selecting it opens `/legendary-events/votanUthar`; typing "legendary" finds All events

#### Scenario: Old routes redirect

- **WHEN** a user opens `/events/legendary-events/astarLysander`, `/events/legendary-events` or `/events`
- **THEN** they land on `/legendary-events/astarLysander`, `/legendary-events` and `/legendary-events` respectively, with the history entry replaced

#### Scenario: Detail route keeps the child active

- **WHEN** a user is on `/legendary-events/votanUthar` and Uthar is active
- **THEN** the Uthar child is the active tab; on `/legendary-events/bloodDante` for an archived event, All events is active
