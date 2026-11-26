import { useInventoryTutorial } from "./inventory.tutorial"
import type { InventoryTabStep } from "./inventory.tutorial"

const TOUR_STEPS: readonly InventoryTabStep[] = []

/** Inventory > Upgrades: every upgrade material, with have / need. */
export function InventoryUpgradesTab() {
  useInventoryTutorial(TOUR_STEPS)
  return null
}
