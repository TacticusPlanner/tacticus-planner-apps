# browser-storage-resilience Specification

## Purpose

Guarantees that the app boots and keeps working when the browser blocks or throws on site storage, degrading every persisted preference to its in-memory default instead of failing.

## Requirements

### Requirement: Blocked browser storage does not prevent boot

When reading or writing browser local storage throws (storage blocked, private mode, quota exceeded), the app SHALL still render normally. Theme, tour auto-start and every other persisted preference SHALL fall back to their default values for the session.

#### Scenario: Storage blocked at first load

- **GIVEN** a browser configured to block site data
- **WHEN** the user opens the app
- **THEN** the app renders with the system theme and default preferences, and no error page or console exception is produced by the storage access

#### Scenario: Storage write fails after boot

- **WHEN** the user changes the theme and the storage write throws
- **THEN** the theme changes for the current session and no error is shown

### Requirement: Persisted preferences use one storage path

Every persisted client preference SHALL be read and written through the same guarded storage path, so a storage failure is handled identically everywhere and a preference changed in one place is observed by every reader in the same page.

#### Scenario: Preference changed in one component

- **WHEN** a preference persisted to storage is changed by one component
- **THEN** every other mounted reader of that preference reflects the new value without a reload

### Requirement: Orphaned preference keys are not read or written

The app SHALL NOT read or write storage keys belonging to removed pages. Keys left behind from the removed Arena, Onslaught and Salvage Run Dailies pages SHALL be ignored.

#### Scenario: Leftover key from a removed page

- **GIVEN** a device that still holds a stored Arena team-size preference
- **WHEN** the user opens any Dailies tab
- **THEN** the stored value has no effect and is not rewritten
