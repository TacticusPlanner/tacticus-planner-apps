## Context

See `proposal.md` - Why/What Changes for motivation and scope. This document covers the desktop-only implementation approach for two independent pieces that happen to ship together: the sidebar children flyout (replacing the header's child-picker) and the account menu's repositioning/identity header.

Relevant existing code, already read during exploration:

- `apps/web/src/fsd/app/layout/desktop-layout.tsx` - `NavMenuItem` renders each sidebar row as a plain `SidebarMenuButton` `asChild` wrapping a `Link`.
- `apps/web/src/fsd/app/layout/desktop-section-header.tsx` - owns the header's title row, including the `MAX_INLINE_TABS` threshold and breadcrumb-dropdown branch being removed.
- `apps/web/src/fsd/app/layout/nav-items.ts` / `resolve-active-navigation.ts` - existing `NavItem`/`NavSubItem` data and `activeItem`/`activeChild` resolution; unchanged by this design.
- `apps/web/src/fsd/app/layout/desktop-navigation-dialog.tsx` (child rows, lines ~88-112) and `mobile-drawer-sub-item.tsx` - existing label+description child-row markup this design reuses rather than re-inventing.
- `packages/ui/src/components/sidebar.tsx` - `sidebarMenuButtonVariants` already contains unused `data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground` classes (line ~475), and `SidebarMenuButton`'s own tooltip (line ~496-545) already renders a `Tooltip` with `side="right"`, `hidden={state !== "collapsed" || isMobile}` - the flyout replaces this tooltip specifically for items that have children.
- `packages/ui/src/components/popover.tsx` - thin wrapper around `radix-ui`'s `Popover` primitive; forwards `side`/`align`/`sideOffset` already. No `Arrow` sub-component exposed today.
- The workspace depends on the unified `radix-ui` npm package (`packages/ui/package.json`, `"radix-ui": "catalog:"`), which re-exports every Radix primitive - including `HoverCard`, which is not yet wrapped anywhere in `packages/ui/src/components`.

## Goals / Non-Goals

**Goals:**

- Reuse existing primitives, styling hooks, and row markup wherever they already fit, rather than introducing parallel implementations of the same concept.
- Keep the flyout and the account menu's positioning implemented with the same Radix positioning engine (Popper, via `side`/`align`/`sideOffset`) already used by `Popover` and `Tooltip` in this codebase, for consistent behavior (collision handling, portal rendering, animations).

**Non-Goals:**

- Redesigning `nav-items.ts`'s data shape - `NavItem`/`NavSubItem` are unchanged.
- Any mobile-layout change - `mobile-layout.tsx`, `mobile-header.tsx`, `mobile-drawer-sub-item.tsx` are untouched.
- Reworking `DesktopNavigationDialog` (Cmd/Ctrl+K search) beyond what's needed to share row markup with the new flyout.

## Decisions

### The sidebar flyout is built on Radix `HoverCard`, not `Popover` or `DropdownMenu.Sub`

`HoverCard` is Radix's purpose-built primitive for "hover a trigger, get positioned rich content, with independent open/close delays" - exactly this feature. Two alternatives were considered and rejected:

- **`Popover`** (already used for the account menu) is click-triggered by design; hovering it would mean manually reimplementing open/close-delay timers and pointer-tracking that `HoverCard` already provides for free.
- **`DropdownMenu.Sub`/`SubTrigger`/`SubContent`** is Radix's hover-or-click submenu primitive, but it is designed to nest _inside_ an already-open parent `DropdownMenu` - it isn't meant to be used as a standalone flyout off an always-visible sidebar row that isn't itself part of a collapsed menu. Forcing every top-level sidebar row into one giant `DropdownMenu.Root` to use `Sub` would be the wrong composition for links that must remain individually focusable and always visible.

`HoverCard` needs a new wrapper component, `packages/ui/src/components/hover-card.tsx`, following the exact pattern already established by `popover.tsx` (a thin `data-slot`-tagged wrapper around the Radix primitive, `sideOffset` default, animation classes matching the existing `PopoverContent`/`TooltipContent` conventions). No new dependency: it comes from the same `radix-ui` package already installed.

`HoverCardContent` is controlled (`open`/`onOpenChange` on `HoverCardRoot`), so a click on the trigger can force it open immediately (bypassing the hover-open delay) to satisfy the "click also opens it" requirement and keyboard operability - Enter/Space on a focused trigger fires the same `onClick`. Content itself is a list of ordinary `<Link>` elements (not an ARIA menu/listbox), so they remain independently Tab-focusable without needing roving-tabindex/arrow-key handling to be accessible.

### The flyout's open state is tracked locally per sidebar item, driving the existing `data-open` CSS hook directly

`sidebarMenuButtonVariants` already has `data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground` baked in but unused. Rather than bridging Radix's own `data-state="open"` attribute naming into a new Tailwind variant, `NavMenuItem` for an item with children keeps a local `open` boolean (the same value driving `HoverCardRoot`'s `open`/`onOpenChange`) and sets `data-open={open || undefined}` directly on the `SidebarMenuButton` it renders - zero new CSS, exactly the hook the component already ships with.

