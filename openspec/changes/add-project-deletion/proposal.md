## Why

Projects can only be archived, so old event projects pile up in the archived section forever. A UserJot request ("Enable Permanent Project Deletion") asks for a real delete.

Companion API change: `add-project-deletion` in `tacticus-planner-api` (`DELETE /api/v1/projects/{projectId}`). The API half applies first; this change pins its OpenAPI document.

## What Changes

- Every custom project row's overflow menu (live and archived) ends with a destructive **Delete project** action. The Default project offers none.
- Delete opens a confirmation dialog naming the project with a choice for the goals in no other project: move them to the Default project (preselected) or delete them permanently (`?deleteGoals=true`). Goals in another project are always kept. Nothing is sent until the user confirms.
- On success the project leaves the cached list, a "Project deleted." toast shows, and the project list and goal reads are refetched (Default's `goalIds` and goals' `projectIds` change server-side).
- New `deleteProject` API function; regenerated `schema.d.ts` / `openapi/api.json` from the API commit.
- New strings in en/de/es/fr.

## Capabilities

### Modified Capabilities

- `project-management`: lifecycle actions and the row menu gain Delete.

## Impact

- `entities/project/api/project.api.ts`, `features/project-management/model/use-project-actions.ts`, `features/project-management/ui/project-row.tsx`, new `features/project-management/ui/delete-project-dialog.tsx`.
- `public/locales/*/common.json`.
