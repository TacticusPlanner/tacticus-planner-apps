## Context

See proposal.md - Why. `apps/web/src/fsd/features/project-management/model/use-home-projects.ts` (`useHomeProjects`) and `ProjectSummaryRow` are already feature-level (not page-level) and exported from `@/features/project-management`'s public API — the home page's own `ProjectsWidget` (`pages/home/ui/projects/projects-widget.tsx`) is just one consumer of them. FSD forbids a page importing another page (`pages/goals` importing from `pages/home` directly), so Overview's mobile widget must be its own component in `pages/goals`, built from those same feature-level pieces, rather than a literal import of `ProjectsWidget`.

## Goals / Non-Goals

- Goal: mobile behaves identically to the home widget (same data, same states, same cap) without violating the page-to-page FSD boundary.
- Goal: desktop gets a lightweight, uncapped, horizontally-scrollable alternative — a chip row is a different shape than a card list, so it isn't a straight reuse of `ProjectSummaryRow`'s card markup.
- Non-goal: no change to `home-projects-widget` itself, or to the home page.
- Non-goal: no change to Overview's own goal-list filters/controls (`goals-navigation`) — the quick-nav is a new row above them, not a rework of them.

## Decisions

- **New page-local component `OverviewProjectQuicknav`** (`pages/goals/ui/goals-board/`) with two internal render paths gated on `useIsMobile()`: mobile renders `useHomeProjects(3)` through the same `ProjectSummaryRow` cards inside a `Card`, matching `ProjectsWidget`'s JSX close enough that a future divergence between the two is a conscious edit, not an accidental one. Desktop does **not** use `useHomeProjects` — that hook unconditionally fires a `projectQueries.goals(project.projectId)` query per visible project to compute the units/goals summary (`use-home-projects.ts`), and the desktop chip renders no summary at all (see below), so calling it there would fetch and discard one network request per project on the page most users land on first. Desktop instead calls `useProjects()` directly and applies the same tiny "Current plan first, non-archived only" ordering `useHomeProjects` already does inline (`current ? [current, ...others] : others`) — extract that ordering into a small shared helper both hooks call (e.g. `orderCurrentPlanFirst(projects)` in `features/project-management`), rather than duplicating those three lines, so the two stay in sync if the ordering rule ever changes. Alternative considered: extract `ProjectsWidget`'s whole body into a shared `features/project-management` component both pages render — rejected as speculative for a two-consumer, structurally-different (cards vs. chips) case; revisit if a third consumer appears.
- **Desktop chip is name + color swatch only**, no summary/goal-count (unlike the mobile cards, which keep `home-projects-widget`'s units/goals summary) — a single scrollable row has no room for a second line per chip, and the summary's main value (glanceable progress) is already what Overview's own goal list below it shows for whichever project is selected via the existing project-membership filter. This is also why desktop doesn't need `useHomeProjects`' summary-fetching machinery at all (see above).
- **The trailing "all projects" link is a plain link chip at the end of the same scrollable row**, not a separate element outside it — keeps the whole quick-nav as one visually contained unit and avoids a second row on desktop, which the proposal's "add 1 row" scope explicitly asked for.

## Risks / Trade-offs

- [A very long project list makes the desktop chip row require horizontal scrolling to reach the trailing "all projects" link] → Acceptable: it's an escape hatch, not the primary path, and the same row already needs horizontal scroll for the project chips themselves at that count.
