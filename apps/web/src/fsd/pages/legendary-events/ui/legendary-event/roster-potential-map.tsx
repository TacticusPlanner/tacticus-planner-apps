import { useTranslation } from "react-i18next"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import {
  ObjectiveIcon,
  useObjectiveLabel,
  type LegendaryEventLane,
  type PotentialCellState,
} from "@/entities/legendary-event"

import type { LanePotentialViewModel } from "./lane-potential.view-model"
import { useProgressColumns } from "./progress/progress-columns"

const STATES: readonly PotentialCellState[] = [
  "cleared",
  "teams",
  "roster",
  "out",
]

/** Filled, outlined, hatched, empty (design D3): the states never rely on colour alone. */
const CELL_CLASS: Record<PotentialCellState, string> = {
  cleared: "bg-(--event-legendary)",
  teams: "border-2 border-(--event-legendary) bg-background",
  roster:
    "border border-(--event-legendary)/60 bg-[repeating-linear-gradient(135deg,var(--event-legendary)_0_1.5px,transparent_1.5px_4px)]",
  out: "border border-border bg-muted/40",
}

/**
 * A lane's roster potential map (spec: potential mini map): one column per battle, defeat-all
 * then the five objectives as rows, with the summary lines above and the legend below. A column's
 * label (battle, points, each row's state) shows as a tooltip on desktop and a popover on tap on
 * mobile.
 */
export function RosterPotentialMap({
  lane,
  view,
  isMobile,
}: {
  lane: LegendaryEventLane
  view: LanePotentialViewModel
  isMobile: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const columns = useProgressColumns(lane)
  if (view.kind === "loading") {
    return (
      <div data-testid="roster-potential-loading">
        <span className="sr-only">{t("hub.loading")}</span>
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    )
  }
  return (
    <div className="flex min-w-0 flex-col gap-2" data-testid="roster-potential">
      <PotentialSummary lane={lane} view={view} />
      <div className="flex min-w-0 gap-1">
        <div aria-hidden className="flex shrink-0 flex-col gap-px pt-0">
          {columns.map((column, row) => (
            <span className="flex h-3.5 items-center" key={row}>
              <ObjectiveIcon className="size-3.5" icon={column.icon} />
            </span>
          ))}
        </div>
        <ol
          aria-label={t("laneOverview.potential.title")}
          className="flex min-w-0 flex-1 gap-px"
          data-testid="roster-potential-map"
        >
          {view.cells.map((cells, battle) => {
            const label = [
              t("laneOverview.potential.column", {
                battle: battle + 1,
                points: lane.battlesPoints[battle] ?? 0,
              }),
              ...cells.map((state, row) =>
                t("laneOverview.potential.cellLabel", {
                  row: columns[row]?.label ?? "",
                  state: t(`laneOverview.potential.states.${state}`),
                })
              ),
            ].join(" · ")
            const column = (
              <button
                aria-label={label}
                className="flex w-full min-w-0 flex-col gap-px rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                data-testid="roster-potential-column"
                type="button"
              >
                {cells.map((state, row) => (
                  <span
                    className={cn(
                      "h-3.5 w-full rounded-[2px]",
                      CELL_CLASS[state]
                    )}
                    data-state={state}
                    data-testid="roster-potential-cell"
                    key={row}
                  />
                ))}
                <span
                  aria-hidden
                  className="text-center text-[10px] leading-3 text-muted-foreground tabular-nums"
                >
                  {!isMobile || battle % 3 === 0 ? battle + 1 : " "}
                </span>
              </button>
            )
            return (
              <li className="min-w-0 flex-1" key={battle}>
                {isMobile ? (
                  <Popover>
                    <PopoverTrigger asChild>{column}</PopoverTrigger>
                    <PopoverContent className="w-64 text-sm">
                      {label}
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>{column}</TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                )}
              </li>
            )
          })}
        </ol>
      </div>
      <ul
        className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"
        data-testid="roster-potential-legend"
      >
        {STATES.map((state) => (
          <li className="flex items-center gap-1" key={state}>
            <span
              aria-hidden
              className={cn("size-3 rounded-[2px]", CELL_CLASS[state])}
            />
            {t(`laneOverview.potential.states.${state}`)}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PotentialSummary({
  lane,
  view,
}: {
  lane: LegendaryEventLane
  view: Exclude<LanePotentialViewModel, { kind: "loading" }>
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  const number = new Intl.NumberFormat(i18n.language)
  if (view.kind === "unavailable") {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="roster-potential-summary"
      >
        {t("laneOverview.potential.needsEstimates")}
      </p>
    )
  }
  const { potential } = view
  const uncovered = lane.unitsRestrictions
    .filter((objective) =>
      potential.uncoveredObjectiveIndexes.includes(objective.index)
    )
    .sort((a, b) => a.index - b.index)
    .map((objective) => objectiveLabel(objective).label)
  const uncoveredText =
    uncovered.length > 0
      ? t("laneOverview.potential.noUnitFor", {
          objectives: uncovered.join(", "),
        })
      : ""
  return (
    <div
      className="flex flex-col text-sm"
      data-testid="roster-potential-summary"
    >
      <p className="font-medium">
        {potential.defeatAllDepth === 0
          ? t("laneOverview.potential.cantWin")
          : t("laneOverview.potential.reaches", {
              battle: potential.defeatAllDepth,
              points: number.format(potential.pointsLeft),
              total: number.format(potential.lanePointsLeft),
            })}
      </p>
      <p className="text-muted-foreground">
        {potential.fallsBehindBattle === null
          ? t("laneOverview.potential.reachesAll") + uncoveredText
          : t("laneOverview.potential.fallsBehind", {
              battle: potential.fallsBehindBattle,
            }) + uncoveredText}
      </p>
    </div>
  )
}
