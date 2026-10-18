## MODIFIED Requirements

### Requirement: The Tier List page shows the horde-mode tier list

`/legendary-events/tier-list` SHALL render the catalog `horde-mode-tiers` record as a tier list: one row per tier in catalog order (S, A, B, C, D), each headed by the tier name and its multiplier ("S · 1.9×"), holding a tile for every character in that tier. Each tier SHALL have its own tone, distinct from the others and from the Untiered row. Tiles in a row SHALL be ordered by effective multiplier descending, then by localized name. The effective multiplier SHALL be the character's own `multiplier` when set, else its tier's multiplier. A tile SHALL show the character's portrait, localized name and effective multiplier; when the character's own multiplier differs from its tier's, the tile SHALL mark it as an override. Below the tiers, a collapsed **Untiered** row ("Untiered · 1.0×", with a count) SHALL list every other catalog character. The page SHALL include a "What this means" disclosure: the multiplier scales a character's combat power in Legendary Event clear estimates (Stage 5), and untiered characters use 1.0.

Assumptions:

- One tier and multiplier per character applies to every lane and battle (the `horde-mode-tiers-dataset` rule).
- The dataset lists characters only; machines of war are never tiered and are not shown.
- Tier D and Untiered can share 1.0; D means evaluated as weak, Untiered means not evaluated.

#### Scenario: Worked example, tier S

- **GIVEN** tier S has multiplier 1.9 and lists `custoBladeChampion` 2.0, `adeptHospitaller` 1.98, `deathRotbone` 1.96, `necroSpyder` 1.94, `tauCrisis` 1.92, `deathBlightlord` 1.9, `tyranTyrantGuard` 1.88, `admecMarshall` 1.86, `orksRuntherd` 1.83 and `templChampion` 1.81
- **WHEN** the page renders
- **THEN** the S row reads "S · 1.9×" and its tiles are Kariyan 2.0×, Isabella 1.98×, Nauseous 1.96×, Aleph-Null 1.94×, Re'vas 1.92×, Maladus 1.9×, Tyrant Guard 1.88×, Tan Gi'da 1.86×, Snotflogga 1.83×, Jaeger 1.81× in that order, with every tile except Maladus's marked as an override

#### Scenario: Tier multiplier without an override

- **GIVEN** a character listed in tier B with no `multiplier`, and tier B's multiplier 1.45
- **WHEN** its tile renders
- **THEN** it shows 1.45× with no override mark

#### Scenario: Tier D

- **GIVEN** tier D has multiplier 1.0 and lists `necroPlasmancer` 1.05 and `ultraEliminatorSgt` 1.0
- **WHEN** the page renders
- **THEN** a D row reads "D · 1.0×" after the C row and before Untiered, in its own tone, with tiles Thutmose 1.05× (override) then Certus 1.0×

#### Scenario: Untiered characters

- **GIVEN** the catalog has 119 characters, 47 of them tiered
- **WHEN** the page renders
- **THEN** a collapsed "Untiered · 1.0×" row shows the count 72 and, when opened, lists them by localized name

### Requirement: Tier List filters and tile details

The page SHALL offer a name search, an **Only owned** switch (off by default) and an alliance filter (All, Imperial, Chaos, Xenos; All by default). The filters SHALL apply to every row, including Untiered, and a tier row left empty by the filters SHALL stay visible with "No character". The filter state SHALL live in the URL query (`q`, `owned`, `alliance`), fall back to defaults on missing or invalid values, and not be shared with other pages. Owned characters SHALL be read from the synced roster; unowned tiles SHALL be visibly muted while Only owned is off. Activating a tile SHALL open its details: name, tier, effective multiplier, the tier's multiplier when overridden, owned rarity and rank (or "Not unlocked"), and an **Open in Library** link to `/library/characters/{unitId}`.

#### Scenario: Only owned

- **GIVEN** the user owns Calgar but not Kariyan
- **WHEN** Only owned is switched on
- **THEN** Calgar stays in the A row, Kariyan is hidden from the S row, and the URL carries `owned=1`

#### Scenario: Alliance filter

- **WHEN** the user picks Xenos
- **THEN** only Xenos characters remain, so the S row shows Aleph-Null, Re'vas, Tyrant Guard and Snotflogga, and rows with no Xenos character read "No character"

#### Scenario: Tile details

- **WHEN** the user activates Kariyan's tile
- **THEN** the details read tier S, 2.0×, tier default 1.9×, the owned state, and an Open in Library link to `/library/characters/custoBladeChampion`
