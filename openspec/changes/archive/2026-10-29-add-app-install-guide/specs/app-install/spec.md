# Spec Delta

## Purpose

Defines how the web app presents itself to the browser for installation and how it offers and explains installing.

## ADDED Requirements

### Requirement: The manifest describes an installable app

`site.webmanifest` SHALL declare `start_url` `/home` and `scope` `/`, keep `id` `tacticusplannerv2` so existing installs stay the same app, and list 192 and 512 pixel icons both as `any` (the transparent logo) and as `maskable` (the logo inside the central 80% safe zone on the same navy background). Its theme colour SHALL be the light top bar colour and its background colour the deep navy of the landing hero's night sky (`#0B1222`), which the maskable and shortcut icons share, so the splash screen runs into the landing page without a visible icon edge.

#### Scenario: Launching the installed app

- **WHEN** a user opens the installed app
- **THEN** it starts at `/home`, which sends a signed-out user to the landing page

#### Scenario: Android adaptive icon

- **WHEN** Android masks the app icon to its launcher shape
- **THEN** the whole logo stays visible on a solid background

### Requirement: The installed app offers shortcuts

The manifest SHALL declare shortcuts to Daily raids (`/dailies/raids`), Goals (`/plan/goals`) and Legendary events (`/legendary-events`), in that order, each with an icon usable both plain and maskable (`any maskable`), so Android fills its shortcut circle with it and desktop jump lists still show it. The install guide's shortcut list SHALL match them.

#### Scenario: Long-press on the app icon

- **WHEN** a user long-presses the installed app's icon (right-clicks it on desktop)
- **THEN** Daily raids, Goals and Legendary events are offered

### Requirement: The browser chrome follows the theme

The page SHALL carry `<meta name="theme-color">` set to the resolved theme's top bar colour before first paint, so the installed app's status bar continues the header,, and SHALL update it whenever the resolved theme changes.

#### Scenario: Switching to dark

- **WHEN** a user switches the theme to dark
- **THEN** the theme-color meta changes to the dark top bar colour

### Requirement: Home offers installing

The app SHALL hold the browser's install prompt from startup and suppress the browser's own mini-infobar. Home SHALL show an install card when the app is not running installed, the card was not dismissed on this device, and either the browser offered its prompt or the browser has no prompt (iOS, Safari on macOS). Install SHALL open the browser's prompt; where there is none, Show me how SHALL open the install guide. Not now SHALL hide the card on this device for good. When the browser reports the app installed during the visit, the card SHALL show the shortcuts tip instead until dismissed.

#### Scenario: Chrome on Android

- **WHEN** Chrome offers its install prompt and the user taps Install on the Home card
- **THEN** the browser's install prompt opens

#### Scenario: iPhone

- **WHEN** a user on an iPhone opens Home
- **THEN** the card offers Show me how, which opens the Add to Home Screen steps

#### Scenario: Already installed

- **WHEN** the app runs installed, or a desktop Chromium browser offers no prompt
- **THEN** no install card shows

### Requirement: The account menu opens the install guide

The signed-in account menu SHALL show Install app unless the app runs installed or the browser cannot install web apps. It SHALL open the install guide: Install where the browser offers its prompt, otherwise the manual steps for iOS, Safari on macOS, Android or desktop Chromium, followed by the shortcuts the installed icon offers. Where a Chromium browser offers no prompt, the guide SHALL say the app is probably installed already.

#### Scenario: Desktop Edge after installing

- **WHEN** a user opens Install app in a desktop browser tab that offers no prompt
- **THEN** the guide shows the desktop steps, the note that the app is probably installed, and the shortcuts
