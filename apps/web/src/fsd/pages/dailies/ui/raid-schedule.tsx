import type { ReactNode } from "react"
import type { BattleId } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import type { RaidBreakdownEntry } from "@/features/goal-farming"

import type {
  DailyRaidGoalViewModel,
  DailyRaidLocationViewModel,
  DailyRaidResourceProgress,
  DailyRaidResourceVisual,
} from "../model/daily-raids.domain"
import { dailyRaidResourceKey } from "../model/daily-raids.domain"
import { isLocationVisible } from "../model/location-visibility"
import { GoalTargetBadge, ResourceCard, UnitIcon } from "./resource-card"

// Stable default so callers that never use "location" emphasis (Raids Plan) don't need to pass
// this prop, and don't allocate a new Map identity on every render.
const NO_ATTEMPTS_LEFT_DATA: ReadonlyMap<BattleId, number> = new Map()

type GoalGroup = ReturnType<typeof groupEntries>[number]

export function RaidSchedule({
  entries,
  bonusEntries,
  bonusLabel,
  bonusFooter,
  attemptsLeftByBattle = NO_ATTEMPTS_LEFT_DATA,
  attemptsUsedByBattle,
  goalsById,
  locationsByBattleId,
  resourceLabels,
  resourceProgress,
  resourceVisuals,
  compact = false,
  emphasis = "material",
  layout = "wide",
  testId,
}: {
  entries: RaidBreakdownEntry[]
  // Bonus Raids continues the same masonry-column flow as `entries` instead of starting its own
  // container below — `columns` packs items into whichever column has room, which only works if
  // both sets of goal groups are flow items in one shared container. `bonusLabel` is rendered
  // *inside* the first bonus group's own section (not as a separate flow item) so a column break
  // can never separate the heading from the content it introduces; `bonusFooter` (e.g. a "Show
  // more" control) is likewise rendered inside the last bonus group's section.
  bonusEntries?: RaidBreakdownEntry[]
  bonusLabel?: string
  bonusFooter?: ReactNode
  attemptsLeftByBattle?: ReadonlyMap<BattleId, number>
  attemptsUsedByBattle: ReadonlyMap<BattleId, number>
  goalsById: ReadonlyMap<string, DailyRaidGoalViewModel>
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
  resourceLabels: ReadonlyMap<string, string>
  resourceProgress: ReadonlyMap<string, DailyRaidResourceProgress>
  resourceVisuals: ReadonlyMap<string, DailyRaidResourceVisual>
  compact?: boolean
  emphasis?: "material" | "location"
  layout?: "wide" | "column"
  testId: string
}) {
  const grouped = groupEntries(entries, goalsById)
  const bonusGrouped = bonusEntries ? groupEntries(bonusEntries, goalsById) : []

  const isGroupVisible = (resources: GoalGroup["resources"]) =>
    emphasis !== "location" ||
    resources.some(({ entries: resourceEntries }) =>
      resourceEntries.some((entry) =>
        isLocationVisible(entry, attemptsLeftByBattle)
      )
    )
  const visibleBonusGrouped = bonusGrouped.filter(({ resources }) =>
    isGroupVisible(resources)
  )

  const renderGroup = (
    { goal, resources }: GoalGroup,
    header?: ReactNode,
    footer?: ReactNode
  ) => {
    const onlyResource = resources.length === 1 ? resources[0] : undefined
    const onlyVisual = onlyResource
      ? resourceVisuals.get(onlyResource.resourceId)
      : undefined
    const combinesShardIdentity =
      onlyVisual?.kind === "shard" && onlyVisual.unitId === goal.unitId

    // A goal group whose every resource has been fully de-duped away (every location's real
    // attempts are exhausted) renders no cards — skip the section entirely instead of leaving an
    // empty header/grid shell that still reserves masonry-column space.
    if (!isGroupVisible(resources)) return null

    return (
      <section
        key={goal.goalId}
        className={cn(
          "space-y-2 md:space-y-3",
          layout === "wide" && "md:mb-5 md:break-inside-avoid-column"
        )}
      >
        {header}
        {!combinesShardIdentity ? <GoalHeader goal={goal} /> : null}
        <div
          className="grid gap-2 md:gap-3"
          data-testid={`raid-resource-grid-${goal.goalId}`}
        >
          {resources.map(({ resourceId, entries: resourceEntries }) => (
            <ResourceCard
              key={resourceId}
              attemptsLeftByBattle={attemptsLeftByBattle}
              attemptsUsedByBattle={attemptsUsedByBattle}
              compact={compact}
              emphasis={emphasis}
              goal={combinesShardIdentity ? goal : undefined}
              label={resourceLabels.get(resourceId) ?? resourceId}
              locationsByBattleId={locationsByBattleId}
              progress={resourceProgress.get(
                dailyRaidResourceKey(goal.goalId, resourceId)
              )}
              resourceEntries={resourceEntries}
              resourceId={resourceId}
              visual={resourceVisuals.get(resourceId)}
            />
          ))}
        </div>
        {footer}
      </section>
    )
  }

  return (
    // "wide" layout uses CSS multi-column (not grid-template-columns) so shorter goal groups don't
    // get stretched to match a taller one in the same grid row — grid sizes each row to its tallest
    // cell, which left dead space beneath short cards; columns instead pack items top-to-bottom
    // per column, masonry-style, with no such gap.
    <div
      className={cn(
        "flex flex-col gap-4 md:gap-5",
        layout === "wide" && "md:block md:columns-[20rem] md:gap-x-5"
      )}
      data-testid={testId}
    >
      {grouped.map((group) => renderGroup(group))}
      {visibleBonusGrouped.map((group, index) =>
        renderGroup(
          group,
          index === 0 ? (
            <h3
              className="mb-2 text-sm font-semibold text-muted-foreground"
              data-testid="bonus-raids-heading"
            >
              {bonusLabel}
            </h3>
          ) : undefined,
          index === visibleBonusGrouped.length - 1 ? bonusFooter : undefined
        )
      )}
    </div>
  )
}

