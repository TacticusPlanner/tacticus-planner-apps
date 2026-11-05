import { useId } from "react"
import { useTranslation } from "react-i18next"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { FILTER_CHIP_CLASS_NAME } from "@/shared/ui"

import type { EventFarmOrder } from "../../model/home-screen-event-farm"

const ORDERS = ["points", "energy"] as const satisfies readonly EventFarmOrder[]

/** The HSE list's order switch: points per energy, or energy per item (Today's cheapest nodes). */
export function EventFarmOrderSwitch({
  order,
  onOrderChange,
}: {
  order: EventFarmOrder
  onOrderChange: (order: EventFarmOrder) => void
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
