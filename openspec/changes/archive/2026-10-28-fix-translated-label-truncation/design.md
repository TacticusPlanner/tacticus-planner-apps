## Context

The reported surfaces all use Tailwind `truncate` (single line, ellipsis) inside a `min-w-0 flex-1` column, or a fixed trigger width (`w-56` on `ProjectSelect`). The clipping is layout-driven, not data-driven; the localized strings are correct.

## Decisions

- Prefer wrapping over widening: replace `truncate` with `break-words` (or `line-clamp-2` where a row must stay bounded) on the campaign name and node label in `today-page.tsx` and `location-row.tsx`. Rows grow by one line in the worst case; the icon column stays aligned to the top.
- `ProjectSelect`: drop the fixed `w-56` in favour of `min-w-56` (content decides). Verify the Radix `position="popper"` content still aligns.
- Dailies tabs: the mobile `SectionTabs` row already scrolls horizontally, so labels should not be truncated there; confirm during reproduction and fix whichever element (tab trigger or desktop section-menu item) actually clips. `revamp-desktop-navigation` replaces the desktop flyout with a section menu; coordinate rather than fix the flyout twice.
- Fixed-height cards elsewhere (guild raid boss/prime cards, shop cards) are out of scope unless reproduction shows a report about them; leave their `truncate` in place.

## Risks / Trade-offs

- Two-line labels change row height in the schedule; existing rendering tests need updating. Today tutorial targets are unaffected.
