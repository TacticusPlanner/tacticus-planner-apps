# Make a section tab return from a detail route

## Why

A closed-beta tester reported that, while inside a project's subsection, activating
the Projects tab does not return to the all-projects screen (`GP-33`, P2). Verified
in source: `section-tabs.tsx` marks a tab active when
`pathname === child.path || pathname.startsWith(child.path + "/")`, so at
`/goals/projects/{id}` the Projects tab already _is_ the selected value of a
controlled Radix `Tabs`. Radix fires `onValueChange` only when the value changes,
and navigation hangs off that callback alone — so activating the selected tab does
nothing at all.

Projects is not the only tab with a page of its own sitting behind a detail route,
so the fix belongs in the shared tab row rather than in the Goals section. It does
have to be selective, though: for most of the other tabs, their own path is not a
destination a user can land on, and navigating there would be useless or worse.

## What Changes

- A nav child may declare that its own path is a real landing page. Only those
  tabs re-navigate; activating such a tab from a route nested below it returns to
  that landing page.
- Two children declare it: `/goals/projects` (the all-projects screen) and
  `/library/raid-bosses` (which renders its own picker when no entity is selected).
- Every other tab keeps today's behavior exactly, including when the current route
  is nested below it. That is deliberate, not an oversight:
  - `/library/characters`, `/library/machines-of-war`, and `/library/npcs` have no
    list state to return to. `useLibraryRouteSelection` canonicalizes the URL, so
    navigating to the collection path immediately `replace`s it with
    `<collection>/<firstId>` — the user would be thrown to the first entity rather
    than to a list.
  - `/dailies/raids` is a redirect, not a page: its index sends the user to
    `/dailies/raids/today`. From `today` that pushes a history entry and lands back
    where the user already was, leaving a dead Back press; from `plan` it discards
    the page the user was on. `app-navigation` already excludes this third level
    from the tab-row requirement.
- Tabs whose path exactly matches the current route keep behaving as they do now:
  activating them is an ordinary no-op.
- Keyboard activation keeps working exactly as before, and the active-tab
  highlight continues to follow the prefix match, so a nested route still shows
  its parent tab as the current one.

## Capabilities

### Modified Capabilities

- `app-navigation`: "The shared page header hosts a section's child-page picker"
  gains the behavior that a child page declared as having its own landing page is
  returned to when its tab is activated from a route nested below it, and that
  other tabs are unaffected. The requirement's existing mobile-only scope, its
  desktop no-picker rule, and its third-level-tabs exclusion are unchanged.

## Impact

- **Frontend only, and mobile only.** `SectionTabs` is rendered solely by
  `mobile-header.tsx`; the desktop header shows a static breadcrumb with no picker,
  per the same capability. (The component's own doc comment still claims it is
  "shared by both the desktop and mobile headers" — stale since the desktop header
  was changed, and corrected as part of this change.)
- No API change, no data migration, no new i18n keys, no new dependency.
- Affected code: `apps/web/src/fsd/app/layout/nav-items.ts` (one optional field on
  `NavSubItem`, set on two children) and
  `apps/web/src/fsd/app/layout/section-tabs.tsx`, plus their tests.
- Fixes two routes: `/goals/projects/{projectId}` and
  `/library/raid-bosses/{entityId}`.
- The flag is **opt-in** rather than opt-out so that a nav child added later does
  not silently inherit re-navigation into a path that turns out to be a redirect or
  a canonicalizing collection. It also makes "does this tab have a page of its
  own?" an explicit, reviewable property rather than an emergent consequence of
  each page's redirect logic.
- Not affected, verified rather than assumed: the mobile menu drawer
  (`MobileDrawerSubItem`) and the desktop sidebar flyout (`NavChildRow`) both
  render react-router `Link`s, which navigate regardless of active state; and the
  desktop sidebar's section entry records a child's own path
  (`useSectionEntryPath`), not the detail URL. None of these need changing.
- Adjacent, deliberately out of scope: `MobileDrawerSubItem` marks itself active
  with an exact `pathname === item.path` match, so on a detail route the drawer's
  corresponding item is not highlighted while the header tab is. That is an
  active-state inconsistency, not a navigation failure, and nothing in the current
  feedback reports it.
