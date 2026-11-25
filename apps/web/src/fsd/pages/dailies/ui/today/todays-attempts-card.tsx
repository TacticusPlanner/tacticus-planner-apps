import type { BattleId } from "@workspace/game-domain"
import { CheckIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  ResourceIconWithTooltip,
  useRaidGrouping,
} from "@/features/daily-raids"
import type {
  DailyRaidBattleResource,
  DailyRaidLocationViewModel,
  DailyRaidsReadyViewModel,
} from "@/features/daily-raids"
import { CampaignLocationName, EntityIcon } from "@/shared/ui"

import { TodayCard } from "./today-card"
import { todaysAttemptProgress } from "./today-view-model"
import type { TodayView } from "./today-view-model"
import { groupTodaysAttempts } from "./todays-attempts-groups"
import type { TodaysAttemptRow } from "./todays-attempts-groups"

/** How a row sits: alone (named in full), under its upgrade's header, or under its campaign's. */
type RowPlacement = "alone" | "underUpgrade" | "underCampaign"

/**
 * Every node the player has really raided today, account-wide, grouped as the Raids lists are (Group
 * by). By upgrade, a material raided at several nodes shows its have / need once in a header, then a
 * row per node; by campaign, a campaign header, then a row per battle with what it drops. A group of
 * one row shows no header: the row names its location and material in full, as before.
 */
