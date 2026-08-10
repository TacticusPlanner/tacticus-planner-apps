## Context

`ProjectGoal.Priority` already stores priority per project membership, and Dailies/Insights consume project goals in that order. The UI exposes individual up/down arrows and creation accepts optional numeric priority per selected project. The backend globally prevents more than one Active/Paused goal per `(profile, entity type, entity id, goal type)`.

The target model remains many-to-many, but priority becomes a project-level ordering of Character/MoW groups. The API will continue persisting flattened `ProjectGoal.Priority` values so existing schedulers need only consume the returned order. A coordinated API change provides unit-order semantics and project-scoped uniqueness.

## Goals / Non-Goals

**Goals:**

- Make Current plan unmistakable and separate it from lifecycle status.
- Let players compare projects by progress and planning value.
- Make the unit—not an individual goal—the user-controlled priority object.
- Keep goals within a unit contiguous and automatically ordered.
- Allow different projects to carry different in-flight targets of the same type for a unit.
- Preserve one canonical goal when intentionally shared across projects.
- Remove independent equipment goals cleanly.
- Preserve addressable routes and existing farming calculations.

**Non-Goals:**

- Manual ordering of goals inside a unit.
- Visible keyboard “Move before/after” commands. The chosen drag implementation should still use its library's keyboard-operable drag handle/sensor where available.
- Project-specific Active/Paused state; goal lifecycle remains global in this change.
- Nested projects, unit plans without goals, portfolios, collaboration, or templates.
- Reintroducing equipment goals. A future version will attach equipment goals to a Character rather than target an Item entity directly.
- Changing farming-cost formulas, goal dependencies, or attainment calculations.

## Decisions

**1. “Current plan” is the only user-facing name for `isActivePlan`.**

Current plan means the persisted project selected by default in Dailies and Insights. Project browsing never changes it; only an explicit “Make current” action does. Goal lifecycle continues to use Active/Paused/Completed/Archived.

**2. Projects is a Current-plan-first dashboard.**

The dashboard renders a prominent Current plan card, a responsive grid of other available projects, and a collapsed archived section. Cards show identity immediately and load counts/estimates independently. Card activation navigates; “Make current” is labeled; Edit and Archive/Restore live in an overflow menu.

**3. The project detail header owns project context and actions.**

The header contains back navigation, color/name/description, Current plan state/action, metrics, a compact route-switching project selector, and secondary management actions. Goal filters and unit-grouped content follow below.

**4. A project unit plan is a derived group, not a new frontend-owned persisted entity.**

The frontend groups in-flight project memberships by `(entityType, entityId)` for Character and MoW. The group's position is the minimum returned membership priority. The API owns flattening and persistence; the client sends ordered unit keys to the dedicated unit-order endpoint and refreshes the canonical project-goal list afterward.

```text
Project unit order
  Ragnar
    Rank
    Ability
  Aun'shi
    Unlock

Persisted scheduler order
  Ragnar/Rank, Ragnar/Ability, Aun'shi/Unlock
```

**5. Unit reprioritization is a dedicated mode.**

“Reprioritize units” opens a focused Sheet/dialog on desktop and full-height Sheet on mobile. It lists one draggable block per Character/MoW with icon, name, goal-type summary, and optional estimate. Save first validates that the draft contains every current in-flight unit key exactly once, then submits those ordered unit keys atomically. A stale or rejected save keeps the draft open and shows a recoverable error; Cancel discards local order. Normal goal rows have no priority arrows, and sorting/filtering the normal view cannot affect priority.

No separate visible Move before/after menu is added. The drag handle receives an accessible name and uses keyboard drag support supplied by the selected drag-and-drop library where practical.

**6. Within-unit goal order is automatic.**

The API topologically orders explicit `DependsOn` edges first. Goals without a dependency relationship preserve their previous relative priority; newly created goals join after their prerequisites and otherwise at the end of the unit block. Stable goal id is the final deterministic tie-breaker. The UI explains that moving a unit moves all its goals together.

**7. Only Active/Paused goals occupy a project goal-type slot.**

For every project, at most one Active/Paused goal may exist for a `(Character-or-MoW, goal type)` tuple. Completed/Archived goals do not occupy the slot. The same canonical goal may be shared into several projects, but adding it occupies the slot in each. Creating, resuming, or adding membership reports every conflicting project by name/id so the user can change membership or use the existing goal.

Client-side validation queries selected projects rather than globally disabling a goal type for the chosen unit. Server enforcement remains authoritative.

**8. Project membership is chips plus a searchable picker.**

Selected projects render as removable chips with color and Current plan/default/archive markers. Search offers non-archived, unselected projects. An existing archived membership stays visible/removable. The last membership cannot be removed. Conflict state is attached to the relevant chip/result rather than expressed as a global goal-type error.

When goal creation starts before any project exists, the client omits explicit memberships and the API creates the Default project on first use, returning the new goal with that membership. The goal is therefore never persisted without a project.

**9. Independent equipment goals are removed, while unit Upgrade goals remain.**

The client removes the equipment tab/form, `Item` entity branch, `UpgradeItem` goal kind, item progress/attainment, filters, icons, translations, and tests. Character/MoW `Upgrade` goals continue to target upgrade materials. Client types named `UpgradeItemTarget` are renamed to `UpgradeMaterialTarget` to distinguish materials from the later unit-attached equipment feature.

**10. Existing priority-sensitive engines receive one canonical flattened order.**

Project goal queries remain the source for Dailies, Raids Plan, and Insights. They do not independently regroup or resort the schedule. UI grouping derives from the same ordered list, while calculations consume it directly. This keeps inventory allocation, daily energy spending, bonus raids, and estimates aligned.

**11. FSD ownership remains consistent.**

- `entities/project`: identity, Current plan markers, project selector, unit-order API query/mutation types.
- `features/project-management`: cards/header actions and unit-reprioritization interaction.
- `pages/goals`: project dashboard/detail composition, unit-plan view models, summaries, goal form membership/conflict integration.
- `entities/goal`: supported Character/MoW goal kinds and material-target contract types.

## Risks / Trade-offs

- **Per-project uniqueness is cross-table on the server.** The API proposal adds a concurrency-safe membership-level backstop; the frontend must still handle structured conflicts after stale selections.
- **Automatic within-unit order is less expressive than nested manual ordering.** Accepted for clarity; dependencies and stable order preserve predictable behavior.
- **Drag-only visible UI can be less discoverable/accessibile.** Use a clearly labeled handle, instructions, and library keyboard sensors, but do not add separate Move commands per the product decision.
- **Unit reprioritization changes farming outcomes.** Tests must prove Dailies, Insights, and estimates consume the same flattened order.
- **Request fan-out for dashboard metrics.** Render identity first, use cached parallel queries, limit rich estimates, and isolate per-card failure.
- **Equipment-goal removal is destructive.** V2 is pre-production, so removal and API regeneration are preferred over dead compatibility branches.

## Migration Plan

Coordinate API first: ship the destructive data migration, project-scoped slot enforcement, unit-order endpoint, and regenerated OpenAPI artifact. Then update the client contract/types and UI in the apps repository. Because both are V2 and deployed together during development, no compatibility adapter is required. The API migration deletes independent equipment goals and cascades their memberships; ordinary Character/MoW goals remain.

## Open Questions

- Which single estimate belongs on the Current plan and unit cards: remaining farming days, projected completion date, or both? Choose during visual implementation using existing plan-insights vocabulary.
- Should “Default” eventually become “Inbox” or “My Goals”? This change preserves Default semantics and wording.
