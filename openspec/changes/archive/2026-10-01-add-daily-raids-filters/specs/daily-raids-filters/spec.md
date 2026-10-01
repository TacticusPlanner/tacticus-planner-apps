## ADDED Requirements

### Requirement: Raids Filters entry point

Dailies > Raids (Today) SHALL provide a keyboard-operable, accessibly named "Raids Filters" action in the same row as the project selector (icon-only on mobile, icon plus label on desktop). The Dailies > HSE tab SHALL provide the same action in its header, sharing the same applied filter. Plan > Schedule, Goals and the Plan SHALL NOT provide it. When at least one filter is active the action SHALL show a badge with the count of active filter groups, counting each of these as one when set: ally alliances, ally factions, enemy alliances, enemy factions, enemy traits, enemy types, minimum enemies, maximum enemies, campaign types, slots, upgrade rarities.

#### Scenario: Badge reflects active groups

- **GIVEN** ally factions, enemy types and a minimum enemy count are set
- **WHEN** Today renders
- **THEN** the Raids Filters action shows a badge of 3

#### Scenario: Enemy traits count as one group

- **GIVEN** two enemy traits are selected
- **THEN** they add 1 to the badge count

#### Scenario: No filters

- **WHEN** no filter is set
- **THEN** no badge is shown

#### Scenario: HSE tab has the entry point

- **GIVEN** a filter set on Today
- **WHEN** the HSE tab renders
- **THEN** it shows the Raids Filters action with the same badge count

#### Scenario: Schedule has no entry point

- **WHEN** Plan > Schedule renders
- **THEN** it shows no Raids Filters action

### Requirement: Raids Filters dialog

Activating the action SHALL open a dialog titled "Raids Filters" with sections, in order: Allies (Alliances, Factions), Enemies (Alliances, Factions, Enemy Traits, Min Enemy, Max Enemy, Enemy Types), Locations (Types, Slots), Upgrades (Rarity). Alliance, faction, enemy trait, enemy type, campaign type, slot and rarity fields SHALL be multi-selects whose empty state reads as "all" (for example "All alliances"). Min Enemy and Max Enemy SHALL be single searchable selects over the distinct enemy totals present in the catalog (descending), clearable to "no limit". Faction options SHALL be limited to factions of the selected alliances in the same group (all factions when no alliance is selected). Options SHALL show id-based icons (alliance, faction, rarity) with localized labels. Slots options SHALL be 3, 4 and 5; campaign type options SHALL be Elite, Extremis, Standard, Mirror, Normal and Early; upgrade rarity options SHALL be Common through Mythic and SHALL NOT include Shard or Mythic Shard. The footer SHALL offer Close, Reset and Apply.

#### Scenario: Draft until Apply

- **GIVEN** the dialog is open with changes made
- **WHEN** the user chooses Close or the dismiss control
- **THEN** the dialog closes, the applied filter and plan are unchanged, and reopening shows the applied values

#### Scenario: Apply

- **WHEN** the user chooses Apply
- **THEN** the draft becomes the applied filter, the dialog closes and Today recomputes

#### Scenario: Reset

- **WHEN** the user chooses Reset
- **THEN** every field is cleared, the empty filter is applied immediately and the dialog closes

#### Scenario: Faction options follow alliance

- **GIVEN** Enemy alliances is set to Xenos
- **WHEN** the user opens Enemy factions
- **THEN** only Xenos factions are offered, and the Ally factions list is unaffected

#### Scenario: No shard rarity options

- **WHEN** the user opens Upgrade rarity
- **THEN** only Common, Uncommon, Rare, Epic, Legendary and Mythic are offered

#### Scenario: Mobile layout

- **WHEN** opened on mobile
- **THEN** it renders as a full-width bottom sheet with paired fields (alliances/factions, min/max) two per row, touch-sized controls, and a sticky footer

#### Scenario: Desktop layout

- **WHEN** opened on desktop
- **THEN** it renders as a centered dialog with the same sections and footer

### Requirement: Location matching semantics

A campaign location SHALL pass the filter only when all of the following hold; an empty or unset criterion always passes:

- Min Enemy: the location's enemy total is greater than or equal to the minimum. Max Enemy: less than or equal to the maximum.
- Enemy types: at least one of the location's enemy types is selected.
- Slots: the location's slot count (5 when unknown) is selected.
- Campaign types: the location's campaign type option (see "Campaign type mapping") is selected.
- Upgrade rarity: for an upgrade material, its rarity is selected. Character-shard materials, and evaluations without a material, are not restricted by this criterion.
- Ally alliance: the battle's `alliesAlliance` is selected. Ally factions: at least one of the battle's `alliesFactions` is selected.
- Enemy alliances: at least one enemy alliance at the location is selected. Enemy factions: at least one enemy faction at the location is selected.
- Enemy traits: at least one enemy at the location has at least one selected trait (see "Enemy traits").