function GoalHeader({ goal }: { goal: DailyRaidGoalViewModel }) {
  return (
    <div className="flex items-center gap-2 border-b pb-2">
      <UnitIcon goal={goal} className="size-9 md:size-10" />
      <div className="min-w-0 leading-tight">
        <h3 className="truncate font-semibold">{goal.unitLabel}</h3>
        <p className="truncate text-xs text-muted-foreground md:text-sm">
          <GoalTargetBadge goal={goal} />
        </p>
      </div>
    </div>
  )
}

function groupEntries(
  entries: RaidBreakdownEntry[],
  goalsById: ReadonlyMap<string, DailyRaidGoalViewModel>
) {
  const byGoal = new Map<string, Map<string, RaidBreakdownEntry[]>>()
  for (const entry of entries) {
    const resources = byGoal.get(entry.goalId) ?? new Map()
    const resourceEntries = resources.get(entry.resourceId) ?? []
    resourceEntries.push(entry)
    resources.set(entry.resourceId, resourceEntries)
    byGoal.set(entry.goalId, resources)
  }
  return [...byGoal.entries()]
    .map(([goalId, resources]) => ({
      goal: goalsById.get(goalId) ?? {
        goalId,
        priority: Number.MAX_SAFE_INTEGER,
        unitId: goalId as never,
        unitType: "Character" as const,
        unitLabel: goalId,
        targetLabel: "",
        goalKind: "Unlock" as const,
      },
      resources: [...resources.entries()].map(
        ([resourceId, resourceEntries]) => ({
          resourceId,
          entries: resourceEntries,
        })
      ),
    }))
    .sort((left, right) => left.goal.priority - right.goal.priority)
}
