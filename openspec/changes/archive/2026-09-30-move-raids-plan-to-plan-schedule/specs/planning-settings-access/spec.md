## MODIFIED Requirements

### Requirement: Raids exposes shared Planning Settings

Dailies > Raids (the Today page) SHALL provide a visible Planning Settings action at mobile and desktop widths, placed in the same row as the project selector (trailing, after the project selector; icon-only on mobile with an accessible name, icon plus label on desktop). Plan > Schedule SHALL provide the same action in the same position relative to its own project selector. Activating either SHALL open the same configuration available from Plan > Goals (`/plan/goals`). Saving from any surface SHALL update one persisted setting and affect subsequent raids and broader plan estimates.

#### Scenario: Today and Raids Plan entry

- **WHEN** a user visits Dailies > Raids or Plan > Schedule at either breakpoint
- **THEN** a keyboard-operable, accessibly named Planning Settings action is present without leaving that section

#### Scenario: One setting across surfaces

- **WHEN** a user changes daily energy from Raids or Schedule and later opens Planning Settings on Plan > Goals
- **THEN** the saved value is shown there and both raids and broader estimates use it
