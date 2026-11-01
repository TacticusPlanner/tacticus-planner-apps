# Tasks

## 1. Contract

- [x] 1.1 `pnpm --filter web api:pull <api sha>` for the API `add-project-deletion` commit; add `deleteProject` with an API test.

## 2. UI

- [x] 2.1 `useProjectActions().remove`: delete, drop the project from the cached list, refetch projects and goals, toast.
- [x] 2.2 `DeleteProjectDialog` (move-to-Default / delete-goals choice) and a destructive Delete item last in every non-Default row's menu.
- [x] 2.3 Strings in en/de/es/fr.

## 3. Tests

- [x] 3.1 `project-row.test.tsx`: menu order on live and archived rows, no Delete on Default, delete only after confirming, cancel keeps it.

## 4. Gates

- [x] 4.1 Targeted vitest, `tsc`, eslint on changed folders, `pnpm lint:fsd`.
- [ ] 4.2 Re-pin `api:pull` to the API merge SHA before merging.
