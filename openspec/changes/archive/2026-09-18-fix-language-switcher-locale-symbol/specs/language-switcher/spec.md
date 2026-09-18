## Purpose

Defines how the app shows which UI language is currently active and how the user
switches between the supported languages, so the control reads the same on every
operating system and announces its current value to assistive technology.

## ADDED Requirements

### Requirement: Collapsed control identifies the active language as text

The language switcher's collapsed control SHALL identify the active language
using the uppercased two-letter locale code as text (`EN`, `FR`, `DE`, `ES`). It
SHALL NOT rely on a flag emoji, a country symbol, or any other glyph whose
availability depends on the operating system's installed fonts.

Assumption: every supported language is addressed by a region-free two-letter
code — English, French, German, and Spanish today. This requirement does not
cover a region-qualified locale such as `pt-BR`: resolving the active language
currently truncates a code at its first hyphen, so such a locale must be made to
resolve correctly before it can be offered here.

#### Scenario: Active language shown on a platform without flag-emoji glyphs

- **WHEN** a user whose UI language is English opens the app on an operating
  system that renders no flag-emoji glyphs
- **THEN** the collapsed language control reads `EN`
- **AND** it does not read `GB`, `US`, or any other country code

#### Scenario: Control reads identically across operating systems

- **WHEN** the same user opens the app with the same UI language on two different
  operating systems
- **THEN** the collapsed language control shows the same text on both

#### Scenario: Switching language updates the collapsed control

- **WHEN** the user selects French from the language switcher
- **THEN** the app's UI language changes to French
- **AND** the collapsed language control reads `FR`

### Requirement: Active language is exposed to assistive technology

The language switcher SHALL expose both its purpose and its current value to
assistive technology: the control is identified as the language selector, and its
announced value names the active language. The current value SHALL NOT be hidden
from assistive technology.

#### Scenario: Screen reader announces the selected language

- **WHEN** a screen reader user moves focus to the language switcher while the UI
  language is Spanish
- **THEN** the control is announced as the language selector
- **AND** its announced value is the native language name `Español`, not an empty
  value and not the bare code `ES`

### Requirement: Options are labelled by native language name

When the language switcher is open, each option SHALL be labelled with that
language's own native name (`English`, `Français`, `Deutsch`, `Español`),
presented alongside its locale code. A language's native name SHALL be identical
in every UI language — native names are never translated — so a user who cannot
read the current UI language can still find their own.

#### Scenario: Option list read while the UI is in a foreign language

- **WHEN** a user whose UI language is German opens the language switcher
- **THEN** the options are listed as `English`, `Français`, `Deutsch`, and
  `Español`
- **AND** each option also shows its locale code
- **AND** the currently active option is indicated as selected

### Requirement: The active language is identified consistently on every surface

The language switcher SHALL identify the same active language, by the same locale
code, in every place it is mounted — the desktop header, the mobile guest
settings popover, and the signed-in account drawer — and SHALL offer the same
options in the same order. A surface with room to spare MAY additionally show the
active language's native name next to its code; no surface may show a different
code, a different option set, or no identification at all.

#### Scenario: Same language identified from desktop and mobile

- **WHEN** the same user with the same UI language opens the switcher from the
  desktop header and from a mobile surface
- **THEN** both identify the active language by the same locale code
- **AND** both offer the same options in the same order

#### Scenario: Full-width control on a roomy surface

- **WHEN** the switcher is shown full-width in the signed-in account drawer
- **THEN** it identifies the active language by its code and its native name
- **AND** the code shown matches the one shown by the compact desktop control
