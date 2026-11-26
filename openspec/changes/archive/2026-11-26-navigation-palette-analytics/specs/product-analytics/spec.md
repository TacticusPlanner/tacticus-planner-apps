## ADDED Requirements

### Requirement: Navigation search usage is a declared event

The client SHALL report `navigation_search_opened` when navigation search opens, with how it was opened (`shortcut`, `topBar` or `mobileMenu`) and the view mode. It SHALL report `navigation_search_item_selected` for each row or phone Menu chip picked, with the item's kind (page, recent page, action, a unit's Create goal, Find in Collection, or an entity kind), its target (the page's nav path, the action id or the entity's game id), its group, its 1-based position in the list or chip row, the query's length, whether it was picked with the keyboard or the pointer, and the view mode. It SHALL report `navigation_search_dismissed` when search closes without a pick, with the query's length, the number of rows listed and the view mode. No navigation search event SHALL carry the text of the query, and Find in Collection SHALL report no target.

#### Scenario: Opening a unit from the keyboard

- **WHEN** an identified desktop user opens search from the top bar, types "calgar" and presses Enter on Marneus Calgar
- **THEN** `navigation_search_opened` is reported with source `topBar`, and `navigation_search_item_selected` with kind `characters`, target `ultraCalgar`, query length 6 and method `keyboard`, and neither event carries "calgar"

#### Scenario: Closing without a pick

- **WHEN** an identified user types a query with no results and closes search
- **THEN** `navigation_search_dismissed` is reported with the query's length and 0 rows, and no pick is reported

#### Scenario: Picking a chip on the phone

- **WHEN** an identified user opens the Menu and taps the Create goal chip
- **THEN** `navigation_search_item_selected` is reported with kind `action`, target `createGoal`, group `chips`, position 1 and method `pointer`
