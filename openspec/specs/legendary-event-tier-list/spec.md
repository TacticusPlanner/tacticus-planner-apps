# legendary-event-tier-list Specification

## Purpose

Defines the Legendary Events Tier List page: the horde-mode tier bands and Untiered row, filters and tile details, desktop and mobile layouts, data states, tour and analytics.

## Requirements

### Requirement: The Tier List page shows the horde-mode tier list

`/legendary-events/tier-list` SHALL render the catalog `horde-mode-tiers` record as a tier list: one row per tier in catalog order (S, A, B, C), each headed by the tier name and its multiplier ("S · 1.85×"), holding a tile for every character in that tier. Tiles in a row SHALL be ordered by effective multiplier descending, then by localized name. The effective multiplier SHALL be the character's own `multiplier` when set, else its tier's multiplier. A tile SHALL show the character's portrait, localized name and effective multiplier; when the character's own multiplier differs from its tier's, the tile SHALL mark it as an override. Below the tiers, a collapsed **Untiered** row ("Untiered · 1.0×", with a count) SHALL list every other catalog character. The page SHALL include a "What this means" disclosure: the multiplier scales a character's combat power in Legendary Event clear estimates (Stage 5), and untiered characters use 1.0.

Assumptions:

- One tier and multiplier per character applies to every lane and battle (the `horde-mode-tiers-dataset` rule).
- The dataset lists characters only; machines of war are never tiered and are not shown.

#### Scenario: Worked example, tier S

- **GIVEN** tier S has multiplier 1.85 and lists `custoBladeChampion` 2.0, `adeptHospitaller` 1.95, `tauMarksman` 1.9, `ultraInceptorSgt` 1.85, `necroSpyder` 1.8 and `admecMarshall` 1.75
- **WHEN** the page renders
- **THEN** the S row reads "S · 1.85×" and its tiles are Kariyan 2.0×, Isabella 1.95×, Sho'syl 1.9×, Bellator 1.85×, Aleph-Null 1.8×, Tan Gi'da 1.75× in that order, with every tile except Bellator's marked as an override

#### Scenario: Tier multiplier without an override

- **GIVEN** a character listed in tier B with no `multiplier`, and tier B's multiplier 1.25
- **WHEN** its tile renders
- **THEN** it shows 1.25× with no override mark

#### Scenario: Untiered characters

- **GIVEN** the catalog has 118 characters, 21 of them tiered
- **WHEN** the page renders
- **THEN** a collapsed "Untiered · 1.0×" row shows the count 97 and, when opened, lists them by localized name

### Requirement: Tier List filters and tile details

The page SHALL offer a name search, an **Only owned** switch (off by default) and an alliance filter (All, Imperial, Chaos, Xenos; All by default). The filters SHALL apply to every row, including Untiered, and a tier row left empty by the filters SHALL stay visible with "No character". The filter state SHALL live in the URL query (`q`, `owned`, `alliance`), fall back to defaults on missing or invalid values, and not be shared with other pages. Owned characters SHALL be read from the synced roster; unowned tiles SHALL be visibly muted while Only owned is off. Activating a tile SHALL open its details: name, tier, effective multiplier, the tier's multiplier when overridden, owned rarity and rank (or "Not unlocked"), and an **Open in Library** link to `/library/characters/{unitId}`.

#### Scenario: Only owned

- **GIVEN** the user owns Calgar but not Kariyan
- **WHEN** Only owned is switched on
- **THEN** Calgar stays in the A row, Kariyan is hidden from the S row, and the URL carries `owned=1`

#### Scenario: Alliance filter

- **WHEN** the user picks Xenos
- **THEN** only Xenos characters remain, so the S row shows Sho'syl and Aleph-Null, and rows with no Xenos character read "No character"

#### Scenario: Tile details

- **WHEN** the user activates Kariyan's tile
- **THEN** the details read tier S, 2.0×, tier default 1.85×, the owned state, and an Open in Library link to `/library/characters/custoBladeChampion`

### Requirement: Tier List desktop and mobile layouts

The Tier List SHALL render tier bands on desktop and stacked tier sections on mobile, with tile details in a popover on desktop and a bottom sheet on mobile; the content and order are the same on both forms.

#### Scenario: Desktop layout

- **WHEN** the page renders at or above 768px
- **THEN** the controls sit in one row above the list; each tier is a horizontal band with the tier label in a fixed-width coloured cell on the left (colours from design tokens) and tiles with portrait, name and multiplier wrapping to the right; tile details open in a popover anchored to the tile

#### Scenario: Mobile layout

- **WHEN** the page renders below 768px
- **THEN** the search and a Filters button sit in a compact bar, with Only owned and alliance in a bottom sheet; each tier is a full-width section with the label as its header and tiles in a four-column grid showing portrait and multiplier, the name truncated beneath; tiles have at least a 44px touch target; tile details open in a bottom sheet; nothing scrolls horizontally

### Requirement: Tier List data states are distinct

The page SHALL distinguish: catalog loading (skeleton rows); catalog read failed (error with Retry); `horde-mode-tiers` absent (a "Tier list not available yet" message, and no Untiered row); filters leaving no character in any row ("No character matches" with Clear filters); and the roster unknown (Only owned disabled with "Sync your roster", tiles not muted).

#### Scenario: Dataset absent

- **GIVEN** the catalog has no `horde-mode-tiers` record
- **WHEN** the page renders
- **THEN** it shows "Tier list not available yet" in place of the rows

#### Scenario: Roster unknown

- **GIVEN** the player-data read failed
- **WHEN** the page renders
- **THEN** every tile renders unmuted and Only owned is disabled with "Sync your roster"

### Requirement: Tier List tour and analytics

The page SHALL have a Joyride tour targeting, in order, the first tier row, the first tile, and the filters (on mobile the Filters button), with the same steps on desktop and mobile and localized copy in en/de/es/fr. The page SHALL record `legendary_event_tier_list_viewed` once per visit and `legendary_event_tier_list_unit_opened` (unitId, tier or `untiered`) when a tile's details open.

#### Scenario: Tour on both forms

- **WHEN** the tour starts at either width
- **THEN** it highlights the S row, Kariyan's tile, and the filters control (desktop row or mobile Filters button), each visible when its step shows
