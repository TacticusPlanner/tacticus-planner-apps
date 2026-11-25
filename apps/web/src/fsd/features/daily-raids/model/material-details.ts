import type { BattleId } from "@workspace/game-domain"

import type {
  DailyRaidGoalViewModel,
  DailyRaidsReadyViewModel,
  ResourceShopSource,
} from "./daily-raids.domain"
import { planCellAlternatives } from "./plan-cell-alternatives"
import type { PlanCellAlternative } from "./plan-cell-alternatives"
import { buildPlanDayCells } from "./plan-day-cells"
import type { PlanCell } from "./plan-day-cells"

/** A locked node that drops a material, worded by whoever knows how far away it is (Goals' unlock
 *  paths), closest first. */
export type MaterialLockedNode = {
  battleId: BattleId
  /** "7 battles to go", "during the campaign event". */
  distance: string
  /** Anything else in the way, one line each. */
  notes: readonly string[]
}

/** An alternative node, with how far away it is when it's locked and that is known. */
export type MaterialAlternative = PlanCellAlternative & {
  distance?: string
  notes: readonly string[]
}

export type MaterialAlternatives = {
  campaigns: MaterialAlternative[]
  events: MaterialAlternative[]
  shops: readonly ResourceShopSource[]
}

/**
 * A material's other sources for its details popover: `planCellAlternatives` (raidable nodes first,
 * then locked ones), with each locked node's distance from `lockedNodes` and the locked nodes
 * reordered closest first. A locked node `lockedNodes` doesn't know (another filter excludes it)
 * keeps its place after them.
 */
export function materialAlternatives(
  cell: Pick<PlanCell, "resourceId" | "nodes">,
  raids: Pick<
    DailyRaidsReadyViewModel,
    "sourcesByResource" | "eligibleBattleIds" | "locationsByBattleId"
  >,
  exhaustedBattleIds: ReadonlySet<BattleId>,
  lockedNodes: readonly MaterialLockedNode[] = []
): MaterialAlternatives {
  const { campaigns, events, shops } = planCellAlternatives(
    cell,
    raids.sourcesByResource,
    raids.eligibleBattleIds,
    (battleId) => raids.locationsByBattleId.get(battleId)?.isEvent ?? false,
    exhaustedBattleIds
  )
  const rank = new Map(
    lockedNodes.map((node, index) => [node.battleId, { node, index }])
  )
  const withDistance = (
    alternatives: PlanCellAlternative[]
  ): MaterialAlternative[] => {
    const open = alternatives.filter((alternative) => !alternative.locked)
    const locked = alternatives
      .filter((alternative) => alternative.locked)
      .map((alternative, catalogIndex) => ({
        alternative,
        catalogIndex,
        known: rank.get(alternative.battleId),
      }))
      .toSorted((a, b) => {
        const byDistance =
          (a.known?.index ?? Number.MAX_SAFE_INTEGER) -
          (b.known?.index ?? Number.MAX_SAFE_INTEGER)
        return byDistance === 0 ? a.catalogIndex - b.catalogIndex : byDistance
      })
    return [
      ...open.map((alternative) => ({ ...alternative, notes: [] })),
      ...locked.map(({ alternative, known }) => ({
        ...alternative,
        distance: known?.node.distance,
        notes: known?.node.notes ?? [],
      })),
    ]
  }
  return {
    campaigns: withDistance(campaigns),
    events: withDistance(events),
    shops,
  }
}

/** Today's nodes whose real attempts are spent: they can't be an alternative until tomorrow. */
export function exhaustedBattleIdsOf(
  raids: Pick<DailyRaidsReadyViewModel, "attemptsLeftByBattle">
): ReadonlySet<BattleId> {
  return new Set(
    [...raids.attemptsLeftByBattle]
      .filter(([, left]) => left === 0)
      .map(([battleId]) => battleId)
  )
}

/**
 * A material as Raids shows it in its details popover: today's raids for it across all its nodes
 * (as Plan > Schedule's day 1 cell has them), its have / need over every goal, and the units that
 * need it, highest priority first — those from the plan's later days when today doesn't raid it.
 */
export function todaysMaterialCell(
  raids: Pick<
    DailyRaidsReadyViewModel,
    | "today"
    | "planDays"
    | "goalsById"
    | "resourceProgressByDay"
    | "resourceTotals"
    | "attemptsLeftByBattle"
    | "shopOffersById"
  >,
  resourceId: string
): PlanCell {
  const cells = buildPlanDayCells(raids.today, raids)
  const today = [...cells.actionable, ...cells.raided].find(
    (cell) => cell.resourceId === resourceId
  )
  const totals = raids.resourceTotals.get(resourceId)
  return {
    resourceId,
    owned: totals?.owned ?? today?.owned ?? 0,
    target: totals?.target ?? today?.target ?? 0,
    units: today?.units ?? unitsNeeding(raids, resourceId),
    nodes: today?.nodes ?? [],
  }
}

function unitsNeeding(
  raids: Pick<DailyRaidsReadyViewModel, "planDays" | "goalsById">,
  resourceId: string
): DailyRaidGoalViewModel[] {
  const goals = new Map<string, DailyRaidGoalViewModel>()
  for (const day of raids.planDays) {
    for (const entry of day.entries) {
      if (entry.resourceId !== resourceId) continue
      const goal = raids.goalsById.get(entry.goalId)
      if (goal) goals.set(goal.goalId, goal)
    }
  }
  const units = new Map<string, DailyRaidGoalViewModel>()
  for (const goal of [...goals.values()].toSorted(
    (a, b) => a.priority - b.priority
  )) {
    if (!units.has(goal.unitId)) units.set(goal.unitId, goal)
  }
  return [...units.values()]
}
