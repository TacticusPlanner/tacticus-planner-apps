---
name: vitest
description: Vitest fast unit testing framework powered by Vite with Jest-compatible API. Use when writing tests, mocking, configuring coverage, or working with test filtering and fixtures.
metadata:
  author: Anthony Fu
  version: "2026.1.28"
  source: Generated from https://github.com/vitest-dev/vitest, scripts located at https://github.com/antfu/skills
---

Vitest is a next-generation testing framework powered by Vite. It provides a Jest-compatible API with native ESM, TypeScript, and JSX support out of the box. Vitest shares the same config, transformers, resolvers, and plugins with your Vite app.

**Key Features:**

- Vite-native: Uses Vite's transformation pipeline for fast HMR-like test updates
- Jest-compatible: Drop-in replacement for most Jest test suites
- Smart watch mode: Only reruns affected tests based on module graph
- Native ESM, TypeScript, JSX support without configuration
- Multi-threaded workers for parallel test execution
- Built-in coverage via V8 or Istanbul
- Snapshot testing, mocking, and spy utilities

> The skill is based on Vitest 3.x, generated at 2026-01-28.

## This repo's test harness (`apps/web/src/test`)

Every web test runs with real providers set up by `src/test/setup.ts`; do not mock
`react-i18next`, `@azure/msal-react`, `@workspace/game-catalog/queries`
or `@workspace/player-data/queries` by module path.

- **Translations**: a real English i18next instance (all `public/locales/en/*.json`). Query by
  the visible English copy, never by translation key.
- **Auth**: `@azure/msal-react` is a test stub. Signed out by default; call
  `setTestAuth({ authenticated: true })` (from `@/test/auth`) or pass `auth` to `render`.
  The stub's `instance` methods are `vi.fn`s; an unimplemented method throws.
- **IndexedDB**: `fake-indexeddb` runs the real catalog and player-data stores. Seed with
  `seedGameCatalog({ characters: [...] })` / `seedPlayerData({ characters: [...] })` from
  `@/test/seed`; both databases are deleted after each test. Fixtures carry only the
  fields the code reads. Local reads resolve after mount, so use `findBy*` / `waitFor`. Reads are not live: after re-seeding
  mid-test, call `refreshLocalDataAfterSync(queryClient, source, keys)` (`render` / `renderHook`
  return `queryClient`).
- **Render**: `render(ui, options)` from `@/test/render` adds a fresh `QueryClient` and
  `TooltipProvider`. Optional: `route` + `initialEntries` (memory data router),
  `theme: true` (real `ThemeProvider`), `auth`.

```tsx
// from apps/web/src/test/harness.test.tsx
await seedGameCatalog({ characters: [{ id: "ultraCalgar", name: "Calgar" }] })

const { result } = renderHook(() => useCatalogDataset("characters"))

await waitFor(() =>
  expect(result.current).toMatchObject({
    status: "ready",
    data: [{ id: "ultraCalgar" }],
  })
)

render(<Probe />, {
  route: "/plan/goals/:goalId",
  initialEntries: ["/plan/goals/g1"],
})

expect(await screen.findByText("g1 at /plan/goals/g1")).toBeInTheDocument()
```

## Core

| Topic         | Description                                                     | Reference                                    |
| ------------- | --------------------------------------------------------------- | -------------------------------------------- |
| Configuration | Vitest and Vite config integration, defineConfig usage          | [core-config](references/core-config.md)     |
| CLI           | Command line interface, commands and options                    | [core-cli](references/core-cli.md)           |
| Test API      | test/it function, modifiers like skip, only, concurrent         | [core-test-api](references/core-test-api.md) |
| Describe API  | describe/suite for grouping tests and nested suites             | [core-describe](references/core-describe.md) |
| Expect API    | Assertions with toBe, toEqual, matchers and asymmetric matchers | [core-expect](references/core-expect.md)     |
| Hooks         | beforeEach, afterEach, beforeAll, afterAll, aroundEach          | [core-hooks](references/core-hooks.md)       |

## Features

| Topic        | Description                                                    | Reference                                                  |
| ------------ | -------------------------------------------------------------- | ---------------------------------------------------------- |
| Mocking      | Mock functions, modules, timers, dates with vi utilities       | [features-mocking](references/features-mocking.md)         |
| Snapshots    | Snapshot testing with toMatchSnapshot and inline snapshots     | [features-snapshots](references/features-snapshots.md)     |
| Coverage     | Code coverage with V8 or Istanbul providers                    | [features-coverage](references/features-coverage.md)       |
| Test Context | Test fixtures, context.expect, test.extend for custom fixtures | [features-context](references/features-context.md)         |
| Concurrency  | Concurrent tests, parallel execution, sharding                 | [features-concurrency](references/features-concurrency.md) |
| Filtering    | Filter tests by name, file patterns, tags                      | [features-filtering](references/features-filtering.md)     |

## Advanced

| Topic        | Description                                             | Reference                                                    |
| ------------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| Vi Utilities | vi helper: mock, spyOn, fake timers, hoisted, waitFor   | [advanced-vi](references/advanced-vi.md)                     |
| Environments | Test environments: node, jsdom, happy-dom, custom       | [advanced-environments](references/advanced-environments.md) |
| Type Testing | Type-level testing with expectTypeOf and assertType     | [advanced-type-testing](references/advanced-type-testing.md) |
| Projects     | Multi-project workspaces, different configs per project | [advanced-projects](references/advanced-projects.md)         |
