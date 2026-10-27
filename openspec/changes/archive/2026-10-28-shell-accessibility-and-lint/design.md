# Design

## Context

See proposal.md - Why. Both shells (`app/layout/desktop-layout.tsx`, `mobile-layout.tsx`) already render the page title as an `h1` (`desktop-section-header.tsx`, `mobile-header.tsx`) and wrap `<Outlet />` in a `Suspense` with a shared fallback; `account-setup-layout.tsx` already has `<main>`. Radix (via `packages/ui`) supplies `Label`, `Select` and `Popover` primitives whose ids and `aria-*` wiring are available but unused by the five hand-rolled combobox triggers and the two select wrappers. dnd-kit's `DndContext` accepts an `accessibility.announcements` object. ESLint runs the non-type-aware preset; promises are policed by hand with `void`.

## Goals / Non-Goals

**Goals:**

- Native HTML and ARIA first: landmarks, `htmlFor`/`id`, `aria-controls`, roles. No a11y library at runtime.
- One place per concern: skip link and focus in the shells, roles in the shared loading/error components, announcements in `sortable-list.tsx`.
- Gates that fail CI on the regression class, not a one-time sweep.

**Non-Goals:**

- Bulk rewriting existing `ByTestId` tests to role queries (preference applies to new tests; `test-harness-render-app` owns the harness).
- Roving focus on non-operable grids (Collection tiles are `role="group"` with no action).
- Color/contrast work (`goal-visual-accessibility` already covers it).
- `knip`, `max-lines`, FSD moves (`rehome-feature-logic`).

## Decisions

1. **Skip link and `main` live in each shell file, not a shared wrapper.** Two shells, two three-line additions (`<a href="#main" className="sr-only focus:not-sr-only ...">` plus `<main id="main" tabIndex={-1}>`). Alternative: a `ShellFrame` component used by both — rejected, one abstraction for two call sites is more code than the duplication.
2. **Focus-on-navigate is a `useEffect` on `pathname` in each shell that focuses the shell `h1` (given `tabIndex={-1}`), skipping the first render with a ref.** Search-param changes do not change `pathname`, so tab/filter changes keep focus. Alternative: React Router's `ScrollRestoration` plus a focus wrapper — rejected, the router's scroll handling is unchanged and the effect is six lines.
3. **Shell owns the `h1`; pages demote.** `hre-page.tsx`, `hse-page.tsx`, `shops-page.tsx` change `h1` to `h2`; Today already does. `jsx-a11y` does not check levels, so the `shell-landmarks-and-focus` spec test asserts `getAllByRole("heading", { level: 1 })` has length 1 per Dailies tab.
4. **`role="status"` goes on the shared fallback (`LoadingFill`) and on the few shared spinner components, not on 45 sites.** Sites that render a bare spinner are switched to the shared component where that is a one-line swap; the rest get the attribute. Error blocks: `route-error-boundary.tsx` container gets `role="alert"`.
5. **Combobox `aria-controls`: generate the id with `useId()` in each trigger and pass it to the Radix `PopoverContent`/`CommandList` it opens.** Five files, two lines each. Alternative: a shared `useComboboxIds` hook — rejected, `useId` is the hook.
6. **Select labels: `useId()` + `htmlFor` on `Label`, `id` on `SelectTrigger`.** Radix `Select.Trigger` forwards `id`; no wrapper changes in `packages/ui`.
7. **Roving focus only on the Tier List tile buttons, via `tabIndex` 0/-1 and an `onKeyDown` arrow handler in `tier-row.tsx`.** Alternative: a generic `useRovingFocus` hook in `shared/lib` — deferred until a second operable grid exists (`ponytail:` note in code).
8. **Localized dnd announcements: `sortable-list.tsx` passes `accessibility={{ announcements, screenReaderInstructions }}` built from `t("reorder.*")` in `common`, with `{{name}}`, `{{position}}`, `{{total}}` interpolation.** The item name comes from the existing `getId`/`renderItem` contract extended with an optional `getLabel`; when absent the id is announced. All four locales get real translations.
9. **Lint: add `jsx-a11y` recommended and `tseslint.configs.recommendedTypeChecked` with `parserOptions.projectService: true`; enable `no-floating-promises` and `no-misused-promises` as errors, keep the rest of the type-checked set at the preset's level.** Tests are included in the type-aware run (the Vitest tsconfig is already in `tsc -b`). Expected cost: lint time rises from seconds to roughly the typecheck time (40 s measured); acceptable for CI and pre-commit via lefthook stays unchanged.
10. **`noUncheckedIndexedAccess` on, `exactOptionalPropertyTypes` off.** The former catches the `charactersById!`-style defects the audit found and its fixes are local (`?? fallback`, early returns). The latter would flag every shadcn/Radix prop forwarded as `prop?: T` with an explicit `undefined`; the audit found no defect class it would have caught, so the churn buys nothing now. Revisit if a bug traces to an explicit `undefined`.
11. **Axe in tests, not in runtime.** One Vitest test per shell renders the shell with a stub page and runs `axe` (`vitest-axe`, dev-only). Alternative: `@axe-core/react` in dev runtime — rejected, nobody reads the console.

## Risks / Trade-offs

- [Type-aware lint surfaces hundreds of `no-floating-promises` sites] → fix the real ones (unawaited mutations, effects), prefix intentional fire-and-forget with `void` as the codebase already does; if the count is unmanageable in one PR, set the two rules to `warn` first and flip to `error` in the same change after the sweep.
- [`noUncheckedIndexedAccess` breaks engine code that indexes arrays in hot loops] → use `for..of` or non-null guards at the boundary, never blanket `!`; the farming and LRE parity fixtures guard behavior.
- [Focus-on-navigate fights the search dialog's return-focus or a tour step that opens on route entry] → effect skips when `document.activeElement` is inside a dialog or the tour overlay is open.
- [Skip link appears in the shell tour as an unexpected first tab stop] → it is visually hidden; `general.tutorial.tsx` steps target testids, not tab order, so no tour change is needed; the mobile tour verification confirms the link does not flash during step transitions.
- [Changing `h1` to `h2` on three Dailies tabs breaks tests that query `heading level 1`] → update those tests in the same task.

## Migration Plan

Client-only, one PR, no flag. Lint and tsconfig changes land in the same PR as their fixes so CI never sees an intermediate red state. Rollback = revert.

## Open Questions

- Whether `vitest-axe` or a direct `axe-core` call is used for the shell test is an implementation detail decided when the dependency is added; both are dev-only.
