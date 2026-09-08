## Why

The Preferred trait / Preferred damage type controls bias team selection, but a
finished team gives the player no way to see _which_ of its characters actually
carry the preferred trait or deal the preferred damage type — especially once
the pool widens and non-matching fillers are added. A small per-row marker makes
the soft filter's effect legible.

## What Changes

- When a preferred trait and/or damage type is active, each recommended-team row
  (Plan team and Random team, every Dailies team page) SHALL show a small marker
  — the preferred trait's icon and/or the preferred damage type's icon — on the
  characters that match, each with a hover/focus tooltip naming what it matches.
- Rows for non-matching characters show no marker; when no preference is active,
  no markers appear anywhere.
- The engine output carries, per team member, which active preference(s) that
  character satisfies, so the shared presentation component can render the
  markers without re-deriving catalog data.

## Capabilities

### Modified Capabilities

- `dailies-team-recommendations`: the "Shared team presentation" requirement —
  add the per-row preference-match marker.
- `dailies-arena-recommendations`: the "Team presentation and rationale"
  requirement — same marker, stated for the Arena page.

## Impact

- **Code**: `team-recommendations.types.ts` (`TeamMember` gains optional
  `matchedTrait` / `matchedDamageType`), `team-recommendations.ts` (`memberOf`
  fills them from the narrowed preferences), `ui/team-recs/team-list.tsx`
  (renders the markers). No hook or page changes.
- **i18n**: two new `teamRecs` keys (`preferences.matchesTrait`,
  `preferences.matchesDamageType`) in en/de/es/fr.
- **Tests**: engine test for the new fields; the Arena and Salvage Run page
  tests already mock `traitIcon` / `damageTypeIcon`.
- No API, schema, or dependency changes.
