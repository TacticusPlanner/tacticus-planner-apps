## MODIFIED Requirements

### Requirement: Users choose between a Cards view and a Table view, Cards by default

The Goals toolbar SHALL contain a two-option Layout control (Cards, Table) at every width: the shared labelled segmented control in the page toolbar's View slot (`goals-navigation`), behind the View button below the mobile breakpoint. It SHALL be labelled "Layout" and be exposed as a radio group with the selected layout checked. Selecting an option SHALL switch the Goals list between the cards and the table at once, without reloading goals or estimates, and SHALL keep the current filters, Group, project scope, season-fit mode, selection and scroll context.

The choice SHALL be stored per device, in browser storage, so a player can keep Cards on a phone and Table on a desktop. It SHALL NOT be stored in the URL or in the account's user settings, and SHALL NOT follow the account to another browser. The default SHALL be `Cards`. The client SHALL treat a missing or unrecognized stored value as `Cards`. When the browser refuses the write, the choice SHALL still apply for the rest of the visit (`browser-storage-resilience`).

The stored view SHALL be read synchronously, so the list SHALL NOT wait for it and a stored `Table` choice SHALL never flash as cards.

#### Scenario: A device with no stored view sees cards

- **GIVEN** a browser that has never stored a Goals view
- **WHEN** the Goals page opens at 1280px or 420px wide
- **THEN** the list renders as cards and the Layout control shows Cards as checked

#### Scenario: Switching to Table persists on this device

- **GIVEN** the Goals page in Cards view
- **WHEN** the user selects Table
- **THEN** the table renders at once, and after a reload the Goals page opens in Table view

#### Scenario: Each device keeps its own view

- **GIVEN** an account that selected Table on a desktop browser
- **WHEN** it opens the Goals page on a phone where it never chose a view
- **THEN** the phone shows cards, and the desktop still opens in Table view

#### Scenario: Browser storage is blocked

- **GIVEN** a browser that refuses the storage write
- **WHEN** the user selects Table
- **THEN** the table renders and stays for the rest of the visit, and no error is shown

#### Scenario: Reorder mode on a phone leaves the table

- **GIVEN** the Goals page below the mobile breakpoint in Table view
- **WHEN** the user turns reorder mode on
- **THEN** the list shows the collapsed reorder cards with the Layout control disabled, and leaving reorder mode returns to the table
