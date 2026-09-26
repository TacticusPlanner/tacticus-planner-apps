## Context

`use-goal-form-reset.ts` currently clears entity, enabled types, project selection, targets, and start-paused after Create another. `use-create-goal-prefill.ts` applies explicit launch data. The launcher (`CreateGoalLauncherContext`, `CreateGoalPrefill`) accepts a project-only prefill (`{ projectIds }`): the app shell sends it from the global entry points (sidebar button, bottom-nav button, shortcut) when the route matches `/plan/projects/:projectId`, and Project Detail's own actions send it too. That precedence is specified in the `goal-creation-entry-points` main spec and this change must preserve it. With no prefill, the form falls back to the Default project (`isDefault`, `use-project-selection.ts`); there is no Active/Current-plan project to prefer.

## Goals / Non-Goals

**Goals:** Keep only safe, reusable context for the current mounted app session.

**Non-Goals:** Persist context across reloads, remember unit-specific targets, or replace explicit prerequisites/project prefill.

## Decisions

- Own transient memory alongside the shell-level goal launcher/form model, not in local storage or API profile. In-memory per-tab lifetime avoids surprising cross-visit defaults.
- On successful submission, snapshot the user's chosen memberships and types before reset. Apply explicit prefill first, then remembered values only for fields it does not supply; if a project-scoped launch supplies memberships, it wins entirely.
- On unit selection, intersect remembered types with that entity's allowed kinds. Recompute all target defaults from the new unit; reset start-paused even when context is retained.
- If remembered project IDs no longer exist (for example a project archived meanwhile), ignore them and fall back to the Default project rather than submitting stale membership IDs.

## Risks / Trade-offs

- The `goal-creation-entry-points` main spec already conditions its no-prefill Default-project behavior on "no consecutive-creation context is remembered", so no further spec edit is needed there; keep this change's precedence wording identical to it.
- Retaining type toggles can trigger invalid prerequisites on a new unit → apply allowed-type filtering and recompute suggestions/targets.

## Open Questions

- The current-tab lifetime is a provisional product choice. If testers need reload persistence, revisit both the spec and state owner rather than silently introducing storage.
