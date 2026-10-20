## ADDED Requirements

### Requirement: A running Home Screen Event breaks ties among equal costs

While a Home Screen Event with a raid-point rule runs, the HRE suggestions SHALL rank nodes of the same energy cost by that event's points per raid, descending, before the goal, drop-rate and gold order. Energy cost SHALL stay the first key. With no rule-bearing event running, the order SHALL be unchanged.

#### Scenario: Equal cost, more event points first

- **GIVEN** Machine Hunt runs and I21 and I22 both cost 5 energy, with I22 earning 15 event points per raid and I21 earning 9
- **THEN** I22 is listed before I21

#### Scenario: Cheaper node still wins

- **GIVEN** a running event gives I21 (5 energy) 15 points per raid and I20 (3 energy) none
- **THEN** I20 is listed first

#### Scenario: Event without raid points

- **GIVEN** Faction Boost (no raid-point rule) runs
- **THEN** the suggestions are as with no event running

### Requirement: HRE suggestions show the running event's points

While a rule-bearing Home Screen Event runs, each HRE row whose raids earn its points SHALL show them, and the section note SHALL name the event and say that, among nodes of equal cost, those earning more of its points come first.

#### Scenario: Rows and note

- **GIVEN** Machine Hunt runs and I22 gets 1 raid worth 15 event points
- **THEN** I22's row shows "15 event pts" and the note names Machine Hunt

### Requirement: The HRE tab has no raid header controls

The HRE tab SHALL NOT show the project selector, the Raids Filters action or the Planning Settings action. Its raid suggestions SHALL keep using the shared Dailies project selection, the persisted Raids Filters and the Planning Settings daily energy set on Today, and the empty-list action to open or reset the filters SHALL remain.

#### Scenario: Running event

- **GIVEN** an HRE is running
- **THEN** the HRE tab's title row shows no project selector, Raids Filters or Planning Settings control
