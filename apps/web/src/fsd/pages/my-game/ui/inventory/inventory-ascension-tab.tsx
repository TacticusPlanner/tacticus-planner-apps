import { useInventoryTutorial } from "./inventory.tutorial"
import type { InventoryTabStep } from "./inventory.tutorial"

const TOUR_STEPS: readonly InventoryTabStep[] = []

/** Inventory > Ascension: XP books, badges, orbs and the other resources, with have / need. */
export function InventoryAscensionTab() {
  useInventoryTutorial(TOUR_STEPS)
  return null
}