#### Scenario: Count bounds

- **GIVEN** Min Enemy 10 and a location with 6 enemies
- **THEN** the location does not pass
- **GIVEN** Max Enemy 6 and a location with 10 enemies
- **THEN** the location does not pass

#### Scenario: Combined criteria are ANDed

- **GIVEN** enemy alliance Xenos, campaign type Elite, slots 5, min enemies 10 and enemy type Grot
- **THEN** only a location satisfying all of them passes

#### Scenario: Shard materials ignore the rarity criterion

- **GIVEN** upgrade rarity is set to Legendary
- **THEN** a Common upgrade's locations fail while a character-shard material's locations are evaluated on the other criteria only

#### Scenario: Allies come from the catalog

- **GIVEN** ally faction Orks is selected and a battle whose catalog `alliesFactions` is `["Orks"]`
- **THEN** the battle passes the allies criterion without any client-side campaign table

### Requirement: Campaign type mapping

The filter's campaign type options SHALL match V2 catalog battles as follows, so each battle belongs to at most one option:

- Elite: battle `type` is `Elite` or `EliteMirror`.
- Mirror: battle `type` is `Mirror`.
- Extremis: battle `type` is `Extremis` (including challenge battles).
- Standard: battle `type` is `Standard` and its campaign group `releaseType` is `event` (including challenge battles).
- Normal: battle `type` is `Standard`, its campaign group `releaseType` is `standard`, and it is not Early.
- Early: campaign group `campaign1` (Indomitus), `type` `Standard`, `energyCost` 5.

Indomitus battles with `energyCost` below 5 (no raid rewards) belong to no option and therefore fail any campaign-type selection.

#### Scenario: Mirror Elite counts as Elite

- **GIVEN** campaign type Elite is selected
- **THEN** battles of type `Elite` and `EliteMirror` pass and battles of type `Mirror` do not

#### Scenario: Event Standard versus storyline Normal

- **GIVEN** campaign type Standard is selected
- **THEN** event-campaign `Standard` battles (including challenge) pass and storyline `Standard` battles (such as Fall of Cadia) do not; selecting Normal inverts that

#### Scenario: Early

- **GIVEN** campaign type Early is selected
- **THEN** only five-energy Indomitus `Standard` battles pass

### Requirement: Filters constrain Today, Bonus Raids and the HSE tab only

The applied filter SHALL constrain the node(s) the daily-raids engine schedules for Today and Bonus Raids, the candidate locations of the HSE tab's farm list and the locations listed in the HSE tab's two top-10 lists, and nothing else. Raids Plan / Schedule, Goals page estimates and dates, goal-creation previews and Insights SHALL be computed without the filter and SHALL be identical whether or not a filter is applied. The Home raids widget, which shows the Today list, SHALL reflect the same filtered Today.

For every material (upgrades and character shards alike) the engine SHALL first choose the preferred nodes exactly as it does with no filter (least energy per item among eligible nodes), then remove nodes that fail the filter, and SHALL NOT fall back to a less preferred node that passes. A material with at least one preferred node that passes stays scheduled on the passing node(s). A material whose preferred nodes are all removed SHALL be reported on Today as filtered out, with a reason distinct from "no farm location", and offered a Reset action. The filter wins over a goal's pinned farm locations: pinned locations are filtered exactly like auto-picked ones, so a goal pinned to a location that fails the filter is reported as filtered out. The filtered-out notice SHALL state, for such goals, that their pinned location is excluded by the Raids Filters and that the filter or the pin must change. With an empty filter, results are identical to current behavior. This pick-then-drop rule and the filtered-out reporting apply to Today and Bonus Raids; the HSE tab's farm list instead treats the filter as a candidate rule (filter-then-pick, below).

#### Scenario: Filter removes the cheapest node

- **GIVEN** the least-energy node for a material fails the filter and another, pricier node passes
- **WHEN** Today is computed
- **THEN** the material is reported as filtered out and is not moved to the pricier node

#### Scenario: Character shards behave the same as upgrades

- **GIVEN** the least-energy node for a character's shards fails the filter and another node passes
- **THEN** the shards are reported as filtered out, not moved to the passing node

#### Scenario: A tied node passes

- **GIVEN** two nodes tie for least energy per item and only one passes the filter
- **THEN** the material is scheduled on the passing node

#### Scenario: Filter leaves the preferred node

- **GIVEN** the preferred node passes the filter
- **THEN** the schedule for that material is unchanged

#### Scenario: Plan and Goals ignore the filter

