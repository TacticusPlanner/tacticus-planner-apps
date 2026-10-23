import { useIsAuthenticated } from "@azure/msal-react"
import type { UnitId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { usePlayerChunk } from "@/shared/local-data"

import { readyData, toByUnitId } from "@/features/goal-planning/@x/goal-create"

/**
 * The caller's synced record for `entityId` (rank/progressionIndex/abilities/appliedUpgradeSlots for
 * a Character; progressionIndex/abilities/appliedUpgradeSlots — no rank — for a MoW, plan §16 phase
 * 6), or `undefined` when signed out, not yet synced, or the unit isn't owned. Used to prefill a
 * goal's "start" fields with the entity's actual current state. The returned record's shape follows
 * `entityType` — callers narrow via `"rank" in` or simply gate on the `entityType` they passed in,
 * since a Character's synced record is the only one that ever carries a `rank`.
 */
export function useGoalPrefill(
  entityId: UnitId | undefined,
  entityType: "Character" | "Mow"
) {
  const isAuthenticated = useIsAuthenticated()

  const characters = usePlayerChunk("characters", toByUnitId)
  const mows = usePlayerChunk("mows", toByUnitId)
  const roster = entityType === "Mow" ? mows : characters
  const playerEntity =
    isAuthenticated && entityId ? readyData(roster)?.get(entityId) : undefined
  const loading = isAuthenticated && !!entityId && roster.status !== "ready"

  // Narrowed by `entityType` (the same value `playerEntity` was itself fetched by) rather than by
  // inspecting its shape — a Character's synced record is the only one that ever carries `rank`,
  // but TS can't correlate two separately-computed variables through a shape check alone, so this
  // documents an invariant the types can't express. Exposed alongside the union `playerEntity` so
  // callers needing the narrowed shape (e.g. a Character's `rank`/`xp`) don't each redo the cast.
  const playerCharacter =
    entityType === "Character"
      ? (playerEntity as PlayerDataChunkDto<"characters">[number] | undefined)
      : undefined
  const playerMow = entityType === "Mow" ? playerEntity : undefined

  return { playerEntity, playerCharacter, playerMow, loading }
}
