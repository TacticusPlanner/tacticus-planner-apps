## Why

`/library/machines-of-war` and `/library/npcs` share `LibraryCollectionPage`,
which renders a working-looking entity Select and, once something is picked,
a "Selected: X [Clear]" box — but nothing else. There is no real detail
view behind it (the already-deferred `LIB-04`/`LIB-05` bucket in
`DEFERRED.md` covers building one). The interactive picker reads as broken
rather than unfinished: a user picks an entity expecting detail content and
gets an empty acknowledgment box instead. Replacing the picker with an
honest "not available yet" placeholder is a small, separate fix from
building the real detail views — it doesn't reduce the eventual work
`LIB-04`/`LIB-05` still cover, it just stops presenting unfinished
functionality as if it works today.

## What Changes

- `LibraryCollectionPage` (for `machines-of-war` and `npcs` only) stops
  rendering the entity `Select` and the "Selected: X [Clear]" box. Once
  records have loaded and at least one exists, it shows a static
  placeholder message instead (e.g. "Detailed Machines of War pages aren't
  available yet — check back soon.", naming the collection).
- The loading state ("Loading Library records…") and the genuinely-empty
  state ("No selectable entities are available.") are unchanged — those
  are existing, distinct, still-meaningful states (a data problem, not a
  roadmap message) already governed by `library-entity-routes`.
- **Deliberately not touched**: the underlying entity-ID URL
  canonicalization (`useLibraryRouteSelection` — redirects
  `/library/machines-of-war` to `/library/machines-of-war/{firstId}`,
  accepts a direct entity URL, preserves secondary query params). That
  behavior is governed by the `library-entity-routes` capability and nothing
  about it is user-visible anymore once the picker is gone, so leaving it
  running is harmless and keeps this change from reopening that spec.
- Remove the now-unused `selector.*` i18n keys (`label`, `placeholder`,
  `selected`, `clear`) and add a new `collections.detailUnavailable` key,
  in all four locales.
- Raid Bosses (`RaidBossesPage`/`LibraryNoRecordsPage`) and Characters
  (`CharacterLookupPage`) are untouched — both already have real detail
  views; `LibraryCollectionPage` is used only by Machines of War and NPCs.

## Capabilities

### New Capabilities

- `library-detail-placeholder`: what a Library collection with no detail
  view yet (Machines of War, NPCs) shows once its entity records have
  loaded, instead of an interactive picker.

### Modified Capabilities

None — `library-entity-routes` (canonical URLs, redirects, entity-ID
handling) is unaffected; this proposal changes what the page's body
renders once records are loaded, not routing/selection behavior.

## Impact

- `apps/web/src/fsd/pages/library/ui/library-collection-page.tsx` —
  `LibraryCollectionPage`'s rendered body only; `LibraryNoRecordsPage`
  (same file, Raid Bosses' fallback) is untouched.
- `apps/web/src/fsd/pages/library/ui/library-collection-page.test.tsx` —
  the two tests exercising the removed Select (`"canonicalizes Machines of
War..."`, `"selects an NPC through..."`) are replaced with tests for the
  new placeholder; the `LibraryNoRecordsPage` test is untouched.
- `apps/web/public/locales/{en,de,es,fr}/library.json` — remove
  `selector.*`, add `collections.detailUnavailable`.
- No route changes (`route.tsx`'s path list is unchanged), no API changes,
  no cross-repo companion change.
