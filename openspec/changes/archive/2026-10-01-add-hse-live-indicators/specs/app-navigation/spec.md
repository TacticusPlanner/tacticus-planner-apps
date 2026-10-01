## ADDED Requirements

### Requirement: Navigation shows a live indicator for an active Home Screen Event

While any Home Screen Event is active (any HSE, not only those with raid-point rules), the HSE navigation entry SHALL show a live indicator in every navigation renderer: the desktop side menu, the section tabs (mobile tabs), the mobile menu drawer and the desktop navigation dialog. The parent Dailies entry SHALL also show it, so it is visible with the menu collapsed and in the mobile bottom bar. With no active HSE no indicator is shown. The indicator SHALL NOT rely on colour alone: it carries a localized "event live" accessible name that assistive technology announces with the entry, and its pulse animation SHALL be disabled under `prefers-reduced-motion`. Activity is decided in UTC and updates without a reload when an event starts or ends. Search results do not show the indicator.

Assumptions:

- "Active" is the same single active HSE the HSE tab uses; loading and calendar errors show no indicator (never a false positive).

#### Scenario: Active event marks HSE and Dailies on desktop

- **GIVEN** an HSE is active
- **WHEN** the desktop shell renders with the side menu expanded, and again with it collapsed
- **THEN** the HSE entry (in the section menu and navigation dialog) and the Dailies entry each show the indicator with the accessible text "event live"

#### Scenario: Active event marks tabs and drawer on mobile

- **GIVEN** an HSE is active
- **WHEN** the mobile shell renders
- **THEN** the HSE tab in the section tab row, the HSE entry in the menu drawer, and the Dailies bottom-bar entry show the indicator with the accessible text

#### Scenario: Non-rule event still shows it

- **GIVEN** the active HSE has no raid-point rule (for example Faction Boost)
- **THEN** the indicator is shown

#### Scenario: No active event

- **GIVEN** no HSE is active, or the calendar is loading or failed
- **THEN** no indicator is shown anywhere

#### Scenario: Reduced motion

- **GIVEN** the user prefers reduced motion
- **THEN** the indicator is shown without a pulse animation
