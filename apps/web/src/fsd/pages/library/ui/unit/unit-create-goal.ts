import type { CreateGoalPrefill } from "@/entities/goal"
import type { UnitId } from "@workspace/game-domain"

import type { UnitOwnership } from "./unit-ownership"

export type UnitEntityType = "Character" | "Mow"

/**
 * The unit page's Create goal prefill: a unit the synced roster doesn't hold starts on Unlock;
 * otherwise only the unit is selected and every goal type is left for the player to choose. No
 * project context, so the sheet keeps its remembered-membership / Default-project fallback.
 */
export function unitCreateGoalPrefill(
  entityType: UnitEntityType,
  unitId: UnitId,
  ownership: UnitOwnership
): CreateGoalPrefill {
  const entity = { entityType, entityId: unitId } as const
  return ownership === "notOwned" ? { ...entity, goalType: "Unlock" } : entity
}
