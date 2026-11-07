import type { TFunction } from "i18next"

import type { GoalProgress } from "@/features/goal-planning"

type UpgradeMaterial = Extract<
  GoalProgress,
  { kind: "Upgrade" }
>["materials"][number]

/** A material chip's tooltip and accessible name: its owned/needed count, then one line per goal
 *  ranked ahead that holds some of it, so a short goal says who has the pieces and a reached one
 *  says whose pieces it counts. */
export function upgradeMaterialLabel(
  t: TFunction,
  material: UpgradeMaterial
): string {
  const count = t("goals.overview.upgradeMaterial", {
    name: material.label,
    owned: material.owned === null ? "–" : String(material.owned),
    quantity: material.quantity,
  })
  const holders = (material.heldBy ?? []).map((holder) =>
    t(
      holder.counted
        ? "goals.overview.upgradeMaterialCounted"
        : "goals.overview.upgradeMaterialTakenFirst",
      {
        amount: holder.amount,
        unit: holder.unitName,
        goalType: t(`goals.create.goalTypes.${holder.goalType}`),
        priority: holder.priority ?? "–",
      }
    )
  )
  return [count, ...holders].join("\n")
}
