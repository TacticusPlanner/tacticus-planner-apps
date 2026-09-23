## Purpose

Defines the reusable slider's interaction target and input behavior so settings and progress controls remain usable with touch, pointer, and keyboard input.

## ADDED Requirements

### Requirement: Usable hit target without visual enlargement

The shared slider SHALL provide a comfortably tappable and draggable target around its visible track and thumb while preserving the existing visual track and thumb scale.

#### Scenario: Touch near the horizontal track

- **WHEN** a user taps or drags in the enlarged target adjacent to the visible horizontal track
- **THEN** the slider selects or updates the corresponding value within its configured range and step

#### Scenario: Adjacent controls

- **WHEN** a user interacts with a neighboring control outside the slider's target
- **THEN** the slider value remains unchanged

### Requirement: Preserve non-touch behavior

The shared slider SHALL continue to honor its configured minimum, maximum, step, disabled state, focus indication, and keyboard value changes.

#### Scenario: Keyboard adjustment

- **WHEN** a focused, enabled slider receives an applicable arrow-key input
- **THEN** its value changes by its configured step and its accessible value reflects the change

#### Scenario: Disabled slider

- **WHEN** a disabled slider is tapped, dragged, or given keyboard input
- **THEN** its value does not change

#### Scenario: Vertical orientation

- **WHEN** a vertical slider is rendered
- **THEN** its enlarged target follows the vertical track without changing its value direction or visible scale
