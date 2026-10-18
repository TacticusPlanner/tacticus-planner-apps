# Tasks

## 0. Prerequisite

- [ ] 0.1 Companion `tacticus-planner-api` change `add-project-event-target` merged; regenerate the web API client

## 1. Project entity and form

- [ ] 1.1 `target` on the project model and mappers; target chip component with link / unknown-event fallback
- [ ] 1.2 Related to field (event picker) in the project Sheet, hidden for Default; tests for create, clear and Default

## 2. Event page

- [ ] 2.1 Overview Projects line with active/archived counts, skeleton and hidden-on-failure; tests

## 3. i18n

- [ ] 3.1 `projects` and `legendaryEvents` keys in en/de/es/fr

## 4. Verification

- [ ] 4.1 `pnpm --filter web lint`, `typecheck`, `vitest run`
- [ ] 4.2 Desktop and mobile check of the Sheet, card chip and Overview line through the Aspire stack
