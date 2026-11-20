## MODIFIED Requirements

### Requirement: My Game is the player-state section with Collection as its default child

The navigation model SHALL include a top-level **My Game** section at `/my-game`, in the position the Progress section held, with `mobilePlacement: "menu"`. It SHALL replace the Progress section: there SHALL be no Progress section. Its children SHALL be, in order: **Collection** (`/my-game/collection`), **Onslaught** (`/my-game/onslaught`), **Campaigns** (`/my-game/campaigns`), **Campaign Events** (`/my-game/campaign-events`), **Incursions** (`/my-game/incursions`) and **Teams** (`/my-game/teams`). Collection SHALL be the section's default child: on desktop, the first activation of My Game in a session lands on `/my-game/collection`, after which the existing last-visited-child rule applies; `/my-game` itself SHALL resolve to `/my-game/collection`. The old `/progress`, `/progress/onslaught`, `/progress/campaigns` and `/progress/campaign-events` routes SHALL NOT exist and SHALL NOT redirect; they fall through to the app's existing not-found handling. Every in-app link that pointed to a `/progress/*` route SHALL point to its `/my-game/*` equivalent. The section and each child SHALL carry localized labels and descriptions in every supported locale, be indexed by navigation search, and follow the existing header, breadcrumb, document-title and section-menu rules for a section with children. The general navigation tour SHALL refer to My Game, not Progress, on desktop and mobile.

#### Scenario: Desktop first entry lands on Collection

- **GIVEN** a signed-in desktop user who has not visited My Game in this session
- **WHEN** they activate My Game in the sidebar
- **THEN** they land on `/my-game/collection`, and the section menu lists Collection, Onslaught, Campaigns, Campaign Events, Incursions and Teams in that order

#### Scenario: Desktop returns to the last-visited child

- **GIVEN** a signed-in desktop user last visited `/my-game/campaigns` in this session
- **WHEN** they activate My Game in the sidebar again
- **THEN** they land on `/my-game/campaigns`

#### Scenario: Mobile drawer and tab row

- **GIVEN** a signed-in mobile user
- **WHEN** they open the Menu drawer, or open any My Game page
- **THEN** the drawer lists My Game with Collection, Onslaught, Campaigns, Campaign Events, Incursions and Teams nested beneath it, and a My Game page's header tab row shows those six children

#### Scenario: Old Progress routes are gone

- **WHEN** a signed-in user opens `/progress/onslaught`, `/progress/campaigns`, `/progress/campaign-events` or `/progress`
- **THEN** no My Game page renders and the app's existing not-found handling applies

#### Scenario: Search finds My Game pages

- **WHEN** a signed-in user types "collection", "onslaught" or "teams" into navigation search
- **THEN** the matching child appears under My Game and selecting it opens its `/my-game/*` route

### Requirement: A section can mix anonymous and sign-in-only children

A navigation child SHALL be able to require sign-in independently of its section. For an anonymous user, a section that allows anonymous access SHALL list only its children that allow anonymous access, everywhere children are listed: the desktop section menu, the mobile header tab row, the mobile menu drawer and navigation search. The section's desktop entry point and default-child resolution SHALL only resolve to a child the current user can see. Opening a sign-in-only child's route while signed out SHALL follow the same sign-in handling as any other sign-in-only route. For My Game, Collection SHALL allow anonymous access and Onslaught, Campaigns, Campaign Events, Incursions and Teams SHALL require sign-in, so the My Game section itself SHALL be shown to anonymous users with Collection as its only child. Signing in or out SHALL update which children are listed without a page reload.

#### Scenario: Anonymous user sees My Game with only Collection

- **GIVEN** the user is not signed in
- **WHEN** they view the desktop sidebar, the desktop section menu for My Game, or the mobile Menu drawer
- **THEN** My Game is listed and Collection is its only child; Onslaught, Campaigns, Campaign Events, Incursions and Teams are not listed

#### Scenario: Anonymous search excludes sign-in-only children

- **GIVEN** the user is not signed in
- **WHEN** they type "onslaught" or "teams" into navigation search
- **THEN** no sign-in-only My Game entry is offered, while typing "collection" offers My Game Collection

#### Scenario: Anonymous desktop entry resolves to a visible child

- **GIVEN** an anonymous desktop user
- **WHEN** they activate My Game in the sidebar
- **THEN** they land on `/my-game/collection`

#### Scenario: Anonymous user opens a sign-in-only child directly

- **GIVEN** the user is not signed in
- **WHEN** they open `/my-game/onslaught` or `/my-game/teams` from a bookmark
- **THEN** the app applies its existing sign-in handling for sign-in-only routes and does not render that page

#### Scenario: Mobile tab row for an anonymous user

- **GIVEN** an anonymous mobile user on `/my-game/collection`
- **WHEN** the header renders
- **THEN** the tab row shows only Collection

#### Scenario: Signing in reveals the remaining children

- **GIVEN** an anonymous user on `/my-game/collection`
- **WHEN** they sign in
- **THEN** My Game lists Collection, Onslaught, Campaigns, Campaign Events, Incursions and Teams without a page reload
