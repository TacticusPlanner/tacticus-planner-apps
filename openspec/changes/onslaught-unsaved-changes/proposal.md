## Why

On the Onslaught page, Save is always enabled, so it gives no hint whether anything changed. Leaving the page with edits (in-app navigation, closing or reloading the tab) drops them without a warning. The position is only ever entered here, and goal shard estimates read it, so a lost edit quietly leaves the estimates wrong. This is the part of #159 that #215 did not cover, tracked as #291.

## What Changes

- Save is enabled only while the edited positions differ from the saved ones. Changing a value back to its saved value counts as unchanged, and a successful save or a revision conflict leaves nothing to save.
- With unsaved edits, navigating to another page in the app asks "Leave without saving?" with Stay and Leave, and closing or reloading the tab triggers the browser's own prompt.
- The page's draft handling moves to the shared `useRevisionedDraft` hook that Campaign Events already uses, which brings the structural dirty check and the 409 conflict reload with it. No API or storage change.
- New translated strings for the leave dialog in en, de, es and fr.

## Capabilities

### New Capabilities

### Modified Capabilities

- `onslaught-progress-entry`: adds a requirement for the Save state and the leave prompt.

## Impact

- `apps/web/src/fsd/pages/onslaught/ui/onslaught-page.tsx` and its test.
- `apps/web/public/locales/{en,de,es,fr}/common.json`: `onslaught.leave.*`.
- Reuses `shared/api/use-revisioned-draft.ts` and `shared/ui/unsaved-changes-guard.tsx` unchanged.