export function TodaysAttemptsCard({
  raids,
  view,
}: {
  raids: DailyRaidsReadyViewModel
  view: TodayView
}) {
  const { t } = useTranslation("dailies")
  const [grouping] = useRaidGrouping()

  // A node this project's plan names keeps the resource it is farmed for; every other node falls
  // back to the catalog's own node → drop index (tacticus-planner-apps#121).
  const resourceOf = (battleId: BattleId) =>
    view.planResourceByBattle.get(battleId) ??
    raids.resourceByBattleId.get(battleId)
  const rows: TodaysAttemptRow[] = raids.todaysAttempts.map(
    ({ battleId, attemptsUsed }) => ({
      battleId,
      attemptsUsed,
      resourceId: resourceOf(battleId)?.resourceId,
      campaignKey: raids.locationsByBattleId.get(battleId)?.campaignKey,
    })
  )
  // The plan's campaigns in the order it lists them.
  const campaignOrder = [
    ...new Set(
      [...view.planResourceByBattle.keys()].flatMap(
        (battleId) => raids.locationsByBattleId.get(battleId)?.campaignKey ?? []
      )
    ),
  ]
  const groups = groupTodaysAttempts(rows, grouping, campaignOrder)

  const renderRow = (row: TodaysAttemptRow, placement: RowPlacement) => (
    <AttemptRow
      key={row.battleId}
      location={raids.locationsByBattleId.get(row.battleId)}
      placement={placement}
      progress={todaysAttemptProgress(raids, row.resourceId)}
      resource={resourceOf(row.battleId)}
      row={row}
    />
  )

  return (
    <TodayCard
      meta={
        view.attempts.rows > 0
          ? t("todaysAttempts.meta", {
              count: view.attempts.rows,
              attempts: t("todaysAttempts.count", {
                count: view.attempts.total,
              }),
            })
          : undefined
      }
      testId="todays-attempts"
      title={t("todaysAttempts.title")}
    >
      {groups.length > 0 ? (
        <ul data-testid="todays-attempts-list">
          {groups.map((group) => {
            const first = group.rows[0]
            if (!first) return null
            if (group.rows.length === 1 || group.groupKey === undefined) {
              return renderRow(first, "alone")
            }
            const placement: RowPlacement =
              grouping === "upgrade" ? "underUpgrade" : "underCampaign"
            return (
              <li
                className="border-t py-1.5 first:border-t-0"
                data-testid={`todays-attempts-group-${group.key}`}
                key={group.key}
              >
                {grouping === "upgrade" ? (
                  <UpgradeHeader
                    progress={todaysAttemptProgress(raids, first.resourceId)}
                    resource={resourceOf(first.battleId)}
                  />
                ) : (
                  <CampaignHeader
                    location={raids.locationsByBattleId.get(first.battleId)}
                  />
                )}
                <ul className="ps-8">
                  {group.rows.map((row) => renderRow(row, placement))}
                </ul>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("todaysAttempts.empty")}
        </p>
      )}
    </TodayCard>
  )
}

type Progress = ReturnType<typeof todaysAttemptProgress>

function UpgradeHeader({
  resource,
  progress,
}: {
  resource: DailyRaidBattleResource | undefined
  progress: Progress
}) {
  return (
    <div className="flex min-h-9 items-center gap-2">
      {resource ? (
        <ResourceIconWithTooltip
          size="row"
          label={resource.label}
          visual={resource.visual}
        />
      ) : null}
      <span className="min-w-0 flex-1 text-sm font-semibold wrap-break-word">
        {resource?.label}
      </span>
      {progress ? <ProgressText progress={progress} /> : null}
    </div>
  )
}

function CampaignHeader({
  location,
}: {
  location: DailyRaidLocationViewModel | undefined
}) {
  return (
    <div className="flex min-h-9 items-center gap-2">
      {location?.icon ? (
        <EntityIcon
          size="row"
          alt=""
          className="shrink-0"
          src={location.icon}
        />
      ) : null}
      <span className="min-w-0 flex-1 text-sm font-semibold wrap-break-word">
        {location ? (
          <CampaignLocationName
            campaignName={location.campaignName}
            difficultyLabel={location.difficultyLabel}
            nodeLabel={location.difficultyLabel}
          />
        ) : null}
      </span>
    </div>
  )
}

/** One raided node. Its accessible name always says it in full, whatever its header already says. */
function AttemptRow({
  row,
  placement,
  location,
  resource,
  progress,
}: {
  row: TodaysAttemptRow
  placement: RowPlacement
  location: DailyRaidLocationViewModel | undefined
  resource: DailyRaidBattleResource | undefined
  progress: Progress
}) {
  const { t } = useTranslation("dailies")
  const campaign = location?.campaignName ?? row.battleId
  const count = t("todaysAttempts.count", { count: row.attemptsUsed })
  const rowLabel = {
    material: resource?.label ?? "",
    campaign,
    node: location?.nodeLabel ?? "",
    attempts: count,
  }
  // Under its upgrade the header holds the material and its have / need; under its campaign the
  // header holds the campaign, so the row names only its battle.
  const showMaterial = placement !== "underUpgrade"
  const showProgress = placement !== "underUpgrade" && progress !== undefined

  return (
    <li
      aria-label={
        progress
          ? t("todaysAttempts.rowLabelProgress", {
              ...rowLabel,
              progress: progress.done
                ? t("todaysAttempts.progressDone", progress)
                : t("schedule.progress", progress),
            })
          : t("todaysAttempts.rowLabel", rowLabel)
      }
      className={
        placement === "alone"
          ? "flex min-h-9 items-center gap-2 border-t py-1.5 first:border-t-0"
          : "flex min-h-8 items-center gap-2 py-1"
      }
      data-testid={`todays-attempt-${row.battleId}`}
    >
      {showMaterial ? (
        resource ? (
          <ResourceIconWithTooltip
            size="row"
            label={resource.label}
            visual={resource.visual}
          />
        ) : (
          // A node the catalog has no drop for at all (e.g. a dataset gap) still keeps its leading
          // slot, so the campaign icon and text stay aligned down the whole list.
          <span aria-hidden className="size-6 shrink-0" />
        )
      ) : null}
      {placement !== "underCampaign" && location?.icon ? (
        <EntityIcon
          size="inline"
          alt=""
          className="shrink-0"
          src={location.icon}
        />
      ) : null}
      <span className="min-w-0 flex-1 text-sm font-medium wrap-break-word">
        {placement === "underCampaign" ? (
          (location?.nodeLabel ?? row.battleId)
        ) : (
          <CampaignLocationName
            campaignName={campaign}
            difficultyLabel={location?.difficultyLabel}
            nodeLabel={location?.nodeLabel}
          />
        )}
      </span>
      <span className="flex shrink-0 flex-col items-end text-xs whitespace-nowrap tabular-nums">
        {showProgress ? (
          <ProgressText progress={progress} testId={row.battleId} />
        ) : null}
        <span className="text-muted-foreground">{count}</span>
      </span>
    </li>
  )
}

function ProgressText({
  progress,
  testId,
}: {
  progress: NonNullable<Progress>
  testId?: string
}) {
  const { t } = useTranslation("dailies")
  return (
    <span
      className={
        progress.done
          ? "inline-flex items-center gap-0.5 text-xs font-semibold whitespace-nowrap text-success-foreground tabular-nums"
          : "text-xs font-semibold whitespace-nowrap tabular-nums"
      }
      data-done={progress.done || undefined}
      data-testid={testId ? `todays-attempt-${testId}-progress` : undefined}
    >
      {progress.done ? (
        <CheckIcon aria-hidden className="size-icon-sm" />
      ) : null}
      {progress.owned} / {progress.target}
      {progress.done ? (
        <span className="sr-only">{t("todaysAttempts.done")}</span>
      ) : null}
    </span>
  )
}
