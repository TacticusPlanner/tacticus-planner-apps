## Why

The desktop shell splits a section's navigation across two disconnected surfaces: child pages live as tabs/breadcrumb-dropdown in the top header, while the sidebar shows only top-level sections. This forces a two-step mental model (pick a section in the sidebar, then re-orient in the header to find its subpages) and leaves the header doing double duty as both a page title and a navigation control. Consolidating child-page navigation into the sidebar itself — next to the item it belongs to — lets the header go back to being a plain, readable title, and matches navigation patterns already familiar from comparable dashboard products. Separately, the desktop account menu is a plain dropdown with no identity context (no avatar, no email) and opens directly beneath its trigger with no visual relationship to it; repositioning it to a bottom-left "account card" treatment brings it in line with the same class of product and reuses the avatar component the mobile layout already has.

## What Changes

- **BREAKING (spec)**: The desktop sidebar now renders a hover/click flyout submenu for any top-level section that has child pages, opening beside that section's own row. This directly reverses `app-navigation`'s existing "Desktop sidebar lists top-level sections only" requirement, which explicitly forbade rendering children, chevrons, or a sub-list in the sidebar.
- The flyout applies uniformly to every section with children (Lookup, Goals, Dailies, Progress, and single-child Guild), in both the expanded and icon-collapsed sidebar states, opening on hover (with a short delay) or click.
- Each flyout shows the parent section's own title as a quiet, non-interactive label at the top (reusing the sidebar's existing muted group-label style), followed by one row per child page in the existing label+description style already used elsewhere in this app's navigation surfaces (search dialog, mobile drawer).
- A small chevron indicator marks any sidebar item that has children, in both sidebar states, as a static hint independent of hover state.
- Clicking a section's own sidebar row (not a child row within its flyout) keeps navigating via the existing last-visited-child resolution — unchanged.
- **BREAKING (spec)**: The desktop header's child-picker (the inline nav-link row, and the breadcrumb dropdown for sections with more than 6 children) is removed. The header title becomes a plain, non-interactive "{Section} › {Active child}" breadcrumb-style label for sections with children (plain section title, unchanged, for sections without children). Neither breadcrumb segment is a link; the header no longer offers a way to switch children — that now happens only through the sidebar flyout (or search, or the mobile drawer, unaffected).
- The desktop account menu (`AuthControl`) trigger swaps its generic person icon for the existing `AccountAvatar` initials bubble (already used on mobile), so desktop and mobile show the same identity avatar.
- The desktop account menu's popover repositions to open upward (`side="top"`) from its bottom-left trigger, is allowed to visually overlap outside the sidebar's edge into the main content area, and gains a pointer/tail connecting it back to the trigger.
- The desktop account menu gains an identity header block (avatar, display name, email) above its existing actions (Import from V1, Manage account, Sign out); the existing actions themselves are unchanged.
- Mobile navigation (bottom bar, menu drawer, drawer search) and the mobile account drawer are unaffected by any of the above.

## Capabilities

### New Capabilities

- `account-menu`: Defines the desktop account menu's trigger, positioning, and identity-header content — a shell-level concern distinct from route navigation, with no existing spec covering it today.

### Modified Capabilities

- `app-navigation`: The desktop sidebar's "top-level sections only" restriction is reversed (it now renders a children flyout per section); the desktop header's child-picker requirement is replaced by a static, non-interactive breadcrumb; the "shared page header hosts a section's child-page picker" requirement is narrowed to mobile only, since desktop's child-page discovery moves to the sidebar flyout.

## Impact

- `apps/web/src/fsd/app/layout/desktop-layout.tsx` — sidebar item rendering gains the flyout trigger/content, chevron indicator, and open-state wiring.
- `apps/web/src/fsd/app/layout/desktop-section-header.tsx` — child-picker logic (inline tabs, breadcrumb dropdown, `MAX_INLINE_TABS`) removed and replaced with a static breadcrumb label.
- A new component for the flyout's child-row list, reusing the existing label+description row style from `desktop-navigation-dialog.tsx` / `mobile-drawer-sub-item.tsx`.
- `apps/web/src/fsd/app/providers/auth-control.tsx` — desktop branch only: trigger icon, popover positioning/sizing, and new identity header block.
- `packages/ui/src/components/sidebar.tsx` — no required change, but its existing (currently unused) `data-open` styling hooks on `SidebarMenuButton` are expected to be wired up rather than duplicated.
- `packages/ui/src/components/popover.tsx` — may need a tail/arrow primitive added (none exists there today) to support the account menu's pointer treatment.
- Tests: `desktop-layout.test.tsx`, `desktop-section-header.test.tsx`, `auth-control.test.tsx`, and the shared shell Joyride tour (`apps/web/src/fsd/shared/tour/general.tutorial.tsx` and its test) which targets `data-testid`s on the header tabs/dropdown and the account trigger that this change alters.
- No backend, API, or mobile-layout changes.
