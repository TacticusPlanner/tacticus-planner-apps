import { useTranslation } from "react-i18next"
import {
  goldIcon,
  mythicSalvageIcon,
  salvageIcon,
} from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import type { ItemCost } from "@/shared/equipment"
import { EntityIcon } from "@/shared/ui"

/** Coins, salvage and Mythic salvage, each with its game icon, leaving out what is zero. */
export function CostAmounts({
  cost,
  className,
}: {
  cost: ItemCost
  className?: string
}) {
  const { t, i18n } = useTranslation("gameUi")
  const format = (value: number) => value.toLocaleString(i18n.language)
  const parts = [
    {
      key: "salvage",
      amount: cost.salvage,
      icon: salvageIcon(),
      name: t("items.salvage"),
    },
    {
      key: "mythicSalvage",
      amount: cost.mythicSalvage,
      icon: mythicSalvageIcon(),
      name: t("items.mythicSalvage"),
    },
    { key: "gold", amount: cost.gold, icon: goldIcon(), name: t("items.gold") },
  ].filter((part) => part.amount > 0)
  return (
    <span
      className={cn(
        "flex flex-wrap items-center gap-3 tabular-nums",
        className
      )}
    >
      {parts.map((part) => (
        <span className="flex items-center gap-1" key={part.key}>
          <EntityIcon alt={part.name} size="icon" src={part.icon} />
          {format(part.amount)}
        </span>
      ))}
    </span>
  )
}

/** One cost in a description list: its label, then the amounts. */
export function CostRow({ label, cost }: { label: string; cost: ItemCost }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        <CostAmounts cost={cost} />
      </dd>
    </div>
  )
}
