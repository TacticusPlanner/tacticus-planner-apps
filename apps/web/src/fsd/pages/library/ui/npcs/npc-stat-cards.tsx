import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Info, Zap } from "lucide-react"
import { statIcon, type StatIconKind } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import type { NpcStatRow } from "@/entities/npc"

import type { PowerFigure } from "../unit/unit-power.model"

const cardClass =
  "flex flex-col items-center justify-center gap-1 rounded-lg border bg-card p-3"
const labelClass = "text-xs tracking-wide text-muted-foreground uppercase"
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
  return (
    <div className={cardClass} data-testid={`npc-stat-${kind}`}>
      <span className={labelClass}>{label}</span>
      <span className="flex items-center gap-2">
        <EntityIcon src={statIcon(kind)} alt="" className="size-5" />
        <span className={valueClass}>{value.toLocaleString()}</span>
      </span>
    </div>
  )
}

/** "Estimated" note on the Power card: opens on hover, keyboard focus or tap. */
function EstimateNote() {
  const { t } = useTranslation("library")
  const [open, setOpen] = useState(false)
  // A press focuses the trigger before its click; opening on that focus would make the click that
  // follows toggle the note straight back shut.
  const viaPointer = useRef(false)
  // While a mouse rests on the trigger the note stays open, so a click after the hover opened it
  // doesn't toggle it shut.
  const hovering = useRef(false)
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next || !hovering.current) setOpen(next)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t("npcs.power.estimateLabel")}
          data-testid="npc-stat-power-note"
          onPointerDown={() => {
            viaPointer.current = true
          }}
          onFocus={() => {
            if (!viaPointer.current) setOpen(true)
            viaPointer.current = false
          }}
          onPointerEnter={(event) => {
            if (event.pointerType !== "mouse") return
            hovering.current = true
            setOpen(true)
          }}
          onPointerLeave={(event) => {
            if (event.pointerType !== "mouse") return
            hovering.current = false
            setOpen(false)
          }}
        >
          <Info />
        </Button>
      </PopoverTrigger>
      {/* A read-only note: focus stays where it is. Moving it in on open (hover would steal focus)
          or back to the trigger on close would re-fire the trigger's onFocus and reopen the note,
          so it could never be dismissed. */}
      <PopoverContent
        className="w-72 text-sm"
        data-testid="npc-stat-power-note-content"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {t("npcs.power.estimate")}
      </PopoverContent>
    </Popover>
  )
}

/** The selected level row's estimated power, with its note; "—" when the data is unavailable. */
function PowerCard({
  power,
  className,
}: {
  power: PowerFigure
  className?: string
}) {
  const { t, i18n } = useTranslation("library")
  const format = new Intl.NumberFormat(i18n.language)
  return (
    <div
      className={cn(cardClass, className)}
      data-testid="npc-stat-power"
      data-status={power.status}
    >
      <span className="flex items-center gap-1">
        <span className={labelClass}>{t("npcs.stats.power")}</span>
        <EstimateNote />
      </span>
      {power.status === "loading" ? (
        <Skeleton
          className="h-7 w-16 rounded-md"
          data-testid="npc-stat-power-loading"
        />
      ) : (
        <span className="flex items-center gap-2">
          <Zap aria-hidden className="size-5 text-muted-foreground" />
          <span className={valueClass} data-testid="npc-stat-power-value">
            {power.status === "ready" ? format.format(power.value) : "—"}
          </span>
        </span>
      )}
      {power.status === "unavailable" ? (
        <span className="text-xs text-muted-foreground">
          {t("npcs.power.unavailable")}
        </span>
      ) : null}
    </div>
  )
}

/** Health / Armour / Damage from the selected level row; Movement from the variation; the row's
 *  estimated Power. */
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
        compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-5"
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
      <PowerCard
        power={power}
        className={compact ? "col-span-2" : "col-span-2 md:col-span-1"}
      />
    </div>
  )
}
