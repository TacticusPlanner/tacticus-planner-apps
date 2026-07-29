import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import type { UnitId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"
import {
  getPlayerCharacter,
  getPlayerMow,
} from "@workspace/player-data/queries"

// A unique sentinel (not a plain value) so it can be distinguished from a legitimately-resolved
// result via reference equality — the documented Dexie pattern for detecting "still loading" with
// useLiveQuery, since its `defaultResult` argument is only returned before the first resolution.
// Mirrors pages/lookup/.../character-lookup-page.tsx's PLAYER_CHARACTER_LOADING (not imported —
// see use-goal-catalog.ts's note on why pages don't import from each other).
const LOADING = Symbol("loading")

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

  const result = useLiveQuery(
    () =>
      isAuthenticated && entityId
        ? (entityType === "Mow"
            ? getPlayerMow(entityId)
            : getPlayerCharacter(entityId)
          ).then((data) => ({
            id: entityId as UnitId | undefined,
            entityType,
            data,
          }))
        : { id: entityId, entityType, data: undefined },
    [isAuthenticated, entityId, entityType],
    LOADING
  )

  const playerEntity =
    result !== LOADING &&
    result.id === entityId &&
    result.entityType === entityType
      ? result.data
      : undefined
  const loading =
    isAuthenticated &&
    !!entityId &&
    (result === LOADING ||
      result.id !== entityId ||
      result.entityType !== entityType)

  // Narrowed by `entityType` (the same value `playerEntity` was itself fetched by) rather than by
  // inspecting its shape — a Character's synced record is the only one that ever carries `rank`,
  // but TS can't correlate two separately-computed variables through a shape check alone, so this
  // documents an invariant the types can't express. Exposed alongside the union `playerEntity` so
  // callers needing the narrowed shape (e.g. a Character's `rank`/`xp`) don't each redo the cast.
  const playerCharacter =
    entityType === "Character"
      ? (playerEntity as PlayerDataChunkDto<"characters">[number] | undefined)
      : undefined
  const playerMow =
    entityType === "Mow"
      ? (playerEntity as PlayerDataChunkDto<"mows">[number] | undefined)
      : undefined

  return { playerEntity, playerCharacter, playerMow, loading }
}
