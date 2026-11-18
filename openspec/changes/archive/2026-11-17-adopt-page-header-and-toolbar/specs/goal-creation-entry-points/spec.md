## MODIFIED Requirements

### Requirement: Goals offers a contextual Create Goal entry point

At or above the 768px breakpoint the Goals page (`/plan/goals`) SHALL render a filled, labelled Create Goal action in its page toolbar's Actions slot, in addition to the app's existing global entry points (the desktop sidebar button, the mobile bottom-nav button, and the keyboard shortcut). Below 768px the toolbar SHALL NOT repeat it: the bottom navigation's Add goal button is the page's create action there, and it SHALL preselect the scoped project the same way. The action SHALL be visible without hovering, focusing, or opening another control, and SHALL open the same creation sheet the global entry points open — with no prefill while "All goals" is selected, and with the scoped project preselected while a project scope is selected.

#### Scenario: Desktop Goals shows the contextual entry point

- **WHEN** Goals is viewed at or above the 768px breakpoint
- **THEN** a labeled Create Goal action is visible at the far right of the toolbar

#### Scenario: Mobile Goals uses the bottom navigation entry point

- **GIVEN** a project scope is selected
- **WHEN** Goals is viewed below the 768px breakpoint and the user taps the bottom navigation's Add goal button
- **THEN** the toolbar shows no Create Goal action, and the goal-creation sheet opens with the scoped project preselected

#### Scenario: Activating the contextual entry point opens creation

- **GIVEN** "All goals" is selected
- **WHEN** the user activates Goals' Create Goal action
- **THEN** the goal-creation sheet opens with no entity or goal type preselected and no explicit project prefill

#### Scenario: Global entry points remain available

- **GIVEN** the contextual Create Goal action is present on Goals
- **WHEN** the user checks the app shell
- **THEN** the global entry points (sidebar button on desktop, bottom-nav button on mobile, and the keyboard shortcut) are still present and functional
