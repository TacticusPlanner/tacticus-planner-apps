import { useId } from "react"
import { useTranslation } from "react-i18next"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { FILTER_CHIP_CLASS_NAME } from "@/shared/ui"

import type { EventFarmOrder } from "../../model/home-screen-event-farm"

const ORDERS = ["points", "energy"] as const satisfies readonly EventFarmOrder[]
const IGNORE_GOALS = "ignoreGoals"

/** What the HSE list shows, picked on the list's controls row. */
export type HseListView = { order: EventFarmOrder; ignoreGoals: boolean }

/**
 * The HSE list's controls: the Sort switch (points per energy or energy per item) and, beside it,
 * the independent "Ignore goals" toggle that lists every point-earning location instead of the
 * goal farm list.
 */
export function EventFarmOrderSwitch({
  view,
  onViewChange,
}: {
  view: HseListView
  onViewChange: (view: HseListView) => void
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
          if (next) onViewChange({ ...view, order: next })
        }}
        size="sm"
        spacing={1}
        type="single"
        value={view.order}
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
      <ToggleGroup
        aria-label={t("hse.raids.order.ignoreGoals")}
        onValueChange={(values) =>
          onViewChange({ ...view, ignoreGoals: values.includes(IGNORE_GOALS) })
        }
        size="sm"
        spacing={1}
        type="multiple"
        value={view.ignoreGoals ? [IGNORE_GOALS] : []}
        variant="outline"
      >
        <ToggleGroupItem
          className={FILTER_CHIP_CLASS_NAME}
          data-testid="hse-raids-ignore-goals"
          title={t("hse.raids.order.help.ignoreGoals")}
          value={IGNORE_GOALS}
        >
          {t("hse.raids.order.ignoreGoals")}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
