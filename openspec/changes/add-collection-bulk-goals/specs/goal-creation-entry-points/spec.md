## ADDED Requirements

### Requirement: Collection creates goals for several units with one shared target

Create goals in Collection's select bar SHALL open a dialog (centered at or above 768px, a bottom sheet below) listing the selected units. The dialog SHALL offer one target per goal type, each with its own checkbox: Ascension to a progression, Rank to a rank (shown when a character is selected), Abilities to a level for both tracks, and **Unlock units you don't own** (shown when a selected unit isn't owned, on by default). It SHALL offer a destination project, the Default project by default.

Each unit SHALL get its own plan from its current values:

- a target not above the unit's current value is skipped as **already reached**;
- a target an in-flight goal of the same unit and type already holds is skipped as **already a goal**;
- Rank on a Machine of War is skipped as **not for Machines of War**;
- a unit not owned is skipped when Unlock is off; when on, it gets an Unlock goal (or depends on its in-flight Unlock goal) and its other targets start from its starting values;
- a Rank or Abilities target above the unit's rarity cap depends on the chosen Ascension when that reaches far enough, else on the unit's lowest in-flight Ascension goal that does, else adds an Ascension goal to the lowest progression that permits it, marked as added.

Each unit row SHALL list the goals it will create and the targets it skips with their reason, and SHALL let the player remove the unit. The footer SHALL state how many goals will be created for how many units. When the new goals of a type plus the loaded non-archived goals of that type would pass 200, the dialog SHALL say so and Create SHALL be disabled; it SHALL also be disabled when no goal would be created.

Create SHALL send one combined goal creation per unit with goals, in list order, appended to the end of the priority order, in the chosen project. Each unit SHALL show pending, done or failed with the reason (a cap refusal as translated copy). **Retry failed** SHALL resend only the failed units. When every unit succeeded the dialog SHALL say how many goals were created and close on Done. Each run SHALL report `collection_bulk_goals_created` with the unit count, goal count and failed unit count, and nothing else.

#### Scenario: Ranking up a mixed selection

- **GIVEN** Ragnar (Legendary, Gold I), Tigurius (Epic, Silver III) and a Machine of War are selected
- **WHEN** the player ticks Rank and picks Diamond I
- **THEN** Ragnar gets one Rank goal Gold I → Diamond I, Tigurius gets an added Ascension to the lowest progression that allows Diamond I and a Rank goal depending on it, and the Machine of War shows Rank skipped as not for Machines of War

#### Scenario: A target already held is skipped

- **GIVEN** Ragnar already has an in-flight Rank goal ending at Diamond I
- **WHEN** Rank Diamond I is the target
- **THEN** Ragnar's row shows Rank skipped as already a goal, and Ragnar is not sent when nothing else is planned

#### Scenario: Partial failure and retry

- **GIVEN** three units are created and the second one's request fails
- **WHEN** creation finishes
- **THEN** the first and third show done, the second shows failed with its reason, and Retry failed resends only the second

#### Scenario: Over the cap

- **GIVEN** the account has 199 non-archived Rank goals
- **WHEN** the plan would add two Rank goals
- **THEN** the dialog states the Rank cap and Create is disabled
