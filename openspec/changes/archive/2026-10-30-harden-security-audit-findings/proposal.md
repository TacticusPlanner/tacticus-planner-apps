## Why

The API's security-audit hardening adds caps, stricter request validation, a guild sync cooldown, a fresh role check before a guild purge and a sign-in deletion header. Without client changes these surface as raw English server text, or as rejected requests the client could have avoided. This change makes the web client handle each new response with translated, actionable copy, and stops it from sending payloads the API now refuses.

Companion API change: `harden-security-audit-findings` in `tacticus-planner-api` (PR TacticusPlanner/tacticus-planner-api#147). The API half applies first; this half merges right after it.

## What Changes

- **Tacticus user id.** Every form that saves the id (account setup, Account settings, the guild prerequisite card) checks it is a GUID before sending. A non-GUID 400 and the 409 `tacticusUserIdInUse` show as translated messages under the user-id field.
- **Guild sync.** A 429 `guildSyncCooldown` (or the upstream `rateLimited`) reads its `Retry-After`, disables Sync and counts down the seconds left. A 403 says only a Leader or Co-Leader can sync. Sync stays hidden for members who are not Leader or Co-Leader, as today.
- **Guild purge.** The delete dialog explains each refusal: 403 `forbidden`, 400 `validation` (Tacticus rejected the stored token), 503 `upstreamUnavailable`, 409 `concurrency`, 429 `rateLimited`. Each says nothing was deleted.
- **Caps.**
  - Goals: at most 200 non-archived goals per goal type. Goal creation and unarchiving check the loaded goal list first and do not send a request that would pass the cap; the API's `goalLimitReached` reads as translated copy (create sheet, status changes, Legendary Event plan wizard).
  - Projects: at most 100 non-archived projects. Both create paths check the loaded list first; `projectLimitReached` asks the user to archive one.
  - Legendary Event teams: at most 50 per lane. Add team is disabled with a note when the lane is full; every create path checks the confirmed plan first; `legendaryEventTeamLimitReached` reads as translated copy.
- **Goal request bounds.**
  - The create snapshot sends only catalog upgrade ids, each once, trimmed, at most 128 characters, at most 250 entries.
  - A goal edit never sends farming locations for an Ascension goal, and blocks saving more than 100 locations.
  - `dependsOnIndex` entries are always distinct.
  - Upgrade targets already come only on Upgrade goals and from the catalog-scoped picker, well below 250.
- **Account purge.** `DELETE account` now reports `X-Sign-In-Account-Deleted`. When the user asked to delete the sign-in account and it is still there, the dialog says so and offers Sign out instead of signing out at once.
- **V1 import.** New translated copy for goal outcome codes `goal_limit_reached`, `project_limit_reached`, `too_many_goals`, `outcomes_truncated`; Legendary Event issue codes `lane_team_limit_reached`, `issues_truncated`; user-id part codes `invalid_tacticus_user_id`, `tacticus_user_id_conflict`.
- **Error contract.** `ApiError` carries `Retry-After` seconds.
- The typed client is regenerated from the API branch's OpenAPI artifact.

## Capabilities

### New Capabilities

- `tacticus-user-id-entry`: client-side GUID validation and field-level messages for every form that saves the Tacticus user id.
- `account-purge`: the account purge dialog's handling of the sign-in deletion result.

### Modified Capabilities

- `api-error-handling`: a failed response's `Retry-After` is read into the error.
- `guild-access-onboarding`: the sync cooldown, the sync 403 and the purge refusals.
- `goal-creation`: the per-type goal cap and the snapshot and dependency bounds.
- `goal-status-actions`: unarchiving respects the per-type goal cap.
- `goal-edit-dialog`: the farming-location bounds.
- `project-management`: the project cap.
- `legendary-event-teams`: the per-lane team cap.
- `v1-profile-import`: copy for the new outcome, issue and part codes.

## Impact

- `apps/web/openapi/api.json`, `api.ref`, `src/fsd/shared/api/schema.d.ts`: regenerated, pinned to the API branch head.
- `shared/api/api-client.ts`: `retryAfterSeconds`.
- `entities/account`, `entities/guild` (new `useGuildSync`), `entities/goal` (limits, snapshot bounds), `entities/project` (limit), `entities/legendary-event` (team cap, write-queue toast).
- `features/account`, `features/guild-access`, `features/goal-create`, `features/goal-planning`, `features/project-management`, `features/legendary-event-plan`, `features/v1-import`.
- `pages/guild`, `pages/legendary-events`.
- `public/locales/{en,de,es,fr}/common.json` and `legendaryEvents.json`.
- No new page, route, namespace or tour step.
