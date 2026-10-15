## ADDED Requirements

### Requirement: My Game is the player-state section with Collection as its default child

The navigation model SHALL include a top-level **My Game** section at `/my-game`, in the position the Progress section held, with `mobilePlacement: "menu"`. It SHALL replace the Progress section: there SHALL be no Progress section. Its children SHALL be, in order: **Collection** (`/my-game/collection`), **Onslaught** (`/my-game/onslaught`), **Campaigns** (`/my-game/campaigns`) and **Campaign Events** (`/my-game/campaign-events`). Collection SHALL be the section's default child: on desktop, the first activation of My Game in a session lands on `/my-game/collection`, after which the existing last-visited-child rule applies; `/my-game` itself SHALL resolve to `/my-game/collection`. The old `/progress`, `/progress/onslaught`, `/progress/campaigns` and `/progress/campaign-events` routes SHALL NOT exist and SHALL NOT redirect; they fall through to the app's existing not-found handling. Every in-app link that pointed to a `/progress/*` route SHALL point to its `/my-game/*` equivalent. The section and each child SHALL carry localized labels and descriptions in every supported locale, be indexed by navigation search, and follow the existing header, breadcrumb, document-title and section-menu rules for a section with children. The general navigation tour SHALL refer to My Game, not Progress, on desktop and mobile.

#### Scenario: Desktop first entry lands on Collection

- **GIVEN** a signed-in desktop user who has not visited My Game in this session
- **WHEN** they activate My Game in the sidebar
- **THEN** they land on `/my-game/collection`, and the section menu lists Collection, Onslaught, Campaigns and Campaign Events in that order

#### Scenario: Desktop returns to the last-visited child

- **GIVEN** a signed-in desktop user last visited `/my-game/campaigns` in this session
- **WHEN** they activate My Game in the sidebar again
- **THEN** they land on `/my-game/campaigns`

#### Scenario: Mobile drawer and tab row

- **GIVEN** a signed-in mobile user
- **WHEN** they open the Menu drawer, or open any My Game page
- **THEN** the drawer lists My Game with Collection, Onslaught, Campaigns and Campaign Events nested beneath it, and a My Game page's header tab row shows those four children

#### Scenario: Old Progress routes are gone

- **WHEN** a signed-in user opens `/progress/onslaught`, `/progress/campaigns`, `/progress/campaign-events` or `/progress`
- **THEN** no My Game page renders and the app's existing not-found handling applies

#### Scenario: Search finds My Game pages

- **WHEN** a signed-in user types "collection" or "onslaught" into navigation search
- **THEN** the matching child appears under My Game and selecting it opens its `/my-game/*` route

### Requirement: A section can mix anonymous and sign-in-only children

A navigation child SHALL be able to require sign-in independently of its section. For an anonymous user, a section that allows anonymous access SHALL list only its children that allow anonymous access, everywhere children are listed: the desktop section menu, the mobile header tab row, the mobile menu drawer and navigation search. The section's desktop entry point and default-child resolution SHALL only resolve to a child the current user can see. Opening a sign-in-only child's route while signed out SHALL follow the same sign-in handling as any other sign-in-only route. For My Game, Collection SHALL allow anonymous access and Onslaught, Campaigns and Campaign Events SHALL require sign-in, so the My Game section itself SHALL be shown to anonymous users with Collection as its only child. Signing in or out SHALL update which children are listed without a page reload.

#### Scenario: Anonymous user sees My Game with only Collection

- **GIVEN** the user is not signed in
- **WHEN** they view the desktop sidebar, the desktop section menu for My Game, or the mobile Menu drawer
- **THEN** My Game is listed and Collection is its only child; Onslaught, Campaigns and Campaign Events are not listed

#### Scenario: Anonymous search excludes sign-in-only children

- **GIVEN** the user is not signed in
- **WHEN** they type "onslaught" into navigation search
- **THEN** no My Game Onslaught entry is offered, while typing "collection" offers My Game Collection

#### Scenario: Anonymous desktop entry resolves to a visible child

- **GIVEN** an anonymous desktop user
- **WHEN** they activate My Game in the sidebar
- **THEN** they land on `/my-game/collection`

#### Scenario: Anonymous user opens a sign-in-only child directly

- **GIVEN** the user is not signed in
- **WHEN** they open `/my-game/onslaught` from a bookmark
- **THEN** the app applies its existing sign-in handling for sign-in-only routes and does not render the Onslaught page

