import { rarityOrder } from "@workspace/game-domain"
import type { Rarity, UpgradeId } from "@workspace/game-domain"

import type {
  PlanSpareUpgrade,
  PlanUpgradeMaterial,
} from "@/features/goal-planning"

/** What the Insights materials card counts. */
export const MATERIALS_SHOW = ["missing", "required", "spare"] as const
export type MaterialsShow = (typeof MATERIALS_SHOW)[number]

export const isMaterialsShow = (value: unknown): value is MaterialsShow =>
  MATERIALS_SHOW.includes(value as MaterialsShow)

/** One upgrade row of the card: its count in the chosen view, and the farming left. */
export type UpgradeRow = {
  id: UpgradeId
  label: string
  rarity: Rarity
  count: number
  /** Required only: how many of `count` are still missing (shown muted when above 0). */
  missing?: number
  /** Missing and Required: the days and energy left to farm it; absent when nothing is left. */
  cost?: { days: number; energy: number }
  goalIds: readonly string[]
}

/** The card's upgrade rows for a view, grouped by rarity, highest first (the calc's order inside). */
export function upgradeRowsByRarity(
  show: MaterialsShow,
  upgrades: readonly PlanUpgradeMaterial[],
  spare: readonly PlanSpareUpgrade[]
): { rarity: Rarity; rows: UpgradeRow[] }[] {
  const rows: UpgradeRow[] =
    show === "spare"
      ? spare.map((item) => ({
          id: item.id,
          label: item.label,
          rarity: item.rarity,
          count: item.spare,
          goalIds: [],
        }))
      : upgrades
          .filter(
            (item) => (show === "missing" ? item.missing : item.required) > 0
          )
          .map((item) => ({
            id: item.id,
            label: item.label,
            rarity: item.rarity,
            count: show === "missing" ? item.missing : item.required,
            missing: show === "required" ? item.missing : undefined,
            cost:
              item.energyToClear > 0
                ? {
                    days: Math.ceil(item.days),
                    energy: Math.round(item.energyToClear),
                  }
                : undefined,
            goalIds: item.goalIds,
          }))
  return rarityOrder
    .toReversed()
    .map((rarity) => ({
      rarity,
      rows: rows.filter((row) => row.rarity === rarity),
    }))
    .filter((group) => group.rows.length > 0)
}
