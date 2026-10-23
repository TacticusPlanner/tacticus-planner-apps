import { useTranslation } from "react-i18next"

import { UpgradeIcon } from "@/shared/ui"

import type { GoalProgress } from "../../model/attainment/goal-progress"

/** One image per targeted upgrade material with its owned/needed count; the material's name is the
 *  tooltip and accessible name. Counts read "–/n" while the inventory hasn't loaded. */
export function UpgradeTargetMaterials({
  materials,
}: {
  materials: Extract<GoalProgress, { kind: "Upgrade" }>["materials"]
}) {
  const { t } = useTranslation()

  return (
    <ul
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
      data-testid="goal-upgrade-materials"
    >
      {materials.map((material) => {
        const owned = material.owned === null ? "–" : String(material.owned)
        const label = t("goals.overview.upgradeMaterial", {
          name: material.label,
          owned,
          quantity: material.quantity,
        })
        return (
          <li key={material.upgradeId}>
            <span
              aria-label={label}
              className="flex items-center gap-1 tabular-nums"
              role="img"
              title={label}
            >
              <UpgradeIcon
                className="size-6 shrink-0"
                crafted={material.crafted}
                id={material.upgradeId}
                rarity={material.rarity}
              />
              <span aria-hidden>
                {owned}/{material.quantity}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