#### Scenario: Mobile tab row for an anonymous user

- **GIVEN** an anonymous mobile user on `/my-game/collection`
- **WHEN** the header renders
- **THEN** the tab row shows only Collection

#### Scenario: Signing in reveals the remaining children

- **GIVEN** an anonymous user on `/my-game/collection`
- **WHEN** they sign in
- **THEN** My Game lists Collection, Onslaught, Campaigns and Campaign Events without a page reload

## MODIFIED Requirements

### Requirement: Events is a top-level authenticated section with Legendary Events as its child

The navigation model SHALL include a top-level **Legendary Events** section at `/legendary-events`, authenticated-only, with `mobilePlacement: "menu"` and a calendar-style icon, in the position the Events section held (after My Game, before Guild). Its children SHALL be resolved at runtime: first the static child **All events** at `/legendary-events`, which is the landing page; then one child per catalog Legendary Event in hub order (active by run start, then upcoming, then archived alphabetically), labelled with the event unit's localized name and carrying the unit's portrait, at `/legendary-events/:eventId`, with a description naming its lifecycle (active, upcoming or archived). While the catalog read is pending or fails only All events SHALL be listed. The old `/events`, `/events/legendary-events` and `/events/legendary-events/:eventId` routes SHALL NOT exist and SHALL NOT redirect; they fall through to the app's not-found handling. The section and its static child SHALL carry localized labels and descriptions in every supported locale, be indexed by navigation search, and follow the existing header, breadcrumb, document-title and last-visited-child rules for a section with children; a dynamic child SHALL be indexed by its localized name. The general navigation tour SHALL mention the Legendary Events section on desktop and mobile. `/legendary-events/:eventId` SHALL activate that event's child whatever its lifecycle: active-child resolution picks the matching child with the most specific path, so All events never shadows an event child.

#### Scenario: Desktop sidebar lists Events

- **WHEN** a signed-in user views the desktop sidebar
- **THEN** Legendary Events appears after My Game and before Guild, and activating it for the first time in the session lands on `/legendary-events`

#### Scenario: Sidebar returns to the last-visited event

- **GIVEN** the user last visited `/legendary-events/astarLysander` in this section
- **WHEN** they activate Legendary Events in the desktop sidebar again
- **THEN** they land on `/legendary-events/astarLysander`, per the last-visited-child rule

#### Scenario: Secondary nav lists active events then All events

- **GIVEN** Uthar and Farsight are active, Lysander is upcoming and Dante is archived
- **WHEN** a signed-in user opens the Legendary Events section on desktop or the mobile section tabs
- **THEN** the children read All events, Uthar, Farsight, Lysander, Dante (each event with the unit's portrait, in hub order), with Uthar's description naming it active, Lysander's upcoming and Dante's archived

#### Scenario: No active event

- **GIVEN** no event is active and Lysander is upcoming
- **WHEN** the section's children render
- **THEN** the children read All events then Lysander; while the catalog read is pending or failed only All events is listed

#### Scenario: Mobile drawer lists Events, bottom bar does not

- **WHEN** a signed-in mobile user opens the Menu drawer
- **THEN** Legendary Events and its All events child are listed with descriptions, and the bottom bar is unchanged

#### Scenario: Anonymous users do not see Events

- **WHEN** an anonymous user views the navigation (desktop sidebar or mobile drawer)
- **THEN** Legendary Events is absent, like Plan and Guild, while My Game is present with only its Collection child

#### Scenario: Search finds Legendary Events

- **GIVEN** Uthar is active and Dante is archived
- **WHEN** a user types "uthar" or "dante" into navigation search
- **THEN** the event appears under Legendary Events and selecting it opens its `/legendary-events/:eventId` page; typing "legendary" finds All events

#### Scenario: Old routes are gone

- **WHEN** a signed-in user opens `/events/legendary-events/astarLysander`, `/events/legendary-events` or `/events`
- **THEN** no Legendary Events page renders and the app's existing not-found handling applies (replace to `/home`)

#### Scenario: Detail route keeps the child active

- **WHEN** a user is on `/legendary-events/votanUthar` and Uthar is active, or on `/legendary-events/bloodDante` and Dante is archived
- **THEN** that event's child is the active tab, and on `/legendary-events` All events is active
