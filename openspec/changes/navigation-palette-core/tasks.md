## 1. Shared list

- [x] 1.1 Add `CommandInputField` and `CommandItem asChild` to the shared `Command` component
- [x] 1.2 Add `NavigationPalette`, one cmdk list used by the desktop dialog and the mobile Menu drawer, with one highlight and Enter to activate
- [x] 1.3 Replace the old filter, quick-actions group and child-row components

## 2. Ranking

- [x] 2.1 Add `navigation-search.ts`: match tiers, flat ranked results with breadcrumbs, group order by best match
- [x] 2.2 Add search keywords to pages (GW, GR, LE, LRE, MoW, TA, energy, API key…)

## 3. Desktop layout

- [x] 3.1 Anchor the dialog near the top, hide the title from sight, add the search icon, Esc control and footer hints
- [x] 3.2 One-line rows with the highlighted row's description; "You're here" tag; no-match empty state with Clear search

## 4. Copy and tests

- [x] 4.1 Add the new strings in en, de, es and fr
- [x] 4.2 Unit tests for the ranking; update desktop and mobile layout tests for options, arrows and Enter
