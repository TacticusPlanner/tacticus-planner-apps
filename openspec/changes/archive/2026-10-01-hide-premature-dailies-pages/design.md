## Context

The three pages are registered in two places: as `children` of the `/dailies` nav item (`app/layout/nav-items.ts`), which drives the mobile section tabs, the desktop section menu, and navigation search; and as child routes in `pages/dailies/route.tsx`. Nothing else links to them.

## Decisions

- Delete the three nav children and the three route entries. Do not add a hidden flag, feature toggle, or redirect: there is no second consumer that would need the pages back, and re-adding six lines is cheaper than maintaining a switch.
- Keep `pages/dailies/ui/onslaught`, `ui/arena`, `ui/salvage-run`, and their model hooks in place so the work is not lost. They are simply unreachable. Their specs stay in `openspec/specs/` as-is; a later change that reintroduces the pages re-adds them to `dailies-navigation`.
- Remove the `dailies:tabs.onslaught|salvage-run|arena(+Description)` keys from all four locales and from the nav label-key union so the translation resources and types stay honest.

## Risks / Trade-offs

- Users with bookmarks land on the unknown-route page. Acceptable; the pages had no measurable use.
