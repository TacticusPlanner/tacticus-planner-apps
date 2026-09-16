## ADDED Requirements

### Requirement: Declared events are drawn from fixed enumerations

Every event the client reports SHALL be one of a fixed set of declared event kinds, and every label that distinguishes one occurrence of an event from another — the action performed, the navigation item chosen, the preference changed — SHALL be drawn from a fixed enumeration declared alongside the event. A label SHALL NOT be assembled at a call site from a component name, a route value, a translation string, or any other value that can vary without being declared.

#### Scenario: An event is reported

- **WHEN** the client reports any event
- **THEN** its kind and every distinguishing label it carries come from the declared enumerations

#### Scenario: A label cannot be improvised

- **WHEN** a new call site needs to report an action, navigation selection, or preference change that has no declared label
- **THEN** the label must be added to the declared enumeration before it can be reported, and no free-form value is accepted in its place

### Requirement: Deliberate user actions are reported as declared actions

While a user is identified, the client SHALL report an `action` event when the user performs one of the deliberate, declared actions the product measures. The event SHALL carry the declared action identifier, and MAY carry one qualifier describing how the action was performed, itself drawn from a declared enumeration. It SHALL NOT carry the outcome of the action, any value the user entered, or any identifier of the object acted upon.

The actions reported SHALL cover, at minimum: choosing a path in the onboarding dialog, opening the V1 import dialog, requesting a manual player data sync, opening the goal creation surface, opening the project creation surface, opening the navigation search, and a navigation search that ends without any match.

#### Scenario: The user opens the goal creation surface

- **WHEN** an identified user opens the goal creation surface
- **THEN** one `action` event is reported carrying the declared identifier for that action

#### Scenario: How an action was performed

- **WHEN** an identified user performs a declared action that can be reached more than one way
- **THEN** the reported event carries a qualifier identifying which way was used, drawn from the declared enumeration for that action

#### Scenario: Outcome is not reported

- **WHEN** an identified user performs a declared action that then succeeds or fails
- **THEN** the reported `action` event carries no success, failure, or error information, and the outcome is left to the server-reported event for that operation

#### Scenario: The user abandons after acting

- **WHEN** an identified user performs a declared action and then leaves without completing the operation
- **THEN** the `action` event has already been reported, and no further event is reported for the abandonment

#### Scenario: Entered values are never reported

- **WHEN** an identified user performs a declared action on a surface containing their own input
- **THEN** the reported event carries no entered value, object identifier, or user-authored text

### Requirement: Navigation selections are reported with the surface used

While a user is identified, the client SHALL report a `menu_item_select` event when the user chooses an item from any application navigation surface. The event SHALL carry the declared identifier of the chosen item and which navigation surface it was chosen from, so that a destination reached from navigation is distinguishable from one reached by any other means. Every navigation surface the product offers SHALL be represented in the declared set of surfaces, and each SHALL be distinguishable from the others.

#### Scenario: An item is chosen from navigation

- **WHEN** an identified user chooses a navigation item
- **THEN** a `menu_item_select` event is reported carrying the item's declared identifier and the navigation surface used

#### Scenario: The same destination reached without navigation

- **WHEN** an identified user reaches the same destination by a direct link, a redirect, or browser history rather than by choosing a navigation item
- **THEN** no `menu_item_select` event is reported, while the page view for the destination is reported as usual

#### Scenario: Desktop, mobile, and search navigation are distinguishable

- **WHEN** an identified user chooses a navigation item from the mobile navigation, the desktop navigation, or the navigation search
- **THEN** the reported surface distinguishes all three

#### Scenario: A child item chosen from navigation

- **WHEN** an identified user chooses a nested child item rather than a top-level item
- **THEN** the reported item identifier is the child's own declared identifier, not its parent's

### Requirement: Navigation search reports whether searching was used and whether it succeeded

While a user is identified, the client SHALL report the navigation search as a declared action when it is opened, qualified by whether it was opened by its keyboard shortcut or by its on-screen control. When a navigation selection is made from the search surface, the reported selection SHALL indicate whether the user had narrowed the list by typing or had chosen from the unfiltered list.

