import { useTranslation } from "react-i18next"
import { statIcon, type StatIconKind } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import type { NpcStatRow } from "@/entities/npc"

function StatCard({
  kind,
  label,
  value,
}: {
  kind: StatIconKind
  label: string
  value: number
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1 rounded-lg border bg-card p-3"
      data-testid={`npc-stat-${kind}`}
    >
      <span className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="flex items-center gap-2">
        <EntityIcon src={statIcon(kind)} alt="" className="size-5" />
        <span className="text-xl font-semibold tabular-nums">
          {value.toLocaleString()}
        </span>
      </span>
    </div>
  )
}

/** Health / Armour / Damage from the selected level row; Movement from the variation. */
export function NpcStatCards({
  row,
  movement,
  compact = false,
}: {
  row: NpcStatRow
  movement: number
  /** Mobile: 2x2 card grid instead of a 4-up row. */
  compact?: boolean
}) {
  const { t } = useTranslation("library")

  return (
    <div
      className={cn(
        "grid gap-3",
        compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"
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
    </div>
  )
}
