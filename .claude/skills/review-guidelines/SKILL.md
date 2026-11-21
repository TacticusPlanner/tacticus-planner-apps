---
name: review-guidelines
description: This repo's code review rules — what to flag in a diff or PR to apps/web or packages/*, at what severity, and what to skip, pointing to the skill that owns each rule (ui-style-guide, ui-sizing, naming-conventions, feature-sliced-design, react-i18next, vitest). Use when reviewing a diff or pull request in this repo, including inside the built-in /code-review or /simplify, or when triaging CodeRabbit findings.
---

# Review guidelines

These rules add to a general review; they don't replace it. Correctness bugs
come first. Use the conventions below to find what a general reviewer can't
know about this repo. Each rule names the skill or file that owns it. Open
that file to check a finding; don't review from memory.

Review the diff against `main` (the PR's base). Flag a convention only on
lines the diff adds or changes. Leaving untouched legacy code as it was is
fine.

## Severity

- **Blocking**: data loss, a broken contract or route for users already on
  production, a security issue, an edited generated file, or a weakened test.
- **Should fix**: a broken rule from the sections below that lint, `steiger`
  or tests don't already catch.
- **Nit**: wording or naming where the owning skill allows either choice.
  Leave nits out when the review is capped.

When you report a convention finding, name the rule (skill and rule number or
section), for example "ui-style-guide rule 8: confirm uses `AlertDialog`".

## Skip

- Formatting, import order and Tailwind class order. Prettier and lefthook
  handle these.
- Anything ESLint, knip, `steiger` (`pnpm lint:fsd`) or `tsc` already
  reports. CI runs them. Do flag a new `eslint-disable` that gives no reason,
  and any new entry in `apps/web/eslint-suppressions.json`.
- The generated paths that `.coderabbit.yaml` filters out (lockfile, datamine
  sprites and pin, `openapi/`, generated ability text). Review only that their
  generator or pin changed with them (see "Generated files").

## 1. Production compatibility (blocking)

V2 is in production. Flag a change to any of these that has no compatible path
for users and their saved data:

- Routes and deep links that users may have bookmarked.
- Persisted storage: the Dexie schema in `packages/player-data` (a new schema
  needs a new `.version(N+1)` block, never an edit to a shipped one),
  `localStorage` keys, and stored formats.
- API calls. The client deploys apart from the API, so a call must work with
  the API in production now.

## 2. Generated files

- API wire types come from `apps/web/src/fsd/shared/api/schema.d.ts`. Flag a
  hand-written request or response type; it should alias the generated schema.
  `apps/web/openapi/api.ref` must not be `local` (AGENTS.md "API types").
- Generated locales (`npcAbilityText`, `raidBoss*`, `upgrades`, `abilities`,
  `characters` and the other datamine namespaces) change only through their
  generator. Name overrides go in `apps/web/datamine/curated-names.json`.
- Game sprites in `apps/web/public/game_catalog/datamines/` are byte copies
  listed in `datamine/sprites.txt`. Images the game doesn't ship go in
  `game_catalog/curated/` and use `curatedAssetUrl()`. Never commit a combined
  image; stack sprites with `LayeredIcon` (AGENTS.md "Game data from the
  datamine").
- `.design-sync/` is generated. Flag hand edits.

## 3. Architecture

- Layer direction and slice public APIs: the `feature-sliced-design` skill.
  Pages don't import pages. Entities don't import features or pages.
  Features don't import sibling features. Code that several pages share
  moves down to an entity or feature and is used through its public API.
- Types and mappers at a boundary (network, IndexedDB, UI): the
  `naming-conventions` skill, "Quick-reference checklist".
- Server state and fetching: the `tanstack-query` skill. Flag server data
  copied into component or global state, and a missing loading or error
  state.
- React patterns: the `vercel-react-best-practices` skill. Flag an effect
  that only derives state (`rerender-derived-state-no-effect`).
- Shared UI comes from `@workspace/ui/components/*` exports, not package
  internals. A new shadcn component goes in `packages/ui`.

## 4. UI

- Run the `ui-style-guide` skill's "Review checklist" on every changed page,
  toolbar, game icon, overlay or string. Cite the rule number.
- Sizes: the `ui-sizing` skill. Flag theme-scale breaks lint can't see, such
  as a size built from a variable.
- Desktop and mobile: check both forms (`useIsMobile()`) when a change touches
  layout or interaction. A visible UI change needs desktop and mobile
  screenshots in the PR.
- A new page has its tour (`<page>.tutorial.tsx` registered through
  `useTourPageSteps`, with i18n step text). See the `react-joyride` skill and
  `openspec/config.yaml`.

## 5. Strings

- Every user-facing string goes through react-i18next, with the English key
  in `apps/web/public/locales/en`. See the `react-i18next` skill. Flag a
  hard-coded string in JSX, `aria-label`, `title` or a toast.
- New and changed copy follows `ui-style-guide` rule 7, including game terms
  and the shared date and number formatter.

## 6. Tests

See AGENTS.md "Testing Guidelines" and the `vitest` skill.

- New or changed logic has a colocated test. Logic tests are `.test.ts`
  (node). `.test.tsx` is for rendering.
- Queries go by role first. Flag a new `data-testid` that a role query could
  reach. Tour targets are the exception.
- Blocking: a weakened or removed assertion, a skipped test, an updated
  snapshot with no behavior change, or a test that covers only the happy path
  of new branching logic.

## 7. CI, build and dependencies

- Workflows: flag a lowered coverage threshold, a removed or skipped check,
  and a new permission or secret reaching a job that runs PR code.
- `apps/web/bundle-budget.json`: growth needs a reason in the PR.
- A new dependency needs a reason, and nothing in the workspace already does
  the job.
