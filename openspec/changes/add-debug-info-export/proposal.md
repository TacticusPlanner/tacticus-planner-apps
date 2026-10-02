## Why

When a user reports a wrong estimate, a missing raid or a dailies recommendation that makes no sense, the maintainers cannot reproduce it without the user's actual planner state. Today that means screenshots and back-and-forth. A "Download debug info" action in the account menu lets the user produce one plain JSON file, read it themselves, and attach it to a report, so the root cause can be traced from the data they were actually looking at.

Companion API change: `add-debug-info-export` in `tacticus-planner-api` adds the single `GET /api/v1/me/debug-info` endpoint this change consumes. The API half applies first.

## What Changes

- Add a "Download debug info" row to the signed-in account card, on desktop and in the mobile drawer, between "Import from V1" and "Send feedback".
- The row opens an explanatory dialog rather than downloading immediately. The dialog says what happens next, lists what the file contains (roster, inventory, campaign and event progress, goals and project structure, planning settings, app preferences, version and sync context), lists what it never contains (account name, email, ids, Tacticus API key, goal notes, project names and notes), notes that the file is plain JSON the user can open and edit before sending, and advises sending it privately to the maintainers rather than posting it publicly. Its primary action downloads; its secondary action cancels and nothing is fetched.
- On confirm, the client makes one call to the API debug-info endpoint and wraps the response with browser-only context: app version, game catalog version and hash, local player-data sync status, last-synced time and per-chunk hashes, current route, viewport, user agent, locale, and a whitelisted set of localStorage preferences. Authentication storage is never included.
- The result is saved as `tacticus-planner-debug-<date>.json`. Failures surface in the dialog with a retry.
- No import, no encryption, no selective export: the file always contains everything.

## Capabilities

### New Capabilities

- `debug-info-export`: the dialog, the client-side context wrapper, the localStorage whitelist, exclusions and the download behavior.

### Modified Capabilities

- `account-menu`: the account card's section list gains a "Download debug info" row for signed-in users on desktop and mobile; the guest menu is unaffected.

## Impact

- `apps/web/src/fsd/features/debug-info-export` (new): dialog, context collection, download.
- `apps/web/src/fsd/entities/debug-info` (new): API call and response type for the debug-info endpoint.
- `apps/web/src/fsd/app/providers/account-card.tsx`: new row wired to the dialog.
- `apps/web/public/locales/*/common.json` (or a dedicated namespace): dialog and row strings in every supported language.
- `packages/player-data`: a named read of the local sync metadata (hashes, synced-at) for the context block, if none exists.
- Tests: dialog behavior, context wrapper exclusions (no MSAL keys, no account data), download trigger. Account-card tests updated for the new row.
