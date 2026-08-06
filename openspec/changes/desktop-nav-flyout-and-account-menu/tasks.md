## 1. Shared UI primitives (`packages/ui`)

- [x] 1.1 Add `packages/ui/src/components/hover-card.tsx`: a thin `data-slot`-tagged wrapper around `radix-ui`'s `HoverCard` primitive (`Root`/`Trigger`/`Content`, plus `Arrow` if needed for the flyout), following the existing `popover.tsx` wrapper pattern (default `sideOffset`, `data-[side=*]:slide-in-from-*` animation classes matching `PopoverContent`/`TooltipContent`).
- [x] 1.2 Add a `packages/ui/src/components/hover-card.test.tsx` structural render test mirroring `popover.test.tsx`'s coverage (renders trigger/content, `data-slot` attributes present, content visible when open).
- [x] 1.3 Export the new `hover-card` module from the package's public entry point alongside the other component exports (match however `popover`/`tooltip` are currently exported).
- [x] 1.4 Add a `PopoverArrow` export to `packages/ui/src/components/popover.tsx` wrapping `radix-ui`'s `Popover.Arrow`, styled to match `PopoverContent`'s `bg-popover`/`ring-1 ring-foreground/5` treatment, and cover it in `popover.test.tsx`.

## 2. Sidebar children flyout

- [x] 2.1 Extract a shared `NavChildRow` presentational component (label + muted description, `bg-accent`/`text-accent-foreground` when active) from `desktop-navigation-dialog.tsx`'s existing child-row markup (lines ~90-109), and update `desktop-navigation-dialog.tsx` to use it — no visual change to the search dialog.
- [x] 2.2 Build the flyout content component (parent section title as an inert `SidebarGroupLabel`-styled label, then one `NavChildRow` per `NavSubItem`) used by the sidebar.
- [x] 2.3 In `desktop-layout.tsx`'s `NavMenuItem`, wire the flyout onto any `item` with `children`: `HoverCardTrigger asChild` wrapping the existing `SidebarMenuButton`/`Link`, controlled `open` state (local to the item) driving both `HoverCardContent` and a `data-open={open || undefined}` attribute on the trigger so `sidebarMenuButtonVariants`' existing (previously unused) `data-open:` classes take effect. Content positioned `side="right"` beside the row, in both expanded and icon-collapsed sidebar states.
- [x] 2.4 Configure `HoverCardRoot`'s `openDelay`/`closeDelay` so a passing pointer doesn't open the flyout, but a brief gap while moving the pointer from trigger to content doesn't close it prematurely; wire a click on the trigger to force `open` immediately (bypassing `openDelay`) for keyboard/click access, and Escape to close it and return focus to the trigger.
- [x] 2.5 For items with children, stop passing the plain `tooltip` prop to `SidebarMenuButton` (the flyout replaces that tooltip in the collapsed state); items without children keep today's tooltip behavior unchanged.
- [x] 2.6 Add the `›` chevron indicator to any sidebar item with children: inline trailing element in the expanded state, small `absolute`-positioned corner badge on the icon in the collapsed state.
- [x] 2.7 Confirm (already true per `use-section-entry-path.ts`) that clicking a section's own row keeps navigating via the existing `getEntryPath` resolution regardless of flyout open state — add/adjust a test asserting this explicitly for a section with children.

## 3. Desktop header simplification

- [x] 3.1 In `apps/web/src/fsd/app/layout/desktop-section-header.tsx`, delete `MAX_INLINE_TABS`, the `DropdownMenu`-based breadcrumb-picker branch, and the inline `Link`-based tab row (and the now-unused `slug`/`ChevronDown`/`DropdownMenu*` imports).
- [x] 3.2 Replace with: plain `<h1>{title}</h1>` when the active section has no children (unchanged), else a plain, non-interactive `"{title} › {activeChild label}"` breadcrumb, reusing the same `activeChild ?? children[0]` fallback the current dropdown branch already computes.
- [x] 3.3 Update `desktop-section-header.test.tsx`: remove assertions on `section-tabs`/`section-tab-*`/`section-header-dropdown*` test IDs and the >6-children dropdown behavior; add assertions for the new static breadcrumb text and its absence of interactivity (no button/link role on either segment).

## 4. Account menu repositioning (`auth-control.tsx`, desktop branch only)

- [x] 4.1 Swap the desktop trigger's `UserRound` icon for `AccountAvatar` (already used in the `isMobile` branch), sized appropriately for both the expanded (`max-w-56`) and `compact` (`size-8`) trigger states.
- [x] 4.2 Change the desktop `Popover`/`PopoverContent` to `side="top" align="start"`, drop the `w-56` width constraint, and size it to comfortably hold the new identity header, allowing it to visually extend past the sidebar's right edge.
- [x] 4.3 Render the new `PopoverArrow` (from task 1.4) inside the desktop `PopoverContent`, positioned toward the trigger.
- [x] 4.4 Add an identity header block (avatar + `accountName` + `accountEmail`, non-interactive) above the existing three menu actions (Import from V1 / Manage account / Sign out), with a separator between the identity header and the actions matching the existing action-to-action spacing.
- [x] 4.5 Ensure the trigger shows a visibly highlighted state while its popover is open (reuse or extend existing open-state styling already present on the trigger button).
- [x] 4.6 Update `auth-control.test.tsx`: assert the desktop trigger renders `AccountAvatar` (not the generic icon), assert the identity header (name + email) is present when the menu is open, and assert `side="top"` positioning if testable; leave the `isMobile` branch's assertions untouched.

## 5. Tour and copy review

- [x] 5.1 Review `tour.steps.navigation.content` (desktop shell tour, `general.tutorial.tsx`) for accuracy given the new hover-flyout affordance; update the copy in `apps/web/public/locales/*/common.json` (all supported locales) only if the existing wording becomes misleading — confirmed `general.tutorial.tsx`'s and its test's `data-testid` targets (`desktop-nav-*`) are unaffected by this change and need no selector updates.

## 6. Verification

- [x] 6.1 Manual verification at a desktop viewport (>=768px): expanded sidebar — hover and click each of Lookup, Goals, Dailies, Progress, and Guild (single child) to confirm the flyout opens beside the row with the parent label muted at top and children below; confirm clicking the section row itself still navigates via last-visited-child resolution; confirm the header shows the plain "{Section} › {Child}" breadcrumb with no clickable segments.
- [x] 6.2 Manual verification of the same flows with the sidebar collapsed to icons.
- [x] 6.3 Manual verification of the account menu: opens upward with a visible tail, overlaps past the sidebar edge, shows avatar/name/email above the existing actions, in both expanded and collapsed sidebar states.
- [x] 6.4 Run the repository-wide gates: `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`.
