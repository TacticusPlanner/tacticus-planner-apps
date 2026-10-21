# Spec Delta

## MODIFIED Requirements

### Requirement: Manage goals assembles membership in bulk

The Projects page SHALL provide, from each non-archived project row's overflow menu, a Manage goals action that edits memberships for multiple existing goals of that project without visiting each goal individually. The surface SHALL list the profile's goals in account-wide priority order (`Goal.GlobalPriority`), with search and grouping by unit or goal type; it SHALL NOT offer a separate sort. Current membership SHALL come from the project's `goalIds` in the loaded project list; no per-project member read SHALL be issued. It SHALL distinguish current membership from pending additions and removals and SHALL show a review summary before one explicit save. The save SHALL apply the complete reviewed set atomically. A stale-set or last-membership rejection SHALL identify the problem, preserve the draft, and allow the user to refresh/reconcile before retrying; membership is never rejected for an occupied slot (slots are per account, see `goal-project-membership`). Membership changes SHALL NOT change goal status, target, or canonical global priority.

#### Scenario: Several goals join a project in one save

- **GIVEN** the user opened Manage goals from a project's row
- **WHEN** they select three nonmember goals and save
- **THEN** all three belong to the project and every unchanged membership remains

#### Scenario: Existing membership is visible while assembling

- **GIVEN** the project already contains some listed goals
- **WHEN** the surface renders
- **THEN** current membership and any pending add/remove state are visibly distinguishable, with no request beyond the goals and projects the page already holds

#### Scenario: Search narrows the assembly list

- **WHEN** the user searches by unit or goal type or changes the grouping
- **THEN** matching goals are shown without clearing pending selections hidden by the filter

#### Scenario: Concurrent membership changes are not discarded

- **GIVEN** the project's membership changed elsewhere after the surface was opened
- **WHEN** the user submits the reviewed set
- **THEN** no replacement occurs; the user sees a stale-set conflict and can compare refreshed current membership with their preserved draft before retrying

#### Scenario: Any in-flight goal can be selected

- **GIVEN** the project contains an Active Bellator Silver3 Rank goal
- **WHEN** assembly lists the account's other in-flight goals
- **THEN** every one of them can be selected; no goal is blocked for a slot

#### Scenario: Assembly does not remove members

- **WHEN** the user leaves existing members selected and saves additions
- **THEN** those existing members remain; only members explicitly marked for removal are removed

#### Scenario: Added goals do not reorder existing units

- **GIVEN** goals have an established canonical account-wide order
- **WHEN** the user adds or removes project memberships and saves
- **THEN** the canonical order and relative position of every goal remain unchanged, and a newly added goal appears in the scoped Goals view at its existing global position

#### Scenario: Several removals and additions in one save

- **WHEN** the user marks two current members for removal, three goals for addition, reviews the summary, and saves
- **THEN** all five membership changes commit together or none commits if any validation fails

#### Scenario: Removing the only membership is blocked

- **WHEN** a pending removal would leave a goal in no project
- **THEN** the save is rejected without applying other changes and the affected goal is identified with guidance to add it to another project first (the Default project is always available)

#### Scenario: Pending selection survives navigation within the list

- **WHEN** the user filters, groups, or scrolls the list after making selections
- **THEN** the review summary and eventual saved set retain those selections

### Requirement: Project cards communicate planning value

Every project card SHALL show color, name, description when present, and a goal/unit summary derived from the project's `goalIds` joined with the loaded goals list — no per-project read. Where summary data is available a card SHALL also show reached, blocked, and estimate/progress information; the richer dashboard metrics (reached, blocked, completion date) belong to the Default project card only, as they belonged to the Current plan project before it was removed, and are computed from the one global run. Identity and actions SHALL remain usable while the goals list or a summary calculation loads or fails.

#### Scenario: Summary loads progressively

- **GIVEN** project identity has loaded and the goals list or the summary calculation has not
- **WHEN** the card renders
- **THEN** identity/actions render with a summary skeleton

#### Scenario: One summary fails

- **WHEN** the goals list read fails
- **THEN** every card shows its identity with an unavailable/retry summary state, and one retry re-reads the goals list

## REMOVED Requirements

### Requirement: Assembly blocks a selection whose goal-type slot is occupied

**Reason**: In-flight slots are per account, not per project; a project's membership can no longer hold or violate a slot, so the assembly surface has nothing to block.

**Migration**: Manage goals lists every goal as selectable. Duplicate in-flight goals are prevented at creation, target edit and resume, where the conflict names the existing goal (see `goal-project-membership` and `api-error-handling`).
