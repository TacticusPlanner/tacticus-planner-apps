## Why

Landing on Overview first ("Unfulfilled (31)", every goal across every project) puts a step between opening "Goals" and getting to the one project most people actually work from. Renaming the section to "Plan" and sending a first-time or bottom-nav entry straight to Current plan's own detail route removes that step; "Overview" stays available, relabeled "All Goals" so its all-goals-everywhere scope reads clearly once it's no longer the first thing shown.

## What Changes

- Relabel the sidebar/bottom-nav section "Goals" as "Plan" (label text only — route paths, i18n keys, and every child page are unchanged).
- Relabel "Overview" as "All Goals" (same route, `/goals/overview`, unchanged).
- Entering the Plan section without a specific destination — the mobile bottom-nav entry, or the desktop sidebar before any child has been visited this session — now navigates to the account's **Current plan** project's detail route (`/goals/projects/{id}`) instead of always landing on All Goals. Falls back to the account's Default project when there is no Current plan, and to All Goals when the account has no projects at all yet. Desktop's existing "return to whichever child you last visited this session" behavior (`app-navigation`) is unaffected — this only changes what "default child" means for Plan specifically, the same way every other section's own default child is a fixed route.
- All Goals, Projects, and Insights remain reachable exactly as they are today — same paths, same content, same flyout/tab entries.

## Capabilities

### Modified Capabilities

- `app-navigation`: the "Entering a section navigates to its last-visited child..." requirement's Goals-specific carve-out changes from a static default (All Goals) to one resolved from the account's Current plan project, with fallbacks.

## Impact

- `apps/web/src/fsd/app/layout/nav-items.ts` — no structural change (still 3 children: overview/projects/insights); only the translated labels shown for `nav.goals` and `goals.tabs.overview` change.
- `apps/web/src/fsd/pages/goals/route.tsx` — the index route's static `<Navigate replace to="/goals/overview" />` becomes a small component that resolves Current plan → Default project → Overview and navigates there.
- i18n: `nav.goals` → "Plan", `goals.tabs.overview` → "All Goals", across `en`/`de`/`es`/`fr`. No key renames.
- Existing tests asserting today's static `/goals` → `/goals/overview` redirect, and any test asserting the literal "Goals"/"Overview" label text.
