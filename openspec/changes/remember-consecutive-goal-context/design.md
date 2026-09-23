## Context

`use-goal-form-reset.ts` currently clears entity, enabled types, project selection, targets, and start-paused after Create another. `use-create-goal-prefill.ts` applies explicit launch data. The contextual-entry-point change adds a project-only prefill, whose precedence this change must preserve.

## Goals / Non-Goals

**Goals:** Keep only safe, reusable context for the current mounted app session.

**Non-Goals:** Persist context across reloads, remember unit-specific targets, or replace explicit prerequisites/project prefill.

## Decisions

- Own transient memory alongside the shell-level goal launcher/form model, not in local storage or API profile. In-memory per-tab lifetime avoids surprising cross-visit defaults.
- On successful submission, snapshot the user's chosen memberships and types before reset. Apply explicit prefill first, then remembered values only for fields it does not supply; if a project-scoped launch supplies memberships, it wins entirely.
- On unit selection, intersect remembered types with that entity's allowed kinds. Recompute all target defaults from the new unit; reset start-paused even when context is retained.
- If remembered project IDs no longer exist, ignore them and fall back to the current default project rather than submitting stale membership IDs.

## Risks / Trade-offs

- Default-project behavior in the contextual-entry-point proposal currently says global/Overview launches always choose Default → revise that statement so it applies when no remembered context exists.
- Retaining type toggles can trigger invalid prerequisites on a new unit → apply allowed-type filtering and recompute suggestions/targets.

## Open Questions

- The current-tab lifetime is a provisional product choice. If testers need reload persistence, revisit both the spec and state owner rather than silently introducing storage.
