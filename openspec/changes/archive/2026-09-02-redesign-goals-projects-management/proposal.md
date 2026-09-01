## Why

Projects currently expose storage and lifecycle mechanics more strongly than planning value. The project list is a set of nearly identical rows, the detail route repeats the project as both a management row and selector, and the only priority interaction is a pair of up/down arrows attached to individual goals. That model does not match how a player thinks about investing resources: the meaningful choice is usually which character or Machine of War to develop first, with several related goals describing that unit's desired outcome.

The terminology also conflates separate concepts. Project lifecycle can be `Active`, goals can be `Active`, and a separate `isActivePlan` flag selects the one project used by default in Dailies and Insights. Goal-type uniqueness is likewise global today: only one Active/Paused goal of a type may exist for a unit across the entire profile, preventing different projects from expressing different targets for the same unit.

Independent equipment-item goals add a third target identity that does not fit unit-centered planning and currently has no farming-cost engine. Removing them now allows a coherent Character/MoW model; equipment can later return as a goal type attached to a specific unit.

## What Changes

- Rename the user-facing active-plan concept to **Current plan**, without renaming the existing API field.
- Redesign `/goals/projects` as a Current-plan-first dashboard with informative project cards, separate available/archived sections, and progressive summary metrics.
- Replace the detail route's duplicated management row and selector with a semantic project header.
- Model project priority around ordered **unit plans**. A Character or MoW appears once in a project's priority list and contains all of that project's goals for the unit.
- Replace individual goal up/down arrows and numeric per-project priority entry with a dedicated unit-reprioritization mode. Users drag whole unit blocks; goals inside a unit are ordered automatically, dependency-first and otherwise stably.
- Relax goal-type uniqueness from profile-wide to project-scoped: a unit may have separate Active/Paused instances of the same goal type in different projects, while a single project may contain at most one Active/Paused instance for that unit and type.
- Preserve canonical multi-project goals: the same goal may belong to several projects, occupying the corresponding type slot in each.
- Replace expanded project checkboxes with searchable membership selection and removable project chips. Conflict feedback identifies the specific project whose slot is occupied.
- Remove independent equipment goals completely: `GoalEntityType.Item`, `GoalType.UpgradeItem`, their form/progress/filter/UI support, and their client contract types. Ordinary Character/MoW `Upgrade` goals remain.
- Rename misleading upgrade-material target types away from `UpgradeItemTarget` so the later unit-attached equipment goal type has unambiguous terminology.
- Add explicit desktop/mobile layouts, updated Joyride tutorials, translated copy, and regression coverage for Dailies/Insights scheduling order.

## Capabilities

### New Capabilities

- `goal-project-membership`: Searchable many-to-many membership, project-scoped in-flight goal-type uniqueness, and conflict handling.

### Modified Capabilities

- `project-management`: Current-plan-first dashboard, informative project cards, separate archive, semantic detail header, unit grouping, automatic within-unit goal order, drag-based reprioritization, and the flattened scheduler order produced from it.
- `goals-navigation`: Consistent Current plan terminology and implicit-selection behavior.

## Impact

- **Frontend:** `tacticus-planner-apps/apps/web`, especially Goals project pages, project management, goal creation/detail membership, goal types, attainment/progress, Dailies, Insights, i18n, and tutorials.
- **Backend coordination:** matching change `redesign-goals-projects-management` in `tacticus-planner-api` owns the database migration, uniqueness enforcement, unit-order endpoint, request/response changes, and generated OpenAPI artifact.
- **Breaking V2 contract changes:** removal of `Item`/`UpgradeItem`; removal of caller-supplied numeric project priorities during goal creation; renamed upgrade-material request/response symbols. Allowed by the greenfield V2 destructive-change policy; no compatibility shim is planned.
- **Routes:** `/goals/projects` and `/goals/projects/:projectId` remain stable.
- **Calculations:** farming formulas do not change, but their input order becomes unit-first. Priority-sensitive inventory and energy allocation therefore changes intentionally when the user reorders units.
- **Data access:** project cards compose existing project and goal data progressively. Rich calculations are limited to Current plan/visible or cached contexts to bound request fan-out.
- **V1:** no changes.
