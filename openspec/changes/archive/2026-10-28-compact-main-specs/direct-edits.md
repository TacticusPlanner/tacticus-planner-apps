# Direct scenario edits

OpenSpec rejects a MODIFIED block that omits or renames an existing scenario, so the drops and renames below are hand edits made during apply, before archive. Make each one both in `openspec/specs/<capability>/spec.md` and in the matching MODIFIED block of this change's delta (when the requirement has one), so archive applies cleanly. Audit ids are in `audit.md`; the scenario's audit id is noted on the matching entry there.

## `app-navigation`

### Requirement: Persistent desktop section menu lists the active section's child pages

- Drop scenario "Search launcher has no tooltip"

## `userjot-widget`

### Requirement: Search quick action opens the feedback widget

- Drop scenario "Desktop feedback from search"
- Drop scenario "Mobile feedback from search"

## `account-display-name`

### Requirement: Manage Account edits the name

- Drop scenario "Name edit is one tap from the user menu"

### Requirement: Identity is neutral until a name is set

- Drop scenario "Name not yet known"

## `character-unit-details`

### Requirement: Rank-up materials tab

- Drop scenario "Synced default range"

## `legendary-event-synced-progress`

### Requirement: Uncleared objectives can be marked Maybe clear or Stop here

- Drop scenario "Marks steer the token plan"

## `dailies-navigation`

### Requirement: Dailies has an HSE tab

- Drop scenario "Tab order"
- Drop scenario "Direct navigation"

### Requirement: Dailies has an HRE tab

- Drop scenario "Tab order"
- Drop scenario "Direct navigation"

### Requirement: Dailies has a Quest tab

- Drop scenario "Tab order" (keep "Direct navigation" so the requirement keeps a scenario)

### Requirement: Shops is not a Dailies tab

- Drop scenario "Tab order"

## `raid-boss-library`

### Requirement: The Raid Bosses list shows Bosses and Primes as two sections

- Drop scenario "Both sections render"

### Requirement: Route selection follows the shared Library contract

- Drop scenario "Bare collection URL canonicalizes"
- Drop scenario "Unknown entity id falls back"

### Requirement: Loading, dataset-absent, and failure states are distinct

- Drop scenario "Core raid-boss data is unavailable"

### Requirement: The page has an onboarding tour covering both platforms

- Drop scenario "Tour runs on desktop and mobile"

## `home-raids-widget`

### Requirement: Home page renders Daily Raids after Your Projects

- Drop scenario "Mobile stacks Daily Raids after Projects"

## `daily-raids-filters`

### Requirement: Filters constrain Today, Bonus Raids and the HSE tab only

- Drop scenario "HSE farm list is filter-then-pick"
- Drop scenario "HSE top-10 lists honor the filter"

## `daily-raids-today`

### Requirement: Today's project selector defaults to all goals

- Drop scenario "Schedule's selection does not leak into Today"

## `daily-shop-recommendations`

### Requirement: Shop recommendations are a section of the Raids tab

- Drop scenario "One selector narrows raids and shops"

## `npc-library`

### Requirement: The route carries the NPC group and the query carries variation and level

- Drop scenario "Collection route redirects to the first listed NPC"

## `project-management`

### Requirement: The Default project is permanent

- Drop scenario "A goal's last membership is removed"

### Requirement: Project lifecycle actions are Edit and Archive/Restore in an overflow menu

- Drop scenario "Archive is unavailable for the Default project"

### Requirement: A project is viewed on the Goals page scoped to that project

- Drop scenario "A project opens on Goals"

## `goal-project-membership`

### Requirement: The scoped Goals page's row menu hosts project removal

- Drop scenario "Unscoped menu has no removal"
- Drop scenario "Delete confirmation names the alternative while scoped"

### Requirement: The goal row's project-removal action offers a chosen destination when relocation is needed

- Drop scenario "Removal without a destination when other memberships exist"
- Drop scenario "Moving to an existing project"

## `goal-status-actions`

### Requirement: Pausing or resuming a goal cascades to its prerequisites

- Drop scenario "Bulk pause does not cascade"

## `goals-navigation`

### Requirement: Planning Settings is a Goals-only control

- Drop scenario "Planning Settings visible on Schedule"

### Requirement: Project-aware browsing defaults to all goals

- Drop scenario "A project filter narrows without re-planning"

## `goal-edit-dialog`

### Requirement: The Edit goal dialog contains only editable fields

- Drop scenario "Rank goal needing a Mythic material"
- Drop scenario "Editing the target updates the control"

### Requirement: One Save submits every change

- Drop scenario "Stale target revision"

### Requirement: Each goal offers an Edit action that opens the Edit goal dialog

- Drop scenario "Same action on Overview and Project Detail"

## `goal-target-editing`

### Requirement: The target is saved with the dialog's single Save and preserves context

- Drop scenario "Other detail draft exists"

## `goal-creation`

### Requirement: The Ability card has an independent target selector per ability track

- Drop scenario "Neither track advances"

### Requirement: Goal creation opens as a dialog on desktop

- Drop scenario "Mobile presentation unchanged"

## `goal-progress-display`

### Requirement: Actual Progress and Potential Progress captions carry a visible explanation on every goal kind

- Drop scenario "Both bars render in the goal-detail sheet"

## `goal-deletion`

### Requirement: Deleting a goal removes it immediately, without waiting for the network

- Drop scenario "The goal disappears everywhere it was cached"

## `goal-farming-estimates`

### Requirement: A shop offer's daily capacity is shared across goals in priority order

- Rename scenario "Shard offers are unaffected" → "Shard offers of different units are not shared"

## `goal-mythic-material-sources`

### Requirement: Every available offer is selected by default

- Rename scenario "Existing goal picks up the default" → "Goal without a saved selection uses the default"

## `goal-acquisition-source-picker`

### Requirement: The selected source set persists with the goal and is restored on edit

- Rename scenario "Goal created before this control existed" → "Goal saved with a single source choice"

## `ability-rules-text`

### Requirement: Every catalog ability with complete source text has rules text

- Drop scenario "Coverage after this change"

## `hre-mission-tracker`

### Requirement: Mission progress persists per event instance in this browser

- Rename scenario "Entry stored before this change" → "Entry without the optional fields"
