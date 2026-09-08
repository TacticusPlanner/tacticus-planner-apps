## Why

The team rows now mark characters that **match** an active preferred trait /
damage type, but a character that does **not** match shows nothing — so a widened
in filler that misses the preference looks the same as one where no preference
is set. When a preference is active, every row should say where it stands.

## What Changes

- When a preferred trait and/or damage type is active, every recommended-team
  row (Plan team and Random team, every Dailies team page) SHALL show a marker
  for that preference — the existing accent-chip icon for a character that
  satisfies it, and a **distinct muted "does not match" marker** (the same
  attribute icon, de-emphasised) for a character that does not, each with its
  own hover/focus tooltip.
- When no preference is active, rows show no preference markers (unchanged).
- The engine output carries, per team member, the active preferred trait /
  damage type and whether that character satisfies it (replacing the
  match-only fields added in the previous change, which is not yet released).

## Capabilities

### Modified Capabilities

- `dailies-team-recommendations`: the "Shared team presentation" requirement —
  the preference marker covers both match and non-match.
- `dailies-arena-recommendations`: the "Team presentation and rationale"
  requirement — same.

## Impact

- **Code**: `team-recommendations.types.ts` (`TeamMember.matchedTrait` /
  `matchedDamageType` become `preferredTrait` / `preferredDamageType` of
  `{ id, matched }`), `team-recommendations.ts` (`memberOf` sets them whenever
  the preference is active), `ui/team-recs/team-list.tsx` (renders the match /
  non-match styles).
- **i18n**: two more `teamRecs` keys (`preferences.missingTrait`,
  `preferences.missingDamageType`) in en/de/es/fr.
- **Tests**: the engine test for the fields is updated to the new shape and
  gains non-match assertions.
- No API, schema, or dependency changes.
