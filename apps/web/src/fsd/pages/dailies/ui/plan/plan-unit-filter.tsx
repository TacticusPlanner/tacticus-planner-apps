import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { PlanUnitRange } from "../../model/plan-day-cells"
import { UnitIcon } from "../resource-card"

export function PlanUnitFilter({
  onJump,
  onSelect,
  ranges,
  selectedUnitId,
}: {
  onJump: (day: number) => void
  onSelect: (unitId: string | undefined) => void
  ranges: PlanUnitRange[]
  selectedUnitId: string | undefined
}) {
  const { t } = useTranslation("dailies")
  if (ranges.length === 0) return null
  const selected = ranges.find(({ unit }) => unit.unitId === selectedUnitId)

  return (
    <div className="space-y-1.5" data-testid="plan-unit-filter">
      <p className="text-xs text-muted-foreground">{t("plan.filter.hint")}</p>
      <div
        aria-label={t("plan.filter.label")}
        className="flex flex-wrap items-center gap-2"
        role="group"
      >
        {ranges.map(({ unit }) => {
          const pressed = unit.unitId === selectedUnitId
          return (
            <button
              key={unit.unitId}
              aria-label={unit.unitLabel}
              aria-pressed={pressed}
              className={cn(
                "rounded-full p-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                pressed && "ring-2 ring-primary"
              )}
              data-testid={`plan-filter-${unit.unitId}`}
              onClick={() => onSelect(pressed ? undefined : unit.unitId)}
              type="button"
            >
              <UnitIcon className="size-10 rounded-full" goal={unit} />
            </button>
          )
        })}
        {selected ? (
          <div className="flex items-center gap-1">
            <Button
              onClick={() => onJump(selected.firstDay)}
              size="sm"
              variant="outline"
            >
              {selected.lastDay === selected.firstDay
                ? t("plan.day", { day: selected.firstDay })
                : t("plan.filter.first", { day: selected.firstDay })}
            </Button>
            {selected.lastDay !== selected.firstDay ? (
              <Button
                onClick={() => onJump(selected.lastDay)}
                size="sm"
                variant="outline"
              >
                {t("plan.filter.last", { day: selected.lastDay })}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
