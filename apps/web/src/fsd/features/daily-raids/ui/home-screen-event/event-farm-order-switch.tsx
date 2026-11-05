import { useId } from "react"
import { useTranslation } from "react-i18next"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { FILTER_CHIP_CLASS_NAME } from "@/shared/ui"

import type { HseListMode } from "../../model/home-screen-event-farm"

const ORDERS = [
  "points",
  "energy",
  "ignoreGoals",
] as const satisfies readonly HseListMode[]

/** The HSE list's Sort switch: points per energy, energy per item (Today's cheapest nodes), or
 * every point-earning location with goals ignored. */
export function EventFarmOrderSwitch({
  order,
  onOrderChange,
}: {
  order: HseListMode
  onOrderChange: (order: HseListMode) => void
}) {
  const { t } = useTranslation("dailies")
  const labelId = useId()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground" id={labelId}>
        {t("hse.raids.order.label")}
      </span>
      <ToggleGroup
        aria-labelledby={labelId}
        data-testid="hse-raids-order"
        onValueChange={(value) => {
          const next = ORDERS.find((item) => item === value)
          if (next) onOrderChange(next)
        }}
        size="sm"
        spacing={1}
        type="single"
        value={order}
        variant="outline"
      >
        {ORDERS.map((item) => (
          <ToggleGroupItem
            className={FILTER_CHIP_CLASS_NAME}
            data-testid={`hse-raids-order-${item}`}
            key={item}
            title={t(`hse.raids.order.help.${item}`)}
            value={item}
          >
            {t(`hse.raids.order.${item}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
