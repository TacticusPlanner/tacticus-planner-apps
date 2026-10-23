import { useTranslation } from "react-i18next"

import { UpgradeIcon } from "@/shared/ui"

import type { GoalProgress } from "@/features/goal-planning"

/** Desktop rows are a fixed height, so a long material list (a whole rank range) is cut here and
 *  the rest folded into a "+N" chip. */
const MAX_VISIBLE = 4

/** One image per targeted upgrade material with its owned/needed count; the material's name is the
 *  tooltip and accessible name. Counts read "–/n" while the inventory hasn't loaded. Past
 *  `MAX_VISIBLE`, the rest are one "+N" chip whose tooltip lists them. */
export function UpgradeTargetMaterials({
  materials,
}: {
  materials: Extract<GoalProgress, { kind: "Upgrade" }>["materials"]
}) {
  const { t } = useTranslation()
  const labelOf = (material: (typeof materials)[number]) =>
    t("goals.overview.upgradeMaterial", {
      name: material.label,
      owned: material.owned === null ? "–" : String(material.owned),
      quantity: material.quantity,
    })
  const visible = materials.slice(0, MAX_VISIBLE)
  const hidden = materials.slice(MAX_VISIBLE)
  const hiddenLabel = hidden.map(labelOf).join("\n")

  return (
    <ul
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
      data-testid="goal-upgrade-materials"
    >
      {visible.map((material) => {
        const owned = material.owned === null ? "–" : String(material.owned)
        const label = labelOf(material)
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
      {hidden.length > 0 ? (
        <li>
          <span
            aria-label={hiddenLabel}
            className="rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground tabular-nums"
            data-testid="goal-upgrade-materials-more"
            role="img"
            title={hiddenLabel}
          >
            <span aria-hidden>+{hidden.length}</span>
          </span>
        </li>
      ) : null}
    </ul>
  )
}
