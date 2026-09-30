## Purpose

Defines a coherent visual hierarchy for shared surfaces and controls in the Planner's light and dark themes, preserving readability and meaningful state cues across desktop and mobile.

## ADDED Requirements

### Requirement: Each theme provides a coherent canvas and raised-surface hierarchy

Both themes SHALL distinguish page canvas, content cards, navigation, and overlays according to their roles without requiring Azure colors. Dark cards SHALL have greater rendered luminance than the surrounding dark canvas; dark overlays SHALL be at least as light as cards and remain visibly bounded. Light cards SHALL retain a white or near-white raised surface over a darker off-white canvas. Light overlays on light cards SHALL remain distinguishable through an edge or elevation treatment. Decorative surface boundaries SHALL not be confused with text/control contrast requirements.

#### Scenario: Dark content cards are raised

- **WHEN** Home widgets or Schedule day cards are displayed in dark mode
- **THEN** cards are lighter than the page canvas, with visible content grouping and readable text

#### Scenario: Light content cards retain useful separation

- **WHEN** Home widgets or Schedule day cards are displayed in light mode
- **THEN** cards remain white or near-white against the darker off-white canvas rather than becoming dark recessed panels

#### Scenario: Overlay over a card

- **WHEN** search, an account menu, or a creation form opens over card content in either theme
- **THEN** its bounds and foreground content remain distinguishable from the underlying card

### Requirement: Shell surfaces communicate navigation and page context

On desktop, the global bar, main navigation, section navigation, and page heading SHALL form a coordinated hierarchy. Navigation SHALL be distinguishable from content through tonal separation or a visible divider. The page heading SHALL visually continue the page canvas instead of repeating a strongly contrasting navigation band. On mobile, the header and bottom navigation SHALL remain distinguishable from content while using the same theme family. These visual changes SHALL preserve navigation behavior and layout.

#### Scenario: Desktop light shell

- **WHEN** a light-theme desktop page with section navigation is viewed
- **THEN** navigation regions remain identifiable, cards retain prominence, and page title/description visually belong to page content

#### Scenario: Desktop dark shell

- **WHEN** a dark-theme desktop page with section navigation is viewed
- **THEN** navigation integrates with the canvas/card hierarchy and the page heading does not duplicate a near-black sidebar band

#### Scenario: Mobile shell

- **WHEN** a user views the mobile header, bottom bar, and a content card in either theme
- **THEN** controls remain identifiable and surfaces preserve their roles without adding desktop navigation structure

### Requirement: Shared text and controls remain readable across surface states

Normal text in shared shell, card, input, menu, and overlay surfaces SHALL meet 4.5:1 contrast against its actual rendered background in both themes. Meaningful enabled control boundaries, icons, and focus/state indicators SHALL meet 3:1 against their relevant adjacent colors. Measurements SHALL account for transparency and underlying surfaces. Hover, selected, keyboard focus, and disabled presentation SHALL be distinguishable; selected navigation SHALL include a non-hue cue. These targets SHALL not impose a numeric contrast requirement on purely decorative card/canvas separation. Existing goal-specific accessibility rules SHALL remain satisfied.

#### Scenario: Muted text on different surfaces

- **WHEN** descriptions, placeholders, or secondary labels appear on canvas, cards, and overlays in either theme
- **THEN** their rendered text/background combinations meet the text target

#### Scenario: Transparent input backgrounds

- **WHEN** an enabled input appears on a card or overlay
- **THEN** its boundary/affordance and text remain distinguishable and meet their applicable targets after compositing

#### Scenario: Keyboard focus and selected navigation

- **WHEN** a selected navigation item is hovered and then keyboard-focused
- **THEN** selection remains identifiable independently of hover, and focus is visibly distinct on that surface

#### Scenario: Existing semantic states

- **WHEN** a goal status, progress cue, rarity/rank indicator, or project color is displayed against a revised surface
- **THEN** its meaning is preserved, associated text remains readable, and existing non-color state cues remain available

### Requirement: Theme changes preserve preferences and cross-platform consistency

Light, Dark, and System selection, persisted preferences, and response to system-theme changes SHALL continue to work. Shared surface roles SHALL update together without leaving a mixture of light and dark foreground/background pairs. The palette change SHALL not alter route state, form values, or navigation expansion choices.

#### Scenario: Switching with a form open

- **WHEN** a user changes theme while a form or popover is open
- **THEN** all surfaces and text update coherently and entered values remain intact

#### Scenario: Persisted and system themes

- **WHEN** the app reloads with an explicit theme preference or the system changes while System is selected
- **THEN** the existing preference behavior applies the matching coherent palette on desktop and mobile
