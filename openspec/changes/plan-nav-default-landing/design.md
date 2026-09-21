## Context

See proposal.md - Why. The mechanism this change plugs into: `apps/web/src/fsd/app/layout/use-section-entry-path.ts`'s `getEntryPath(item)` returns `item.path` (`/goals`, bare) whenever no child has been recorded as visited this session; the router then resolves that bare path via `pages/goals/route.tsx`'s index route, today a static `<Navigate replace to="/goals/overview" />`. Mobile's bottom-nav entry also points at `item.path` directly (no last-visited memory on mobile at all — see `app-navigation`'s "only the desktop sidebar" language), so it hits the same index route every time. `useProjects()` (`entities/project/model/use-projects.ts`) already exposes `activeProjectId` (Current plan) and `defaultProjectId`, with `loading`/`fetchState` for the pending/error states — no new data plumbing needed.

## Goals / Non-Goals

- Goal: change only what the _bare_ `/goals` route resolves to. Every named child route (`/goals/overview`, `/goals/projects`, `/goals/projects/:id`, `/goals/insights`) is untouched — same component, same path, same content.
- Goal: compose with the existing last-visited-child mechanism rather than bypass it — see the new "last-visited-child memory still overrides" scenario in the spec delta.
- Non-goal: no change to `use-section-entry-path.ts` itself. It already does exactly the right thing (return `item.path` before any child is visited) — the actual behavior change is entirely in what `item.path`'s route resolves to, which is `pages/goals/route.tsx`'s own concern.
- Non-goal: no change to the mobile drawer, search, or the mobile header's own tab row — none of those go through the bare `/goals` path; they already link to specific children directly.

## Decisions

- **Replace the static index `<Navigate>` with a small route component**, e.g. `DefaultGoalsLanding`, colocated in `pages/goals/route.tsx` or its own file under `pages/goals/ui/`. It reads `useProjects()`, and once `fetchState.status !== "idle"` (loaded or errored): navigates to `/goals/projects/{activeProjectId ?? defaultProjectId}` when either exists, else to `/goals/overview`. While still loading (`loading: true`), it renders a minimal skeleton rather than nothing, matching how `ProjectDetailPage` and other data-dependent routes already handle their own loading state before their first render decision.
- **Resolve `activeProjectId` before `defaultProjectId`**, matching `activeProjectId`'s existing meaning everywhere else in the app (Current plan) and the proposal's explicit choice. `defaultProjectId` is the fallback only when no project is currently marked active plan — an edge state (e.g. right after account setup, before any "Make current" has ever run) rather than the common case, where `activeProjectId` and `defaultProjectId` are usually the same project anyway.
- **On a failed project fetch (`fetchState.status === "error"`), fall back to `/goals/overview`** rather than showing an error screen on the section's own entry point — the same reasoning `add-overview-project-quicknav`'s desktop chip row already used for its own failure state (a convenience shortcut degrading gracefully beats blocking navigation).
- **Label changes are translation-only.** `nav.goals` and `goals.tabs.overview` keep their existing keys (renaming them would touch every reference across `nav-items.ts`'s `NavLabelKey` union, `section-tabs.test.tsx`, and elsewhere for no behavioral gain) — only the four locale files' string values change.

## Risks / Trade-offs

- [A user who bookmarked or deep-links to bare `/goals` now lands somewhere data-dependent instead of a fixed page] → Accepted per the proposal's explicit intent; the same is already true of any bookmark to a section's bare path that relies on `getEntryPath`'s session-only memory (it never survives a fresh tab either).
- [`DefaultGoalsLanding` adds one extra render before navigating (skeleton, then redirect) versus today's zero-render static `<Navigate>`] → Acceptable: `useProjects()` is typically already warm from the app shell (nav search, other sections) by the time a user reaches this route, so the loading state is rarely visible in practice.
