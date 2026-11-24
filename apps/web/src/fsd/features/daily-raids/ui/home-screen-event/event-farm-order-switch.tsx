import { useTranslation } from "react-i18next"
import { ToggleGroup } from "@workspace/ui/components/toggle-group"

import {
  FILTER_CHIP_CLASS_NAME,
  HintedToggleGroupItem,
  SegmentedControl,
} from "@/shared/ui"

import type { EventFarmOrder } from "../../model/home-screen-event-farm"

const ORDERS = ["points", "energy"] as const satisfies readonly EventFarmOrder[]
const IGNORE_GOALS = "ignoreGoals"

/** What the HSE list shows, picked in the page toolbar. */
export type HseListView = { order: EventFarmOrder; ignoreGoals: boolean }

/** The HSE list's Sort (points per energy or energy per item), for the toolbar's View slot. */
export function HseSortControl({
  view,
  onViewChange,
}: {
  view: HseListView
  onViewChange: (view: HseListView) => void
}) {
  const { t } = useTranslation("dailies")
  return (
    <SegmentedControl
      label={t("hse.raids.order.label")}
      onValueChange={(order) => onViewChange({ ...view, order })}
      options={ORDERS.map((order) => ({
        value: order,
        label: t(`hse.raids.order.${order}`),
        hint: t(`hse.raids.order.help.${order}`),
        testId: `hse-raids-order-${order}`,
      }))}
      testId="hse-raids-order"
      value={view.order}
    />
  )
}

/** "Ignore goals": a filter chip that lists every point-earning location instead of the goal farm
 *  list, independent of the Sort. */
export function HseIgnoreGoalsChip({
  view,
  onViewChange,
}: {
  view: HseListView
  onViewChange: (view: HseListView) => void
}) {
  const { t } = useTranslation("dailies")
  return (
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
      <HintedToggleGroupItem
        className={FILTER_CHIP_CLASS_NAME}
        data-testid="hse-raids-ignore-goals"
        hint={t("hse.raids.order.help.ignoreGoals")}
        value={IGNORE_GOALS}
      >
        {t("hse.raids.order.ignoreGoals")}
      </HintedToggleGroupItem>
    </ToggleGroup>
  )
}
