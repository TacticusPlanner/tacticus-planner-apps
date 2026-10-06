# Spec Delta

## ADDED Requirements

### Requirement: Events is a top-level authenticated section with Legendary Events as its child

The navigation model SHALL include a top-level **Events** section at `/events`, authenticated-only, with `mobilePlacement: "menu"` (listed in the mobile menu drawer, not the bottom bar), a calendar-style icon, and one child page **Legendary Events** at `/events/lre`. `/events` SHALL redirect to `/events/lre`. The section and child SHALL carry localized labels and descriptions in every supported locale, be indexed by navigation search, and follow the existing header, breadcrumb, document-title and last-visited-child rules for a section with children. The general navigation tour SHALL mention the Events section in its sections step on desktop and mobile. Event detail routes (`/events/lre/:eventId`) SHALL activate the Legendary Events child in the header and section menu.

#### Scenario: Desktop sidebar lists Events

- **WHEN** a signed-in user views the desktop sidebar
- **THEN** Events appears as a main navigation item after Progress and before Guild, and activating it lands on `/events/lre`

#### Scenario: Mobile drawer lists Events, bottom bar does not

- **WHEN** a signed-in mobile user opens the Menu drawer
- **THEN** Events and its Legendary Events child are listed with descriptions, and the bottom bar is unchanged

#### Scenario: Anonymous users do not see Events

- **WHEN** an anonymous user views the navigation (desktop sidebar or mobile drawer)
- **THEN** Events is absent, like Plan, Progress and Guild

#### Scenario: Search finds Legendary Events

- **WHEN** a user types "legendary" into navigation search
- **THEN** the Legendary Events child appears with its description and selecting it opens `/events/lre`

#### Scenario: Detail route keeps the child active

- **WHEN** a user is on `/events/lre/astarLysander`
- **THEN** the header shows the Legendary Events title and description (mobile) and the Events section menu marks Legendary Events active (desktop), and the document title is "Legendary Events | Tacticus Planner"
