## 1. Implementation

- [x] 1.1 In `apps/web/public/locales/en/common.json`, reword `uiKit.subtitle` (e.g. "Preview of the app's reusable UI components." or similar plain phrasing that doesn't name `shadcn`) — verify by re-reading the edited key.
- [x] 1.2 In the same file, reword `uiKit.sections.colors.description` (e.g. "The app's semantic color palette.") — verify by re-reading the edited key.
- [x] 1.3 In the same file, reword `uiKit.sections.dataDisplay.description` (e.g. "Basic table usage and a sortable, filterable data table.") without naming `TanStack` — verify by re-reading the edited key.
- [x] 1.4 Apply the equivalent reworded translations to `apps/web/public/locales/de/common.json`, `es/common.json`, and `fr/common.json` for the same three keys, at the quality of the surrounding sibling strings in each file — this is part of the task, not a placeholder to translate later. Verify by reading each edited file back and confirming no leftover `shadcn`/`TanStack` mentions and no English text in the non-English locales.

## 2. Tests

- [x] 2.1 Grep the four locale files for `shadcn` and `TanStack` after editing and confirm zero remaining matches within `uiKit.*` — verify with a repo search.
- [x] 2.2 Manually load `/ui-kit` on the dev server (or staging) in English and confirm the subtitle and Colors/Data Display section descriptions read as plain copy — verify with a browser check; no existing automated test asserts on this page's rendered copy, so no test file changes are expected.

## 3. Gates

- [x] 3.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all must pass before this change is considered done.
