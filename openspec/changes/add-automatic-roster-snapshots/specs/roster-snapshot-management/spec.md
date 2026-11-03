## ADDED Requirements

### Requirement: Automatic snapshots are labeled and kept separately

Snapshots with source `Auto` SHALL be labeled "Auto · <date>", with the date localized and including the year (for example "Auto · Nov 3, 2026"), unless renamed. A renamed one SHALL show its name with an Auto badge. The manage sheet SHALL list them in an Automatic section after the manual snapshots, with usage "<autoCount>/<autoLimit>" and a note that the oldest is replaced when a new one is taken. Automatic snapshots SHALL NOT count toward the manual usage shown in the take dialog.

#### Scenario: Label with year

- **GIVEN** an automatic snapshot taken 2026-11-03 in the English locale
- **WHEN** the picker lists it
- **THEN** it reads "Auto · Nov 3, 2026"

### Requirement: An automatic snapshot can be kept

Each automatic snapshot in the manage sheet SHALL offer Keep. Keep SHALL convert it into a manual snapshot, moving it into the manual list and increasing manual usage by one. At the manual limit, Keep SHALL be disabled, with the tooltip "Delete a snapshot to keep this one". A limit conflict from the API SHALL show the same message, and nothing changes.

#### Scenario: Keep

- **GIVEN** 5 manual and 3 automatic snapshots
- **WHEN** the user keeps the automatic snapshot from Oct 1, 2026
- **THEN** the manual list has 6 with that snapshot in it, and the Automatic section has 2

### Requirement: Automatic snapshots can be turned off

The planning settings SHALL offer a toggle "Take a snapshot automatically when you have none from the last 30 days", bound to `autoRosterSnapshots` (on by default). Turning it off SHALL NOT delete existing automatic snapshots.

#### Scenario: Turn off

- **WHEN** the user turns the toggle off
- **THEN** the setting is saved as off and existing automatic snapshots are still listed

### Requirement: V1-imported snapshots show unknown fields as unknown

Snapshots with source `V1Import` SHALL be labeled "V1 · <name>". When either side of a comparison is a `V1Import` snapshot, XP gained and applied upgrades SHALL be shown as "—" in details, and SHALL NOT produce a chip or count in the summary.

#### Scenario: V1 import vs Current

- **GIVEN** "V1 · Before Uthar" vs Current, where Calgar's XP level rose 45 → 48
- **WHEN** his details open
- **THEN** XP level shows 45 → 48, XP gained shows "—", and applied upgrades show "—"