- **WHEN** a filter is applied
- **THEN** Plan > Schedule, Goals estimates and Insights are identical to the unfiltered result, while Today and Bonus Raids reflect the filter

#### Scenario: Pinned location fails the filter

- **GIVEN** a goal pins its farm location to a node that fails the filter
- **WHEN** Today is computed
- **THEN** the goal is reported as filtered out, not scheduled on the pinned node, and the notice says its pinned location is excluded by the Raids Filters and offers Reset

#### Scenario: Pinned location passes the filter

- **GIVEN** a goal pins its farm location to a node that passes the filter
- **THEN** Today schedules the goal on the pinned node as without a filter

#### Scenario: Filter cleared or pin changed

- **GIVEN** a goal is filtered out because of its pin
- **WHEN** the filter is reset or the pin is changed to a passing node
- **THEN** the goal is scheduled again

#### Scenario: HSE farm list is filter-then-pick

- **GIVEN** a filter is applied and the HSE tab shows a rule-bearing event
- **THEN** its farm list is chosen only among locations that pass the filter (and earn event points), evaluated with the material the location drops; a material is never reported as filtered out there and never moved to a node that fails the filter, and a filter that leaves no candidate shows the HSE empty state with a Reset action

#### Scenario: HSE top-10 lists honor the filter

- **GIVEN** a filter is applied and the HSE tab shows a rule-bearing event
- **THEN** both top-10 lists contain only locations that pass the filter (evaluated without a material, so the rarity criterion does not apply)

### Requirement: Filter persistence and scope

The applied filter SHALL persist per browser and survive reload, SHALL be shared by every consumer (Today, the HSE tab and the Home raids widget), SHALL apply regardless of project selection, SHALL NOT be imported from V1 saves, and SHALL degrade to an empty filter when storage is unavailable or holds invalid data. Stored ids no longer present in the catalog SHALL be ignored when matching and dropped on the next apply.

#### Scenario: Shared with the HSE tab

- **WHEN** a filter is applied on Today and the user opens the HSE tab
- **THEN** the HSE tab applies the same filter

#### Scenario: Shared with the Home widget

- **WHEN** a filter is applied on Today and the user opens Home
- **THEN** the Home raids widget shows the same filtered raids

#### Scenario: Stored filter from before Enemy traits existed

- **GIVEN** a stored `raids-filters.v1` value that has no enemy-traits field
- **THEN** it parses, every other stored group is kept, and no trait filter is set

#### Scenario: Corrupt storage

- **GIVEN** stored filter data that fails validation
- **THEN** the app behaves as if no filter were set and does not error

### Requirement: Loading and unavailable data

While catalog battle data is loading, the dialog SHALL render its sections with data-derived fields (Min Enemy, Max Enemy, Enemy Types) disabled rather than offering options not derived from loaded data.

#### Scenario: Catalog not loaded

- **WHEN** the dialog opens before battles load
- **THEN** data-derived fields are disabled and the remaining fields remain usable

### Requirement: Enemy traits filter

The Enemies section SHALL offer an Enemy Traits multi-select. Its options SHALL be the distinct enemy traits that occur on at least one enemy of at least one campaign battle in the catalog (derived from the served `npcs` dataset through each battle's enemy ids, using the same enemy-to-npc lookup as the Home Screen Event rules), labelled through the game-data `traits` namespace with a humanised id as fallback, each with its trait icon. A location SHALL pass the criterion when at least one of its enemies has at least one selected trait; an enemy id that cannot be resolved contributes no traits. An empty selection passes every location. The selection SHALL be persisted in the applied filter, SHALL read as empty for a stored filter that predates the field, SHALL be cleared by Reset, and SHALL count as one active group. The field SHALL be disabled while battle or npc data is loading, and every dialog string for it SHALL exist in en, de, es and fr.

#### Scenario: Any enemy with any selected trait

- **GIVEN** the trait Mechanical is selected and a location with one Mechanical enemy among five others
- **THEN** the location passes; a location with no Mechanical enemy does not

#### Scenario: Any-overlap across several traits

- **GIVEN** Mechanical and Daemon are selected
- **THEN** a location with only Daemon enemies passes, and so does one with only Mechanical enemies

#### Scenario: Combined with other criteria

- **GIVEN** trait Mechanical and campaign type Elite
- **THEN** only an Elite location with a Mechanical enemy passes

#### Scenario: Options come from the data

- **WHEN** the user opens Enemy Traits
- **THEN** the options are exactly the traits present on campaign-battle enemies, including Mechanical, and not traits that occur on no such enemy

#### Scenario: Reset clears the traits

- **GIVEN** an applied filter with enemy traits
- **WHEN** the user chooses Reset
- **THEN** the trait selection is empty and the badge no longer counts it
