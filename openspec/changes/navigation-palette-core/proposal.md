## Why

Navigation search (top-bar search or Ctrl/Cmd+K on desktop, Menu on phones) looks like a command palette but doesn't work like one. In the local app, ↑/↓ and Enter do nothing in the field, so reaching Collection takes 9 Tab presses. Results come back in menu order rather than by how well they match. For "raid", Raids is the 5th row, because Teams and Schedule mention raids in their descriptions. Common shorthand ("gw", "lre") finds nothing. Quick actions use a solid gold hover (`hover:bg-accent`, which ui-style-guide rule 9 does not allow), while page rows use a grey hover. The current page also keeps its gold tint while you search, so it reads as the top result. On desktop the dialog is centred, so its field jumps about 210px when results shrink, and the title and hint above the field take about 100px.

## What Changes

- One shared navigation list for the desktop dialog and the mobile Menu drawer, built on the shared `Command` (cmdk) component. It gives one highlighted row, moved with ↑/↓ (and Home/End) or by the pointer, and Enter opens the highlighted page or runs the highlighted action. The first row is highlighted on open and after every query change.
- **BREAKING (spec)**: Enter in the field now activates the highlighted row. The old rule, that Enter in the field runs nothing, existed because there was no visible selection.
- One highlight style: the `interactive-surface` gold tint plus a gold inset edge, the same for keyboard and pointer. The current page shows a small "You're here" tag instead of the full active tint.
- When a query is typed, results become one flat list ranked by match quality (label starts with the query, then a word in the label starts with it, then a keyword, then the description). Each result shows its parent section as a muted breadcrumb. Pages get search keywords the way quick actions already have them (GW, GR, LE, LRE, HSE, HRE, TA, MoW, energy…). With an empty query, the grouped tree stays.
- Desktop: the dialog is anchored near the top so the field never moves. The title becomes screen-reader only and the hint line is dropped. The field carries a search icon and an Esc hint. Rows are one line, and only the highlighted row shows its description. A footer shows the ↑ ↓ ↵ Esc hints.
- No match shows the shared `EmptyState` (no-match) with "Clear search".

## Capabilities

### Modified Capabilities

- `app-navigation`: navigation search ranking, keyboard selection, highlight and desktop layout.

## Impact

- `apps/web/src/fsd/app/layout/`: `desktop-navigation-dialog.tsx`, `mobile-layout.tsx` (list only; the phone layout changes in `navigation-palette-phone`), `navigation-filter.ts`, `quick-actions*.ts(x)`, `nav-items.ts` (keywords), new shared list component and ranking logic, plus tests.
- `apps/web/public/locales/en/common.json`: footer hints, "You're here", keywords.
- No API change.

Part of a 4-PR stack: core (this), `navigation-palette-phone`, `navigation-palette-entity-search`, `navigation-palette-analytics`.
