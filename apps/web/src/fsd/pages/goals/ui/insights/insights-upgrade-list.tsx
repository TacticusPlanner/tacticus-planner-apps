import { useState } from "react"
import { useTranslation } from "react-i18next"
import { characterIcon, mowIcon } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"

import { PlannedMaterialDetails } from "@/features/daily-raids"
import { LockedNodesOf } from "@/features/goal-planning"
import { EntityIcon } from "@/shared/ui"
import { numberFormat } from "@/shared/lib"

import type { UpgradeRow } from "../../model/insights/insights-materials-view"
import type { InsightsGoalInfo } from "../../model/insights/insights-view"

/** Rows a rarity group shows before its "Show N more". */
const ROW_LIMIT = 10
const PORTRAIT_LIMIT = 2

/**
 * Farmed upgrades one by one, in rarity groups (highest first): icon (opening the material's
 * details), name and count, then, muted, how many are still missing (Required), the days and energy
 * left to farm it, and up to two portraits of the units that need it. Each group shows ten rows,
 * then "Show N more".
 */
export function InsightsUpgradeList({
  groups,
  goalInfoById,
  projectId,
}: {
  groups: readonly { rarity: Rarity; rows: UpgradeRow[] }[]
  goalInfoById: ReadonlyMap<string, InsightsGoalInfo>
  projectId: string | null
}) {
  const { t } = useTranslation(["common", "progression"])
  return (
    <div
      className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-3"
      data-testid="insights-upgrades"
    >
      {groups.map((group) => (
        <RarityGroup
          goalInfoById={goalInfoById}
          key={group.rarity}
          label={t("goals.insights.upgradesOfRarity", {
            rarity: t(`progression:rarities.${group.rarity}`),
          })}
          projectId={projectId}
          rarity={group.rarity}
          rows={group.rows}
        />
      ))}
    </div>
  )
}

function RarityGroup({
  label,
  rarity,
  rows,
  goalInfoById,
  projectId,
}: {
  label: string
  rarity: Rarity
  rows: UpgradeRow[]
  goalInfoById: ReadonlyMap<string, InsightsGoalInfo>
  projectId: string | null
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const hidden = rows.length - ROW_LIMIT
  const shown = expanded ? rows : rows.slice(0, ROW_LIMIT)
  return (
    <section
      aria-label={label}
      className="flex flex-col gap-1.5"
      data-testid={`insights-upgrades-${rarity}`}
    >
      <h4 className="text-xs font-medium text-muted-foreground">{label}</h4>
      <ul className="flex flex-col gap-1">
        {shown.map((row) => (
          <UpgradeRowItem
            goalInfoById={goalInfoById}
            key={row.id}
            projectId={projectId}
            row={row}
          />
        ))}
      </ul>
      {hidden > 0 ? (
        <Button
          aria-expanded={expanded}
          className="relative h-auto justify-self-start p-0 text-xs after:absolute after:inset-x-0 after:-inset-y-2 pointer-coarse:after:-inset-y-4"
          onClick={() => setExpanded((value) => !value)}
          type="button"
          variant="link"
        >
          {expanded
            ? t("goals.insights.materials.showFewer")
            : t("goals.insights.materials.showMore", { count: hidden })}
        </Button>
      ) : null}
    </section>
  )
}

function UpgradeRowItem({
  row,
  goalInfoById,
  projectId,
}: {
  row: UpgradeRow
  goalInfoById: ReadonlyMap<string, InsightsGoalInfo>
  projectId: string | null
}) {
  const { t, i18n } = useTranslation()
  const fmt = (value: number) =>
    numberFormat(i18n.resolvedLanguage).format(value)
  const units = [
    ...new Map(
      row.goalIds.flatMap((goalId) => {
        const info = goalInfoById.get(goalId)
        return info ? [[info.entityId, info] as const] : []
      })
    ).values(),
  ]
  const extraUnits = units.length - PORTRAIT_LIMIT

  return (
    <li
      className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm"
      data-testid={`insights-upgrade-${row.id}`}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <PlannedMaterialDetails
          LockedNodes={LockedNodesOf}
          label={row.label}
          projectId={projectId}
          resourceId={row.id}
          visual={{
            kind: "upgrade",
            id: row.id,
            rarity: row.rarity,
            crafted: false,
          }}
        />
        <span className="min-w-0 wrap-break-word">{row.label}</span>
        <span className="font-semibold tabular-nums">{fmt(row.count)}</span>
        {row.missing !== undefined && row.missing > 0 ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {t("goals.insights.materials.stillMissing", {
              count: row.missing,
            })}
          </span>
        ) : null}
      </span>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
        {row.cost ? (
          <span>
            {t("goals.insights.materials.cost", {
              days: fmt(row.cost.days),
              energy: fmt(row.cost.energy),
            })}
          </span>
        ) : null}
        {units.slice(0, PORTRAIT_LIMIT).map((unit) => (
          <EntityIcon
            alt=""
            key={unit.entityId}
            size="icon"
            src={
              unit.entityType === "Mow"
                ? mowIcon(unit.entityId as never)
                : characterIcon(unit.entityId as never)
            }
          />
        ))}
        {extraUnits > 0 ? (
          <span>
            {t("goals.insights.materials.moreUnits", { count: extraUnits })}
          </span>
        ) : null}
      </span>
    </li>
  )
}
