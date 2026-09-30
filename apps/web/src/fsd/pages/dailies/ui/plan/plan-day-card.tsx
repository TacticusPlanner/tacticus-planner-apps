import { Swords } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import type { DailyRaidsReadyViewModel } from "@/features/daily-raids"
import type { RaidDaySchedule } from "@/features/goal-farming"
import { energyIconUrl, EntityIcon } from "@/shared/ui"
import type { PlanCell, PlanDayCells } from "../../model/plan-day-cells"
import { UnitIcon } from "../resource-card"
import { PlanMaterialCell } from "./plan-material-cell"

// V1's threshold for calling a day's energy budget "full".
const FULL_ENERGY_RATIO = 0.95

export function PlanDayCard({
  cells,
  day,
  mounted,
  raids,
  selectedUnitId,
}: {
  cells: PlanDayCells
  day: RaidDaySchedule
  mounted: boolean
  raids: DailyRaidsReadyViewModel
  selectedUnitId: string | undefined
}) {
  const { t, i18n } = useTranslation("dailies")
  const ratio = raids.dailyEnergy > 0 ? day.energyTotal / raids.dailyEnergy : 0
  const date = new Date()
  date.setDate(date.getDate() + day.day - 1)

  const renderCells = (list: PlanCell[], testId: string) => (
    <div className="grid grid-cols-3 gap-1.5" data-testid={testId}>
      {list.map((cell) => (
        <PlanMaterialCell
          key={cell.resourceId}
          cell={cell}
          dimmed={
            selectedUnitId !== undefined &&
            !cell.units.some((unit) => unit.unitId === selectedUnitId)
          }
          label={raids.resourceLabels.get(cell.resourceId) ?? cell.resourceId}
          locationsByBattleId={raids.locationsByBattleId}
          testId={`plan-cell-${day.day}-${cell.resourceId}`}
          visual={raids.resourceVisuals.get(cell.resourceId)}
        />
      ))}
    </div>
  )

  return (
    <section
      className="flex h-[var(--plan-card-h,28rem)] min-h-112 w-[85vw] max-w-84 shrink-0 flex-col gap-2 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-foreground/5 md:w-84 dark:ring-foreground/10"
      data-plan-day={day.day}
      data-testid={`plan-day-${day.day}`}
    >
      <header className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-heading text-base font-medium">
            {day.day === 1
              ? t("raids.tabs.today")
              : t("plan.day", { day: day.day })}
          </h2>
          <span className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat(i18n.language, {
              day: "numeric",
              month: "long",
            }).format(date)}
          </span>
        </div>
        <div aria-hidden="true" className="flex gap-3">
          <span className="flex items-center gap-1 text-xs tabular-nums">
            <EntityIcon alt="" className="size-4" src={energyIconUrl} />
            {day.energyTotal}/{raids.dailyEnergy}
          </span>
          <span className="flex items-center gap-1 text-xs tabular-nums">
            <Swords className="size-3.5 text-muted-foreground" />
            {day.raidsTotal}
          </span>
        </div>
        <p className="sr-only">
          {t("plan.dayStats", {
            energy: day.energyTotal,
            available: raids.dailyEnergy,
            raids: day.raidsTotal,
          })}
        </p>
        <div
          aria-hidden="true"
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn(
              "h-full rounded-full",
              ratio >= FULL_ENERGY_RATIO
                ? "bg-success-foreground"
                : "bg-amber-500"
            )}
            data-testid={`plan-day-${day.day}-energy-bar`}
            style={{ width: `${Math.min(1, ratio) * 100}%` }}
          />
        </div>
        <div
          className="flex min-h-6 flex-wrap gap-1"
          data-testid={`plan-day-${day.day}-units`}
        >
          {cells.units.map((unit) => (
            <UnitIcon key={unit.unitId} className="size-6" goal={unit} />
          ))}
        </div>
      </header>
      {mounted ? (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {cells.actionable.length > 0
            ? renderCells(cells.actionable, `plan-day-${day.day}-raids`)
            : null}
          {cells.raided.length > 0 ? (
            <>
              <div
                className="flex items-center gap-3 text-xs font-medium tracking-wide text-muted-foreground uppercase"
                data-testid={`plan-day-${day.day}-raided-divider`}
              >
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
                <h3>{t("plan.raided")}</h3>
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
              </div>
              {renderCells(cells.raided, `plan-day-${day.day}-raided`)}
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
