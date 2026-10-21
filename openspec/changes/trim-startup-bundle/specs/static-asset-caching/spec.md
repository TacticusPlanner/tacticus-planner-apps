# Spec Delta

## Purpose

Defines how long the browser may reuse locale files and game-catalog images without asking the server, and how a new deploy or a changed asset still reaches every client.

## ADDED Requirements

### Requirement: Locale files are cached immutably per build

Locale files SHALL be requested under a URL that changes with every deployed build and SHALL be served with a long-lived, immutable cache policy. A client that already holds a locale file for the current build SHALL NOT revalidate it on later loads.

#### Scenario: Repeat visit on the same build

- **WHEN** a user who loaded the app earlier on the current build opens it again
- **THEN** every locale file already in the browser cache is reused without a request to the server

#### Scenario: New deploy changes a translation

- **WHEN** a deploy ships a changed locale file
- **THEN** the next load requests the new file under its new URL and shows the updated translation, without the user clearing the cache

### Requirement: Game-catalog images are cached immutably per asset version

Game-catalog images SHALL be requested under a URL carrying an asset version that changes whenever any file under the catalog image folder changes, and SHALL be served with a long-lived, immutable cache policy.

#### Scenario: Catalog version bump replaces a portrait

- **WHEN** a deploy changes or adds catalog images
- **THEN** every catalog image URL carries a new asset version and the browser fetches the changed files on the next load

#### Scenario: Deploy without image changes

- **WHEN** a deploy changes application code but no catalog image
- **THEN** the asset version is unchanged and cached images are reused without any request

### Requirement: Image elements declare their rendered size

An image whose box is not fixed by its surrounding layout SHALL declare its width and height so that loading it does not shift content.

#### Scenario: Portrait grid loads progressively

- **WHEN** a grid of portraits renders before its images have downloaded
- **THEN** each tile already occupies its final size and no layout shift is measured when the images arrive
