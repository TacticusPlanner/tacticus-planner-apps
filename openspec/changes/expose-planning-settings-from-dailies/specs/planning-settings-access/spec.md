## Purpose

Makes the same persisted Planning Settings available where users review their goals and execute daily raids, without creating separate settings values.

## ADDED Requirements

### Requirement: Raids exposes shared Planning Settings

Dailies > Raids SHALL provide a visible Planning Settings action on both Today and Raids Plan at mobile and desktop widths. Activating it SHALL open the same configuration available from Plan > All Goals/Overview. Saving from either surface SHALL update one persisted setting and affect subsequent raids and broader plan estimates.

#### Scenario: Today and Raids Plan entry

- **WHEN** a user visits either Raids sub-tab at either breakpoint
- **THEN** a keyboard-operable, accessibly named Planning Settings action is present without leaving Dailies

#### Scenario: One setting across surfaces

- **WHEN** a user changes daily energy from Raids and later opens Planning Settings on Plan Overview
- **THEN** the saved value is shown there and both raids and broader estimates use it

### Requirement: Setting copy describes its scope

The Planning Settings dialog SHALL explain that the configured daily energy affects both daily raid planning and broader goal estimates, not only the current page.

#### Scenario: Opened from Raids

- **WHEN** the dialog opens from Dailies > Raids
- **THEN** its description accurately names the setting's cross-surface effect and does not imply a Raids-only override
