# Spec Delta

## ADDED Requirements

### Requirement: The landing page appears whole

The landing route SHALL show the boot screen until the landing page's translations have loaded, and only then render the public top bar, the page and the footer together. It SHALL NOT show the public chrome around an empty loading area.

#### Scenario: First visit to the landing page

- **WHEN** a visitor opens `/` and the landing translations are still downloading
- **THEN** the boot screen is shown, followed by the complete landing page

### Requirement: The boot screen continues the splash

The boot screen's logo SHALL be the size of the Android splash icon (208 CSS pixels) and sit at the centre of the viewport, with the pulse and any message placed below it so they do not move it. The static copy in `index.html` SHALL match.

#### Scenario: Splash hands over to the boot screen

- **WHEN** the installed app's splash gives way to the boot screen
- **THEN** the logo keeps its size and position
