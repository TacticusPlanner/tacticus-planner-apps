# Spec Delta

## ADDED Requirements

### Requirement: Missions order

With a missions source and a token supply, the token plan SHALL also offer a **Missions order**: the same planned tokens, reordered inside each run section so that run's tracked open missions finish as early as possible, while each lane's tokens keep their relative order and tokens no run covers keep their place. Running points, supply slots and forecast markers SHALL follow the new order; each run's points SHALL be unchanged. With no tracked open mission telling tokens apart, the order SHALL equal the points order.

The Token plan list, on the event page and on the plan wizard's Runs and tokens step, SHALL offer a Points / Missions switch whenever a Missions order exists, remembered per device. In Missions order each run section SHALL list its missions grouped by track (Regular missions, then Premium missions only while premium missions are open under Show paid options), each group headed with how many the player ticked Done, listing its open missions with the token number that finishes each (or the count reached by the end of the run, or "not reached by this plan"), estimates marked, the untracked missions in one line, and the missions ticked Done marked Done; each token row SHALL show the missions it moves with their running counts and a line for each mission it finishes.

#### Scenario: Mission battles first

- **GIVEN** a run planning Alpha 1, Alpha 2, Beta 1, Beta 2 in points order, Beta battles holding 40 AdMechs each, and the open mission "Defeat 75 AdMechs"
- **WHEN** the user switches the Token plan to Missions
- **THEN** the run reads Beta 1, Beta 2, Alpha 1, Alpha 2, Beta 2 shows "Mission done", the run summary says "done at token 2", and the run's points are unchanged

#### Scenario: Switch remembered

- **GIVEN** the user chose Missions on the event page
- **WHEN** they open the plan wizard's Runs and tokens step
- **THEN** the Token plan shows the Missions order

#### Scenario: Regular and premium apart

- **GIVEN** Show paid options is on, the run plans premium missions, and the player ticked one regular mission Done
- **WHEN** the run section is shown in Missions order
- **THEN** it shows a Regular missions group headed "1/10 done" with that mission marked Done, and a separate Premium missions group; with Show paid options off only the Regular group shows
