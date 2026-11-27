import { useTranslation } from "react-i18next"
import { powerIcon, statIcon } from "@workspace/game-catalog"
import type { StatIconKind } from "@workspace/game-catalog"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import type { NpcStatRow } from "@/entities/npc"
import { numberFormat, useNumberFormat } from "@/shared/lib"

import type { PowerFigure } from "../unit/unit-power.model"

const cardClass =
  "flex flex-col items-center justify-center gap-1 rounded-lg border bg-card p-3"
const labelClass = "text-xs text-muted-foreground"
const valueClass = "text-xl font-semibold tabular-nums"

function StatCard({
  kind,
  label,
  value,
}: {
  kind: StatIconKind
  label: string
  value: number
}) {
  const numbers = useNumberFormat()
  return (
    <div className={cardClass} data-testid={`npc-stat-${kind}`}>
      <span className={labelClass}>{label}</span>
      <span className="flex items-center gap-2">
        <EntityIcon size="icon" src={statIcon(kind)} alt="" />
        <span className={valueClass}>{numbers.format(value)}</span>
      </span>
    </div>
  )
}

/** The selected level row's estimated power; not shown without power data. */
function PowerCard({
  power,
  className,
}: {
  power: Exclude<PowerFigure, { status: "unavailable" }>
  className?: string
}) {
  const { t, i18n } = useTranslation("library")
  const format = numberFormat(i18n.language)
  return (
    <div
      className={cn(cardClass, className)}
      data-testid="npc-stat-power"
      data-status={power.status}
    >
      {/* Power is an estimate; the page tour's stats step says so. */}
      <span className={labelClass}>{t("npcs.stats.power")}</span>
      {power.status === "loading" ? (
        <Skeleton
          className="h-7 w-16 rounded-md"
          data-testid="npc-stat-power-loading"
        />
      ) : (
        <span className="flex items-center gap-2">
          <EntityIcon size="icon" src={powerIcon()} alt="" />
          <span className={valueClass} data-testid="npc-stat-power-value">
            {format.format(power.value)}
          </span>
        </span>
      )}
    </div>
  )
}

/** Health / Armour / Damage from the selected level row; Movement from the variation; the row's
 *  estimated Power, left out without power data. */
export function NpcStatCards({
  row,
  movement,
  power,
  compact = false,
}: {
  row: NpcStatRow
  movement: number
  power: PowerFigure
  /** Mobile: 2-column card grid (Power across both) instead of a 5-up row. */
  compact?: boolean
}) {
  const { t } = useTranslation("library")

  return (
    <div
      className={cn(
        "grid gap-3",
        compact
          ? "grid-cols-2"
          : power.status === "unavailable"
            ? "grid-cols-2 md:grid-cols-4"
            : "grid-cols-2 md:grid-cols-5"
      )}
      data-testid="npcs-stats"
    >
      <StatCard
        kind="health"
        label={t("npcs.stats.health")}
        value={row.health}
      />
      <StatCard
        kind="armour"
        label={t("npcs.stats.armour")}
        value={row.armour}
      />
      <StatCard
        kind="damage"
        label={t("npcs.stats.damage")}
        value={row.damage}
      />
      <StatCard
        kind="movement"
        label={t("npcs.stats.movement")}
        value={movement}
      />
      {power.status === "unavailable" ? null : (
        <PowerCard
          power={power}
          className={compact ? "col-span-2" : "col-span-2 md:col-span-1"}
        />
      )}
    </div>
  )
}
