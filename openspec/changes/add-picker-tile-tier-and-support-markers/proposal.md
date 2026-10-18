# Proposal

## Why

When picking units for a Legendary Event team, the player cannot see on the tile how strong a character is in horde mode or whether it heals or repairs. To find out, they have to open the Tier List or the Library.

## What Changes

- **Tier badge.** A tile whose character is in the horde-mode tier list shows its tier (S, A, B, C, D…) as a small badge in the tier's colour, at the tile's top-left corner. This mirrors the reserve button at the top-right.
- **Support trait icon.** A Healer or Mechanic shows that trait's icon under the tier badge. A character without a tier shows the trait icon in the badge's place.
- Both markers show on every tile, owned or locked, and have screen-reader text.

No **BREAKING** changes: front-end only, and V2 is pre-production.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `legendary-event-team-editor-workflow`: picker tiles mark the character's horde-mode tier and its Healer/Mechanic trait.

## Impact

- `apps/web/src/fsd/entities/legendary-event/lib/clear-estimate.ts`: the config also carries each tiered character's tier name.
- The tier colours move from the Tier List page to `entities/legendary-event`, so the Tier List and the picker share them.
- `apps/web/src/fsd/features/legendary-event-teams/ui/team-unit-picker.tsx`: the marker column.
- i18n: one new key (`teams.picker.tier`) in en, de, es and fr.
- No API change.
