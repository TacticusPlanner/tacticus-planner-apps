import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import {
  applyStatAdjustment,
  type AdjustedStatsView,
  type RaidBoss,
  type RaidBossStatStep,
} from "@/entities/raid-boss"

export type RaidBossAdjustedProps = {
  view: AdjustedStatsView
  /** Keyed by `AdjustedPrimePanel.id`. */
  hpLostByPrime: Record<string, number>
  onHpLostChange: (primePanelId: string, hpLost: number) => void
  /** Keyed by `AdjustedPrimePanel.id`. */
  primeLabels: Record<string, string>
  /** Field-enemy names after `unitAmountDecrease` removals, and what was removed. */
  enemyNames: string[]
  removed: { name: string; count: number }[]
}

type StatRowSpec = {
  key: string
  label: string
  base: number
  percent?: boolean
}

function affectedRows(
  unit: RaidBoss,
  step: RaidBossStatStep,
  view: AdjustedStatsView,
  labels: {
    damage: string
    armor: string
    movement: string
    critChance: string
    critDamage: string
    blockChance: string
  }
): StatRowSpec[] {
  const touched = new Set([
    ...Object.keys(view.statAdjustments.pctByStat),
    ...Object.keys(view.statAdjustments.flatByStat),
  ])
  const candidates: StatRowSpec[] = [
    { key: "dmg", label: labels.damage, base: step.damage },
    { key: "fixedArmor", label: labels.armor, base: step.fixedArmor },
    { key: "movement", label: labels.movement, base: unit.movement },
  ]
  if (step.critChance != null)
    candidates.push({
      key: "critChance",
      label: labels.critChance,
      base: Math.round(step.critChance * 100),
      percent: true,
    })
  if (step.critDamage != null)
    candidates.push({
      key: "critDmg",
      label: labels.critDamage,
      base: Math.round(step.critDamage * 100),
      percent: true,
    })
  if (step.blockChance != null)
    candidates.push({
      key: "blockChance",
      label: labels.blockChance,
      base: Math.round(step.blockChance * 100),
      percent: true,
    })
  return candidates.filter((row) => touched.has(row.key))
}

/**
 * Boss-only adjusted-stats view: an HP-lost selector per prime, then the boss's stats recomputed for
 * the modifiers active at those points, alongside their unadjusted values, plus the field-enemy list
 * with `unitAmountDecrease` removals applied. On mobile a toggle hides the adjusted column.
 */
export function RaidBossAdjustedStats({
  unit,
  step,
  view,
  hpLostByPrime,
  onHpLostChange,
  primeLabels,
  enemyNames,
  removed,
  compact = false,
}: RaidBossAdjustedProps & {
  unit: RaidBoss
  step: RaidBossStatStep
  compact?: boolean
}) {
  const { t } = useTranslation("library")
  const [showAdjusted, setShowAdjusted] = useState(!compact)

  const rows = affectedRows(unit, step, view, {
    damage: t("raidBosses.damage"),
    armor: t("raidBosses.armor"),
    movement: t("raidBosses.movement"),
    critChance: t("raidBosses.critChance"),
    critDamage: t("raidBosses.critDamage"),
    blockChance: t("raidBosses.blockChance"),
  })
  const hitsDelta = view.statAdjustments.flatByStat.hits ?? 0
  const nothingActive =
    view.activeModifiers.length === 0 && removed.length === 0

  const fmt = (value: number, percent?: boolean) =>
    percent ? `${value}%` : value.toLocaleString()

  return (
    <div data-testid="raid-boss-adjusted-stats" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {t("raidBosses.adjustedStatsHeading")}
        </h3>
        {compact ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdjusted((v) => !v)}
          >
            {showAdjusted
              ? t("raidBosses.hideAdjusted")
              : t("raidBosses.showAdjusted")}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {view.primes.map((panel) => (
          <label
            key={panel.id}
            className="flex flex-wrap items-center gap-2 text-sm"
          >
            <span className="min-w-24 text-muted-foreground">
              {primeLabels[panel.id] ?? panel.unitSetId}
            </span>
            <Select
              value={String(hpLostByPrime[panel.id] ?? 0)}
              onValueChange={(value) => onHpLostChange(panel.id, Number(value))}
            >
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {panel.hpLostPoints.map((point) => (
                  <SelectItem key={point} value={String(point)}>
                    {point === 0
                      ? t("raidBosses.fullHp")
                      : t("raidBosses.hpLostAmount", {
                          hpLost: point.toLocaleString(),
                          total: panel.totalHp.toLocaleString(),
                        })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ))}
      </div>

      {nothingActive ? (
        <p className="text-sm text-muted-foreground">
          {t("raidBosses.noActiveModifiers")}
        </p>
      ) : (
        <>
          {rows.length || hitsDelta ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("raidBosses.stats")}</TableHead>
                  <TableHead className="text-right">
                    {t("raidBosses.baseColumn")}
                  </TableHead>
                  {showAdjusted ? (
                    <TableHead className="text-right">
                      {t("raidBosses.adjustedColumn")}
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="text-muted-foreground">
                      {row.label}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(row.base, row.percent)}
                    </TableCell>
                    {showAdjusted ? (
                      <TableCell className="text-right font-medium tabular-nums">
                        {fmt(
                          applyStatAdjustment(
                            row.base,
                            row.key,
                            view.statAdjustments
                          ),
                          row.percent
                        )}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
                {hitsDelta ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      {t("raidBosses.weaponHits")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">—</TableCell>
                    {showAdjusted ? (
                      <TableCell className="text-right font-medium tabular-nums">
                        {hitsDelta > 0 ? `+${hitsDelta}` : hitsDelta}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          ) : null}

          {removed.length ? (
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">
                {t("raidBosses.fieldEnemies")}
              </span>
              <p>{enemyNames.join(", ") || "—"}</p>
              <div className="flex flex-wrap gap-1">
                {removed.map((entry) => (
                  <Badge key={entry.name} variant="outline">
                    {t("raidBosses.enemyRemoved", {
                      count: entry.count,
                      name: entry.name,
                    })}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
