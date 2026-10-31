import type { ReactNode } from "react"
import type { BattleId } from "@workspace/game-domain"

import type { RaidBreakdownEntry } from "@/features/goal-farming/@x/daily-raids"

import {
  dailyRaidResourceKey,
  type DailyRaidGoalViewModel,
  type DailyRaidLocationViewModel,
  type DailyRaidResourceProgress,
  type DailyRaidResourceUrgency,
  type DailyRaidResourceVisual,
} from "../model/daily-raids.domain"
import { isLocationVisible } from "../model/location-visibility"
import { GoalTargetBadge, ResourceCard, UnitIcon } from "./resource-card"

// Stable default so callers that never use "location" emphasis (Raids Plan) don't need to pass
// this prop, and don't allocate a new Map identity on every render.
const NO_ATTEMPTS_LEFT_DATA: ReadonlyMap<BattleId, number> = new Map()
const NO_RESOURCE_URGENCY_DATA: ReadonlyMap<string, DailyRaidResourceUrgency> =
  new Map()

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
  resourceUrgencyByGoalAndResource = NO_RESOURCE_URGENCY_DATA,
  resourceVisuals,
  emphasis = "material",
  grouping = "goal",
  testId,
}: {
  entries: RaidBreakdownEntry[]
  // Bonus Raids continues the same flow as `entries` instead of starting its own container below.
  // `bonusLabel` is rendered *inside* the first bonus group's own section (not as a separate flow
  // item) so the heading stays with the content it introduces; `bonusFooter` (e.g. a "Show more"
  // control) is likewise rendered inside the last bonus group's section.
  bonusEntries?: RaidBreakdownEntry[]
  bonusLabel?: string
  bonusFooter?: ReactNode
  attemptsLeftByBattle?: ReadonlyMap<BattleId, number>
  attemptsUsedByBattle: ReadonlyMap<BattleId, number>
  goalsById: ReadonlyMap<string, DailyRaidGoalViewModel>
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
  resourceLabels: ReadonlyMap<string, string>
  resourceProgress: ReadonlyMap<string, DailyRaidResourceProgress>
  resourceUrgencyByGoalAndResource?: ReadonlyMap<
    string,
    DailyRaidResourceUrgency
  >
  resourceVisuals: ReadonlyMap<string, DailyRaidResourceVisual>
  emphasis?: "material" | "location"
  // "combined" (Today's Combine goals): one list with no goal headers, in the entries' own order,
  // with `resourceProgress` keyed by resource alone.
  grouping?: "goal" | "combined"
  testId: string
}) {
  const group = (groupedEntries: RaidBreakdownEntry[]) =>
    grouping === "combined"
      ? combineEntries(groupedEntries)
      : groupEntries(
          groupedEntries,
          goalsById,
          resourceUrgencyByGoalAndResource
        )
  const grouped = group(entries)
  const bonusGrouped = bonusEntries ? group(bonusEntries) : []

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
    keyPrefix: string,
    header?: ReactNode,
    footer?: ReactNode
  ) => {
    const onlyResource = resources.length === 1 ? resources[0] : undefined
    const onlyVisual = onlyResource
      ? resourceVisuals.get(onlyResource.resourceId)
      : undefined
    const combinesShardIdentity =
      grouping === "goal" &&
      onlyVisual?.kind === "shard" &&
      onlyVisual.unitId === goal.unitId

    // A goal group whose every resource has been fully de-duped away (every location's real
    // attempts are exhausted) renders no cards — skip the section entirely instead of leaving an
    // empty header/grid shell.
    if (!isGroupVisible(resources)) return null

    return (
      <section
        key={`${keyPrefix}-${goal.goalId}`}
        className="space-y-2 md:space-y-3"
      >
        {header}
        {grouping === "goal" && !combinesShardIdentity ? (
          <GoalHeader goal={goal} />
        ) : null}
        <div
          // Never wider than the group: a dashboard track can be narrower than 20rem.
          className="grid gap-2 md:grid-cols-[repeat(auto-fill,minmax(min(20rem,100%),1fr))] md:gap-3"
          data-testid={`raid-resource-grid-${goal.goalId}`}
        >
          {resources.map(({ resourceId, entries: resourceEntries }) => (
            <ResourceCard
              key={resourceId}
              attemptsLeftByBattle={attemptsLeftByBattle}
              attemptsUsedByBattle={attemptsUsedByBattle}
              emphasis={emphasis}
              goal={combinesShardIdentity ? goal : undefined}
              label={resourceLabels.get(resourceId) ?? resourceId}
              locationsByBattleId={locationsByBattleId}
              progress={resourceProgress.get(
                grouping === "combined"
                  ? resourceId
                  : dailyRaidResourceKey(goal.goalId, resourceId)
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
    // Goal groups stack full width and each group's cards fill as many 20rem columns as fit, so a
    // day with a single goal group still uses the whole width.
    <div className="flex flex-col gap-4 md:gap-5" data-testid={testId}>
      {grouped.map((group) => renderGroup(group, "today"))}
      {visibleBonusGrouped.map((group, index) =>
        renderGroup(
          group,
          "bonus",
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
      {bonusEntries &&
      bonusEntries.length > 0 &&
      visibleBonusGrouped.length === 0 ? (
        // Every bonus goal group got de-duped away (all its locations are exhausted), but the
        // heading/footer (e.g. "Show more") must still surface — there's no visible group section
        // left to attach them to, so render them as their own flow item instead of dropping them.
        <div key="bonus-raids-fallback">
          <h3
            className="mb-2 text-sm font-semibold text-muted-foreground"
            data-testid="bonus-raids-heading"
          >
            {bonusLabel}
          </h3>
          {bonusFooter}
        </div>
      ) : null}
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

const COMBINED_GROUP: DailyRaidGoalViewModel = {
  goalId: "combined",
  priority: 0,
  unitId: "combined" as never,
  unitType: "Character",
  unitLabel: "",
  targetLabel: "",
  goalKind: "Unlock",
}

/** Combine goals: every entry in one group, resources in the order they first appear. */
function combineEntries(entries: RaidBreakdownEntry[]): GoalGroup[] {
  const resources = new Map<string, RaidBreakdownEntry[]>()
  for (const entry of entries) {
    const resourceEntries = resources.get(entry.resourceId) ?? []
    resourceEntries.push(entry)
    resources.set(entry.resourceId, resourceEntries)
  }
  if (resources.size === 0) return []
  return [
    {
      goal: COMBINED_GROUP,
      resources: [...resources.entries()].map(
        ([resourceId, resourceEntries]) => ({
          resourceId,
          entries: resourceEntries,
        })
      ),
    },
  ]
}

function groupEntries(
  entries: RaidBreakdownEntry[],
  goalsById: ReadonlyMap<string, DailyRaidGoalViewModel>,
  resourceUrgencyByGoalAndResource: ReadonlyMap<
    string,
    DailyRaidResourceUrgency
  >
) {
  const byGoal = new Map<string, Map<string, RaidBreakdownEntry[]>>()
  for (const entry of entries) {
    const resources =
      byGoal.get(entry.goalId) ?? new Map<string, RaidBreakdownEntry[]>()
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
      resources: [...resources.entries()]
        .map(([resourceId, resourceEntries]) => ({
          resourceId,
          entries: resourceEntries,
        }))
        .sort((left, right) => {
          const leftUrgency = resourceUrgencyByGoalAndResource.get(
            dailyRaidResourceKey(goalId, left.resourceId)
          )
          const rightUrgency = resourceUrgencyByGoalAndResource.get(
            dailyRaidResourceKey(goalId, right.resourceId)
          )
          const byDays = (rightUrgency?.days ?? -1) - (leftUrgency?.days ?? -1)
          if (byDays !== 0) return byDays
          const byEnergy =
            (rightUrgency?.energyTotal ?? -1) - (leftUrgency?.energyTotal ?? -1)
          if (byEnergy !== 0) return byEnergy
          return left.resourceId.localeCompare(right.resourceId)
        }),
    }))
    .sort((left, right) => left.goal.priority - right.goal.priority)
}
