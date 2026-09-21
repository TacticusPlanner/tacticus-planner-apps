## 1. Implementation

- [x] 1.1 In `apps/web/src/fsd/pages/library/ui/library-collection-page.tsx`, replace `LibraryCollectionPage`'s "has records" branch (the `Select`/`SelectContent`/`SelectItem` picker plus the "Selected: X / Clear" box) with a single placeholder paragraph, `data-testid={`${collection}-library-page`}` on the same element (matching the current testid contract), text from `t("collections.detailUnavailable", { name: t(collectionLabelKey) })` where `collectionLabelKey` maps `"machines-of-war"` → `"collections.machinesOfWar.label"` and `"npcs"` → `"collections.npcs.label"`. Keep the loading branch, the no-records branch, and the `useLibraryRouteSelection`/`useLiveQuery` calls unchanged (call the hook without using its return value, matching `LibraryNoRecordsPage`'s existing pattern in the same file) — verify by reading the updated component.
- [x] 1.2 Remove the now-unused `Select`/`SelectContent`/`SelectItem`/`SelectTrigger`/`SelectValue` and `Button` imports from the file if `LibraryNoRecordsPage` doesn't need them either — verify with `pnpm lint` (unused-import rule) after the edit.
- [x] 1.3 In `apps/web/public/locales/en/library.json`, remove `selector.label`, `selector.placeholder`, `selector.selected`, `selector.clear` (and the now-empty `selector` object itself), and add `collections.detailUnavailable`: `"Detailed {{name}} pages aren't available yet — check back soon."` — verify by re-reading the edited file.
- [x] 1.4 Apply the equivalent removal/addition to `apps/web/public/locales/de/library.json`, `es/library.json`, and `fr/library.json`, with a real translation of the new key at the quality of the surrounding sibling strings in each file — this is part of the task, not a placeholder to translate later.

## 2. Tests

- [x] 2.1 In `library-collection-page.test.tsx`, replace the two tests that drive the removed Select (`"canonicalizes Machines of War and retains secondary query state"`, `"selects an NPC through the path-backed collection selector"`) with tests asserting: the placeholder text renders once records load, naming the correct collection, for both `machines-of-war` and `npcs`; and that no `combobox`/`option` role appears anywhere on the page. Keep the URL-canonicalization behavior itself covered too — assert the URL still redirects to the first record's entity path (`useLibraryRouteSelection`'s existing, unchanged behavior), just without a visible Select driving it. Verify with `pnpm --filter web test:run library-collection-page`.
- [x] 2.2 Confirm the existing `LibraryNoRecordsPage` test ("keeps the empty Raid Boss collection URL and no-records state") still passes unchanged — verify with the same test run.
- [x] 2.3 Confirm the loading-state and zero-records-state paths for `machines-of-war`/`npcs` are still covered (add a case if the removed tests were the only coverage) — verify with the same test run.

## 3. Gates

- [x] 3.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all must pass before this change is considered done.