### Child rows reuse a single shared component across the flyout and the Cmd/Ctrl+K dialog

`DesktopNavigationDialog`'s child rows (label + muted description, `bg-accent`/`text-accent-foreground` when active) are extracted into a shared presentational component (e.g. `NavChildRow`) used by both the dialog and the new flyout, instead of duplicating that markup a third time. `MobileDrawerSubItem` is left as its own component - it has different touch-target sizing (`min-h-10` vs the dialog's `min-h-9`) suited to mobile, and mobile is out of scope for this change, so unifying it isn't worth the risk of an incidental mobile-visual change.

### Chevron indicator: inline suffix when expanded, small corner badge when collapsed

In the expanded sidebar, the `›` chevron renders as a normal trailing inline element in the row (same place a `SidebarMenuBadge` would sit) for any item with children. In the icon-collapsed sidebar (`size-8`, icon only), there is no room for an inline suffix, so the chevron renders instead as a small `absolute`-positioned corner badge on the icon button. Both states use the same underlying "does this item have children" check (`item.children?.length`).

### Header breadcrumb reads directly from `resolveActiveNavigation`'s existing output

`desktop-section-header.tsx` already receives (via `app-shell.tsx`) everything needed - `activeItem`/`sectionTitle` and, once threaded through, `activeChild`'s label. No new resolution logic is needed; the component just renders `{sectionTitle}` alone when `item.children` is empty, or `{sectionTitle} › {t(activeChild.labelKey)}` as plain text otherwise, using the same `activeChild ?? children[0]` fallback the current dropdown branch already uses. The `MAX_INLINE_TABS` constant, the `DropdownMenu`-based picker, and the inline `Link` row are deleted outright.

### Account menu tail uses Radix `Popover.Arrow`, added to the existing `PopoverContent` wrapper

`radix-ui`'s `Popover` primitive already exposes an `Arrow` sub-component that auto-positions itself to point at the trigger, matching `side`/`align`; it just isn't wrapped in `packages/ui/src/components/popover.tsx` today. Add a `PopoverArrow` export there (styled to match `PopoverContent`'s `bg-popover`/`ring-1 ring-foreground/5` treatment) and render it inside `AuthControl`'s desktop `PopoverContent`, rather than hand-rolling a CSS-triangle pseudo-element tail. `AuthControl` switches its desktop `Popover` to `side="top" align="start"`, drops the `w-56` width constraint that was keeping it inside the sidebar's own width, and widens it enough to comfortably hold the new identity header (avatar + two-line name/email) - this is what allows it to overlap past the sidebar's right edge into the content area, matching the reference image.

## Risks / Trade-offs

- **New primitive (`HoverCard`) added to the shared UI package** → Mitigated by following the exact wrapper pattern already used for every other Radix primitive here (`popover.tsx`, `tooltip.tsx`, `dropdown-menu.tsx`), so it's consistent with the rest of `packages/ui/src/components`, not a one-off.
- **Hover-to-open UI can be awkward for mouse users moving diagonally toward the flyout content** (a common HoverCard/submenu UX pitfall - the pointer leaves the trigger before reaching the content) → Mitigate with a reasonably generous `sideOffset`/hitbox and a short `closeDelay` (not just `openDelay`) on `HoverCardRoot`, so a brief gap while crossing to the content doesn't close it prematurely.
- **Collapsed-sidebar corner-badge chevron is a new, small visual element with limited room** → Low risk; it only needs to be legible as a static "has more" hint, not read text, and can be verified visually during implementation at the actual `size-8` trigger size.
- **`desktop-section-header.test.tsx`, `desktop-layout.test.tsx`, `auth-control.test.tsx`, and the shared shell Joyride tour (`general.tutorial.tsx` + its test) all assert `data-testid`s this change removes or changes** (`section-tabs`, `section-header-dropdown*`, plain `auth-account-trigger` icon) → Addressed explicitly in tasks.md as its own step, not left implicit.

## Migration Plan

No data migration. This is a pure UI change behind no feature flag - ship as a single change. Rollback, if needed, is a plain revert since nothing persists new state (the existing `sessionStorage`-backed last-visited-child tracking in `use-section-entry-path.ts` is untouched).
