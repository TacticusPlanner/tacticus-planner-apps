## Context

`DefaultGoalsLanding` currently redirects bare `/goals` to Current project, Default project, then Overview. `app-navigation` owns desktop last-visited-child behavior and the mobile Plan entry. `establish-global-goal-priority` must supply a real ordered view before this redirect changes.

## Goals / Non-Goals

**Goals:** Change only Plan's first-entry/default destination and labels after the global view exists.

**Non-Goals:** Implement global ordering, remove project detail/All Goals, or change last-visited behavior in other sections.

## Decisions

- Treat the global ordered view as a distinct child route (provisionally `/goals/plan`); keep `/goals/overview` as All Goals and `/goals/projects` plus detail URLs stable.
- Preserve desktop last-visited-child behavior; it overrides only the first-entry default. Mobile bottom-bar Plan always opens the global view, while mobile drawer child links stay direct.
- Keep route selection in Goals navigation/index ownership rather than duplicating a project-selection rule in the shell. Update localized labels/descriptions so the plan is not confused with unprioritized All Goals.

## Risks / Trade-offs

- The global-priority change may choose a different route or use Overview as its home → settle route ownership with that change before implementation; update these artifacts together.
- A redirect change could break bookmarked project URLs → test direct child/deep routes and browser Back.

## Open Questions

- What exact child route will `establish-global-goal-priority` expose? `/goals/plan` is provisional; the dependency's design must finalize it before applying this change.
