// Dedicated entry point for named, business-purpose read queries safe to pass directly to
// `useLiveQuery` (dexie-react-hooks) — one function per thing a caller actually wants, not a generic
// chunk-key accessor. Components import from here, never from the main package barrel and never
// touching the Dexie instance itself. Add a new named query here as new business needs arise.
import { getChunkData, getChunkRecord } from "./player-data-storage"
import type { UnitId } from "@workspace/game-domain"

export function getInventoryUpgrades() {
  return getChunkData("inventory-upgrades")
}

export function getPlayerCharacter(unitId: UnitId) {
  return getChunkRecord("characters", unitId)
}
