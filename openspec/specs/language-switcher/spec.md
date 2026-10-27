# language-switcher Specification

## Purpose

Defines how the app shows which UI language is currently active and how the user
switches between the supported languages, so the control reads the same on every
operating system and announces its current value to assistive technology.

## Requirements

### Requirement: The Language row identifies the active language as text

The language control SHALL be the Language row of the account menu's Preferences
section, and SHALL identify the active language by its native name as text
(`English`, `Français`, `Deutsch`, `Español`). It SHALL NOT rely on a flag emoji,
a country symbol, or any other glyph whose availability depends on the operating
system's installed fonts. Activating the row SHALL open the language picker in
place.

Assumption: every supported language is addressed by a region-free two-letter
code — English, French, German, and Spanish today. A region-qualified locale such
as `pt-BR` is not covered: resolving the active language truncates a code at its
first hyphen, so such a locale must be made to resolve correctly before it can be
offered here.

#### Scenario: Active language shown on a platform without flag-emoji glyphs

- **WHEN** a user whose UI language is English opens the account menu on an
  operating system that renders no flag-emoji glyphs
- **THEN** the Language row reads `English`
- **AND** it shows no flag or country code

#### Scenario: Switching language updates the row

- **WHEN** the user selects `Français` in the language picker
- **THEN** the app's UI language changes to French
- **AND** the picker returns to the Preferences view, where the Language row reads `Français`

### Requirement: Active language is exposed to assistive technology

The Language row SHALL expose both its purpose and its current value to assistive
technology: its accessible name names the language control and the active
language. The picker SHALL be a radio group labelled as the language selector, in
which the active language is the checked option.

#### Scenario: Screen reader announces the selected language

- **WHEN** a screen reader user opens the language picker while the UI language
  is Spanish
- **THEN** the picker is announced as the language selector
- **AND** `Español` is announced as the checked option

### Requirement: Options are labelled by native language name

The picker SHALL list each supported language by its own native name (`English`,
`Français`, `Deutsch`, `Español`), in that order. A language's native name SHALL
be identical in every UI language — native names are never translated — so a
user who cannot read the current UI language can still find their own.

#### Scenario: Option list read while the UI is in a foreign language

- **WHEN** a user whose UI language is German opens the language picker
- **THEN** the options are listed as `English`, `Français`, `Deutsch`, and
  `Español`
- **AND** the currently active option is indicated as selected

### Requirement: The active language is identified consistently on every surface

The same Language row and picker SHALL appear on every surface that offers
language choice: the signed-in account card (desktop popover and mobile drawer),
the signed-out desktop guest menu, and the mobile guest settings popover. Each
SHALL identify the same active language by the same native name and offer the
same options in the same order. There is no other language control.

#### Scenario: Same language identified from desktop and mobile

- **WHEN** the same user with the same UI language opens the Language row on
  desktop and on mobile
- **THEN** both show the same native name
- **AND** both pickers offer the same options in the same order
