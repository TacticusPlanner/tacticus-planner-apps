# goal-creation-entry-points Specification

## Purpose

Defines the non-global places a user can start goal creation — the Goals
Overview toolbar and a project's detail header, menu, and Add Goals sheet —
alongside the existing global entry points, and how launching creation from
a project context preselects that project.

## Requirements

### Requirement: A project-scoped goal-creation launch preselects that project

When goal creation is launched from a project context — a Projects row's Create goal menu action, the Create new goal action inside that row's Manage goals sheet, Goals' contextual Create Goal action while a project scope is selected, or a global entry point (the sidebar button, bottom-nav button, or keyboard shortcut) used while the Goals page is scoped to a project (`/plan/goals?project={id}`) — the creation sheet SHALL preselect that project as the goal's membership before the user has chosen an entity or goal type. The user MAY still change or clear that selection before saving, the same as any other project selection in the creation sheet. Launching creation with no project context (Goals with "All goals" selected, the Projects page's New project flow, or a global entry point used anywhere else) SHALL be unaffected by this requirement and SHALL keep falling back to the user's Default project when no consecutive-creation context is remembered. Remembered membership and its precedence follow `goal-creation` ("Consecutive creation retains compatible context").

#### Scenario: Creating from a non-default project preselects it

- **GIVEN** a project that is not the user's default project
- **WHEN** they choose Create goal from that project's row menu on the Projects page
- **THEN** the creation sheet opens with that project preselected as the goal's membership, rather than the default project

#### Scenario: Creating from scoped Goals preselects the scope

- **GIVEN** the user is on `/plan/goals?project={id}` for a non-default project
- **WHEN** they activate Goals' contextual Create Goal action
- **THEN** the creation sheet opens with that project preselected

#### Scenario: The preselected project can still be changed

- **GIVEN** a project-scoped creation launch has preselected a project
- **WHEN** the user changes the project selection in the creation sheet before saving
- **THEN** the created goal is assigned to the user's chosen selection, not the originally preselected project

#### Scenario: Global entry points preselect the viewed project

- **GIVEN** the user is on `/plan/goals?project={id}`
- **WHEN** they use a global entry point (sidebar button, bottom-nav button, or keyboard shortcut)
- **THEN** the creation sheet opens with that project preselected

#### Scenario: Launching with no project context and no remembered choice

- **WHEN** the user launches goal creation from Goals with "All goals" selected, or from a global entry point outside a scoped Goals page, with no remembered membership
- **THEN** the creation sheet preselects the user's default project, the same as it does today

### Requirement: Existing project controls can start a new goal

A Projects row's overflow menu and its Manage goals sheet SHALL each offer a
distinct Create goal / Create new goal action. Activating either SHALL launch the
normal goal-creation sheet with that row's project preselected. Manage goals
SHALL remain an existing-goal assignment flow; choosing Create new goal SHALL not
submit pending existing-goal selections or silently discard them.

#### Scenario: Create from project menu

- **WHEN** the user chooses Create goal from a project row's overflow menu
- **THEN** goal creation opens with that project preselected

#### Scenario: Create from Add Goals with pending selections

- **GIVEN** the user has selected existing goals in Manage goals
- **WHEN** they choose Create new goal
- **THEN** goal creation opens with that project preselected and no
  pending existing-goal assignment is submitted
- **AND** reopening Manage goals on that project restores the pending selections
  and search after either cancelling or completing goal creation

#### Scenario: No existing goal matches the Add Goals search

- **WHEN** the Manage goals search has no matches
- **THEN** its Create new goal action is still visible and usable

### Requirement: Goals offers a contextual Create Goal entry point

At or above the 768px breakpoint the Goals page (`/plan/goals`) SHALL render a filled, labelled Create Goal action in its page toolbar's Actions slot, in addition to the app's existing global entry points (the desktop sidebar button, the mobile bottom-nav button, and the keyboard shortcut). Below 768px the toolbar SHALL NOT repeat it: the bottom navigation's Add goal button is the page's create action there, and it SHALL preselect the scoped project the same way. The action SHALL be visible without hovering, focusing, or opening another control, and SHALL open the same creation sheet the global entry points open — with no prefill while "All goals" is selected, and with the scoped project preselected while a project scope is selected.

#### Scenario: Desktop Goals shows the contextual entry point

- **WHEN** Goals is viewed at or above the 768px breakpoint
- **THEN** a labeled Create Goal action is visible at the far right of the toolbar

#### Scenario: Mobile Goals uses the bottom navigation entry point

- **GIVEN** a project scope is selected
- **WHEN** Goals is viewed below the 768px breakpoint and the user taps the bottom navigation's Add goal button
- **THEN** the toolbar shows no Create Goal action, and the goal-creation sheet opens with the scoped project preselected

#### Scenario: Activating the contextual entry point opens creation

- **GIVEN** "All goals" is selected
- **WHEN** the user activates Goals' Create Goal action
- **THEN** the goal-creation sheet opens with no entity or goal type preselected and no explicit project prefill

#### Scenario: Global entry points remain available

- **GIVEN** the contextual Create Goal action is present on Goals
- **WHEN** the user checks the app shell
- **THEN** the global entry points (sidebar button on desktop, bottom-nav button on mobile, and the keyboard shortcut) are still present and functional

### Requirement: The Legendary Event page launches goal creation with the unit prefilled

The Legendary Event page SHALL launch the same goal-creation sheet the global entry points open, through the app shell's launcher. It does so from a leaderboard row's actions menu and from an Upgrade impact row. The launch SHALL prefill:

- **leaderboard row, owned or unknown ownership:** the unit, with no goal type chosen;
- **leaderboard row, locked unit:** the unit and goal type Unlock;
- **Upgrade impact Unlock step:** the unit and goal type Unlock;
- **Upgrade impact Ascension step:** the unit, goal type Ascension and the step's progression as the target;
- **Upgrade impact Rank step:** the unit, goal type Rank and the step's rank as the target rank, with 0 applied upgrades.

These launches carry no project context. The sheet SHALL therefore preselect membership exactly as for a launch with no project context (remembered membership when there is one, else the user's Default project). The user MAY change the unit, goal type, target or project before saving. After the goal is created, every goal read on the page SHALL refresh without a page reload.

#### Scenario: Ascension step prefill

- **WHEN** the user activates Create goal on an Upgrade impact row for Tigurius's Ascension to Epic:RedThreeStars
- **THEN** the sheet opens with Tigurius selected, goal type Ascension and target Epic:RedThreeStars, and the user's Default project preselected

#### Scenario: Rank step prefill

- **GIVEN** a unit owned at Silver2, Legendary:RedThreeStars, with a Rank step to Silver3 on an Upgrade impact row
- **WHEN** the user activates its Create goal
- **THEN** the sheet opens with that unit selected, goal type Rank and target rank Silver3 with 0 applied upgrades

#### Scenario: Unit-only prefill

- **WHEN** the user chooses Create goal from an owned unit's leaderboard row
- **THEN** the sheet opens with that unit selected and every goal type unticked, and the user chooses the goal type

#### Scenario: Prefill can be changed

- **GIVEN** the sheet opened from an Upgrade impact row with goal type Ascension
- **WHEN** the user switches the goal type to Rank and saves
- **THEN** a Rank goal is created and no Ascension goal is created

### Requirement: Collection creates goals for several units with one shared target

Create goals in Collection's select bar SHALL open a dialog (centered at or above 768px, a bottom sheet below) listing the selected units. The dialog SHALL offer one target per goal type, each with its own checkbox: Ascension to a progression, Rank to a rank (shown when a character is selected), Abilities to a level for both tracks, and **Unlock units you don't own** (shown when a selected unit isn't owned, on by default). Each target picker SHALL offer only values above the lowest current value among the listed units (an unowned unit counts from its starting values; Rank looks at characters only); a chosen value below the first option SHALL move up to it, and a type no listed unit can advance SHALL be disabled with a hint. It SHALL offer destination projects with the create sheet's project field, the Default project by default: several projects can be chosen and a new project can be created from it.

Each unit SHALL get its own plan from its current values:

- a target not above the unit's current value is skipped as **already reached**;
- a target an in-flight goal of the same unit and type already holds is skipped as **already a goal**;
- Rank on a Machine of War is skipped as **not for Machines of War**;
- a unit not owned is skipped when Unlock is off; when on, it gets an Unlock goal (or depends on its in-flight Unlock goal) and its other targets start from its starting values;
- a Rank or Abilities target above the unit's rarity cap depends on the chosen Ascension when that reaches far enough, else on the unit's lowest in-flight Ascension goal that does, else adds an Ascension goal to the lowest progression that permits it, marked as added.

Each unit row SHALL list the goals it will create, one row per goal (Ascension as a rarity icon with the short star count, Rank as rank icons, Abilities as one row per raised track), and the targets it skips with their reason, and SHALL let the player remove the unit. The footer SHALL state how many goals will be created for how many units. When the new goals of a type plus the loaded non-archived goals of that type would pass 200, the dialog SHALL say so and Create SHALL be disabled; it SHALL also be disabled when no goal would be created.

Create SHALL send one combined goal creation per unit with goals, in list order, appended to the end of the priority order, in the chosen projects. Each unit SHALL show pending, done or failed with the reason (a cap refusal as translated copy, a server or network failure as a retryable server error, never raw status text). **Retry failed** SHALL resend only the failed units. When every unit succeeded the dialog SHALL say how many goals were created and close on Done. Each run SHALL report `collection_bulk_goals_created` with the unit count, goal count and failed unit count, and nothing else.

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

#### Scenario: Pickers start above the lowest unit

- **GIVEN** the listed characters are at Gold I and Silver III
- **WHEN** the player opens the Rank picker
- **THEN** it starts at Gold I and offers nothing at or below Silver III

#### Scenario: A new project from the dialog

- **WHEN** the player types a new name in the project field and chooses Create
- **THEN** the project is created and selected, and every unit's goals are added to it

### Requirement: Library unit pages launch goal creation with the unit prefilled

The Library character page and Machine of War page SHALL show a labeled **Create goal** button in the unit header for a signed-in player, at every width. Its accessible name SHALL name the unit ("Create goal for {name}"). Activating it SHALL launch the same goal-creation sheet the global entry points open, through the app shell's launcher, prefilled with:

- **a unit the synced roster doesn't hold:** the unit and goal type Unlock;
- **an owned unit, or a signed-in player whose roster hasn't synced:** the unit, with no goal type chosen.

The launch carries no project context, so the sheet preselects membership exactly as for a launch with no project context. The sheet's own rules then apply (for example an existing Unlock goal disables Unlock). While the signed-in player's data is still read the button SHALL be disabled, so a locked unit never opens without its Unlock prefill. A signed-out visitor SHALL NOT see the button. Each launch SHALL report `library_unit_create_goal_opened` with the entity type (`Character` or `Mow`) and the preselected goal type (`Unlock` or null), and nothing else.

#### Scenario: Owned character

- **GIVEN** a signed-in player who owns Tigurius
- **WHEN** they press Create goal on Tigurius's page
- **THEN** the creation sheet opens with Tigurius selected and no goal type ticked

#### Scenario: Locked Machine of War

- **GIVEN** a signed-in, synced player who doesn't own a Machine of War
- **WHEN** they press Create goal on that Machine of War's page
- **THEN** the creation sheet opens with that Machine of War and Unlock selected

#### Scenario: Signed out

- **WHEN** a signed-out visitor opens a Library unit page
- **THEN** no Create goal button is shown

#### Scenario: Player data still loading

- **GIVEN** a signed-in player whose roster is still being read
- **WHEN** the unit header renders
- **THEN** Create goal is shown disabled
