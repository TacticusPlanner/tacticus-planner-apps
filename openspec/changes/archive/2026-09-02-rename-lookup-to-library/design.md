## Context

See [proposal.md](proposal.md) for the motivation and the delta specs for the
behavior contract. The public `pages/lookup` route currently has Character,
abbreviated Machine of War, and NPC children. Character selection is stored in
the `character` query parameter; the other two pages are placeholders, and
there is no Raid Boss catalog dataset or page. The game-catalog package does
already expose Characters and Machines of War, and stores NPC records.

The shared navigation model drives the desktop sidebar flyout, mobile drawer,
mobile child picker, search, header descriptions, and desktop breadcrumb.
Browser titles currently remain the static application title.

## Goals / Non-Goals

**Goals:**

- Establish one canonical, plural `/library` route family and make its selected
  entity identity path-based.
- Keep the existing Character calculation behavior and its secondary URL state
  intact while changing its public entry point.
- Give every named Library collection a navigable collection and entity route,
  with deterministic selection only when its catalog contains records.
- Make all shared navigation context and document titles use the localized
  Library terminology.

**Non-Goals:**

- Adding a Raid Boss dataset, API contract, or detailed entity-data experience.
  Until catalog data exists, that collection has the specified no-records
  state.
- Redesigning Character calculation controls, rank/progression query
  parameters, or the desktop/mobile shell interaction patterns.
- Preserving deprecated `/lookup` links or the `character` query parameter in
  the V2 pre-production application.

## Decisions

### 1. Move the public page slice to `pages/library`, while retaining domain-specific calculation vocabulary

The route-owning page slice and public component names will move from Lookup to
Library so source structure follows the product's new information
architecture. Domain concepts such as `rank-lookup`, calculation view models,
and copy that describes a lookup calculation remain named for their domain;
renaming them would not improve the public route migration and risks unrelated
churn.

The old alternative was a `/library` route that imports `pages/lookup`. That
would leave the removed public concept as the owning page boundary and make
future Library pages harder to organize.

### 2. Treat each collection route as the selection authority

Each Library child page owns its own URL-backed selection because records and
secondary state do not cross collection boundaries. A shared route-selection
helper in the `pages/library` slice will receive a collection path, the
available ordered IDs, the URL parameter, and `navigate`/search state. It will
provide the selected ID plus select and clear operations to the collection UI.

The helper waits for catalog loading, then uses replacement navigation to
canonicalize a missing or invalid ID to the first available entity. If records
are known to be empty, it leaves the collection URL without a selection. It
preserves `URLSearchParams` verbatim except for removing the legacy
`character` key from Library URLs. Selection changes create normal history
entries; automatic canonicalization uses replacement navigation so Back does
not stop on a transient collection-only URL.

Putting selection in a query parameter was rejected because it conflicts with
the required stable entity URLs. Keeping selection in a parent layout state
was rejected because refresh, links, and browser history would no longer be
the source of truth.

### 3. Introduce the four route children without inventing unavailable data

The Library route table will define collection and `:entityId` children for
Characters, Machines of War, NPCs, and Raid Bosses. Character keeps its
existing calculation UI, updated to read the selected ID from the route and
to write it back on character changes. Machines of War and NPCs obtain their
ordered selectable records from the local game catalog and use the shared
selection behavior even while their richer detail experiences remain pending.
Raid Bosses use the same route contract but show the no-records state until a
future catalog/API change supplies records.

This avoids extending an API merely to complete a navigation rename. It also
means a later detailed page or Raid Boss dataset can consume the established
route contract without another URL migration.

### 4. Keep shared navigation declarative and localize public Library copy separately

The app-shell navigation item will be changed to `Library` with four child
descriptors that use the canonical collection paths. This single source keeps
the desktop sidebar, flyout, mobile drawer, mobile header tabs, search,
breadcrumbs, route-entry memory, and landing links aligned.

Library navigation labels and descriptions will use a dedicated `library`
i18n namespace rather than continuing to overload `unitLookup.tabs`; existing
`unitLookup` calculation text remains in its current namespace. The new
namespace is added to every supported locale, registered in the typed resource
definition, and preloaded wherever the always-mounted shell needs it. General
navigation tour copy/targets are updated to Library.

### 5. Derive document titles from the active navigation context

A small app-shell title effect will set the document title from the same
localized section and active-child values used by the header. Library entity
pages use the Library child title plus the application name; the entity ID is
not included, avoiding an additional catalog lookup solely for metadata.
Other pages retain their existing application-title behavior unless they are
already covered by the shared title logic.

## Risks / Trade-offs

- [A shared link contains a removed `character` parameter] → The helper drops
  it while preserving all secondary parameters and selects from the path only.
- [Catalog initialization is asynchronous] → Do not canonicalize until the
  collection's loading state is resolved; explicitly test loading and empty
  states.
- [Raid Boss records are unavailable] → Provide a stable collection route and
  no-records state, and keep API/catalog expansion out of this frontend-only
  change.
- [Renaming navigation touches many shell tests and tours] → Update the
  central descriptors first, then add route-focused regression tests for
  desktop, mobile, search, title, and history behavior.

## Migration Plan

1. Release the route and navigation rename as one frontend deployment, so no
   page links point to a route the same bundle cannot serve.
2. Verify the four collection URLs, direct entity URLs, and old Lookup URLs in
   the deployed bundle; old paths intentionally fall through to the normal
   unknown-route behavior.
3. Roll back by restoring the preceding frontend deployment if a route
   regression is discovered. No persisted schema or server migration is
   involved.
