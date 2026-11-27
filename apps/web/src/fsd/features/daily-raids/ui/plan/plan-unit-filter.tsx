import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Pressable } from "@workspace/ui/components/pressable"
import {
  SelectionGroup,
  SelectionItem,
} from "@workspace/ui/components/selection-group"

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
      <p className="text-sm text-muted-foreground">{t("plan.filter.hint")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <SelectionGroup
          aria-label={t("plan.filter.label")}
          className="flex flex-wrap items-center gap-2"
          // Pressing the picked unit again clears the filter ("").
          onValueChange={(unitId) =>
            onSelect(unitId === "" ? undefined : unitId)
          }
          value={selectedUnitId ?? ""}
        >
          {ranges.map(({ unit }) => (
            <SelectionItem asChild key={unit.unitId} value={unit.unitId}>
              <Pressable
                aria-label={unit.unitLabel}
                className={cn(
                  "rounded-full p-0.5",
                  unit.unitId === selectedUnitId && "ring-2 ring-primary"
                )}
                data-testid={`plan-filter-${unit.unitId}`}
              >
                <UnitIcon className="rounded-full" goal={unit} />
              </Pressable>
            </SelectionItem>
          ))}
        </SelectionGroup>
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
