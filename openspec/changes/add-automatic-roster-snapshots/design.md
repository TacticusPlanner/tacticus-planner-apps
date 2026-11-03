## Context

`add-personal-roster-snapshots` (apps) adds `entities/roster-snapshot`, the compare mode and the manage sheet. The API adds `source` values `Auto` and `V1Import`, `POST me/roster-snapshots/{id}/keep`, `autoLimit`/`autoCount` on the list, `autoRosterSnapshots` on user settings, and the V1 import's `rosterSnapshots` part with `rosterSnapshotOutcomes`.

## Decisions

1. **Labels are client-side.** The server stores the default ISO-date name. The entity exposes `snapshotLabel(source, name, takenAt, locale)`:
   - `Auto` with an unchanged default name → "Auto · <localized medium date with year>";
   - `V1Import` → "V1 · <name>";
   - otherwise the name.
     A user rename shows the new name and keeps the Auto badge.
2. **Unknown fields for V1 imports.** `diffRosters` treats `xp` and `appliedUpgradeSlots` as unknown when either side's source is `V1Import`, so they never produce a chip or a summary contribution. The details row shows "—".
3. **Manage sheet sections.** Manual (with V1 imports) first, then Automatic. Keep invalidates the list and moves the row without closing the sheet.
4. **Settings placement.** The toggle lives in the Manage snapshots sheet's Automatic section, next to the snapshots it controls. It saves through the existing user-settings mutation and sends only `autoRosterSnapshots` (with the revision), so the other settings keep their stored values.
5. **V1 import outcomes.** Same layout as the other parts: buckets with counts, expandable to the snapshot name and date, and the dropped-unit count when it isn't 0.
