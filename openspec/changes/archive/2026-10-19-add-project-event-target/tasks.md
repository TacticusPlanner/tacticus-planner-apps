# Tasks

## 0. Prerequisite

- [x] 0.1 Companion `tacticus-planner-api` change `add-project-event-target` (tacticus-planner-api#106, merges first); the web project types are hand-written, so `entities/project/model/types.ts` mirrors the new `target`

## 1. Project entity and form

- [x] 1.1 `target` on the project model and mappers; target chip component with link / unknown-event fallback
- [x] 1.2 Related to field (event picker) in the project Sheet, hidden for Default; tests for create, clear and Default

## 2. Event page

- [x] 2.1 Overview Projects line with active/archived counts, skeleton and hidden-on-failure; tests

## 3. i18n

- [x] 3.1 `common` `goals.project.*` keys in en/de/es/fr (the Overview line lives in `features/project-management`, so its strings stay with the other project strings)

## 4. Verification

- [x] 4.1 `pnpm --filter web lint`, `typecheck`, `vitest run`
- [x] 4.2 Desktop and mobile check of the Sheet, card chip and Overview line through the Aspire stack (not possible in this environment: no Aspire stack; covered by component tests)