The client SHALL report a declared action when a navigation search session ends with a non-empty query that matched nothing, at most once per opening of the search, so that a failed search is counted once rather than once per keystroke. The client SHALL NOT report the text the user typed, nor any value derived from it.

#### Scenario: Opened by keyboard shortcut

- **WHEN** an identified user opens the navigation search using its keyboard shortcut
- **THEN** an `action` event is reported for opening the navigation search, qualified as opened by shortcut

#### Scenario: Opened by the on-screen control

- **WHEN** an identified user opens the navigation search by its on-screen control
- **THEN** an `action` event is reported for opening the navigation search, qualified as opened by that control rather than by shortcut

#### Scenario: A destination is chosen after typing

- **WHEN** an identified user types a query in the navigation search and then chooses one of the matching items
- **THEN** the reported `menu_item_select` event carries the search surface and indicates that the selection followed a typed query

#### Scenario: The search dialog is used without typing

- **WHEN** an identified user opens the navigation search and chooses an item without typing anything
- **THEN** the reported `menu_item_select` event carries the search surface and indicates that no query was typed

#### Scenario: A search that matches nothing

- **WHEN** an identified user types a query that matches no navigation item and closes the search without choosing anything
- **THEN** exactly one `action` event is reported for the failed search, regardless of how many characters were typed

#### Scenario: The typed text is never reported

- **WHEN** any event is reported for a navigation search
- **THEN** it carries no typed text, no fragment of it, and no value derived from its content

#### Scenario: The search is opened and abandoned without a query

- **WHEN** an identified user opens the navigation search and closes it without typing
- **THEN** the opening is reported and no failed-search event is reported

### Requirement: A deliberate language change is reported

While a user is identified, the client SHALL report a `preference` event when the user deliberately changes the application language, carrying the language being left and the language being chosen. The client SHALL NOT report an event for the language it selected automatically, and SHALL NOT report an event for a change to any other preference.

#### Scenario: The user switches language

- **WHEN** an identified user changes the application language
- **THEN** a `preference` event is reported identifying the language setting, the previous language, and the newly chosen language

#### Scenario: Automatic language selection

- **WHEN** the application selects a language automatically from the user's browser or a stored earlier choice
- **THEN** no `preference` event is reported

#### Scenario: Other preferences do not report

- **WHEN** an identified user changes the theme or any other preference
- **THEN** no `preference` event is reported for it

### Requirement: Standing user context is attached to every event

While a user is identified, the client SHALL attach the user's current theme, language, view mode, and installation form — whether the app is running in a browser or as an installed application — to every event it reports, rather than reporting a separate event when any of them is set or changed. These values SHALL be limited to the fixed set of values each setting can take.

#### Scenario: Context accompanies an event

- **WHEN** an identified user's activity causes any event to be reported
- **THEN** that event carries the current theme, language, view mode, and installation form

#### Scenario: Setting a preference reports nothing on its own

- **WHEN** an identified user changes their theme
- **THEN** no event is reported for the change itself, and subsequent events carry the new value

#### Scenario: Context values are enumerated

- **WHEN** the standing context is attached to an event
- **THEN** each value is one of the fixed values that setting can take, and no free-form or user-authored value is included

### Requirement: New events do not weaken the capture floor

The events added by this capability SHALL be reported only under the conditions already required of every client event: only while the user is identified, never for an anonymous or signed-out visitor, never retroactively for activity before identification, and never when no analytics destination is configured.

#### Scenario: A signed-out visitor acts

- **WHEN** a visitor who is not signed in performs an action, chooses a navigation item, or changes language
- **THEN** no event is reported for any of it

#### Scenario: Activity before identification

- **WHEN** a user performs declared actions and then signs in
- **THEN** only activity from the point of identification onward is reported, and the earlier actions are not sent retroactively

#### Scenario: Running without analytics configuration

- **WHEN** the app runs with no analytics destination configured and a user performs a declared action
- **THEN** the app behaves normally and no outbound analytics request is attempted
