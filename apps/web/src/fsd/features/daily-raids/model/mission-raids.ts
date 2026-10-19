import type { BattleId } from "@workspace/game-domain"

import {
  allocatePlanInventory,
  collectFarmNodes,
  type EstimatePlanParams,
  type EstimateResourceId,
  type EstimateUpgrade,
  type GoalNeed,
} from "@/features/goal-farming/@x/daily-raids"
import type { Battle } from "@/shared/lib"

/** What a campaign mission objective asks of the raid list (see hre-campaign-raids). */
export type MissionRaidsRequest = {
  /** Battles still needed for the current mission's objective. */
  battlesToGo: number
  /** Lightning victories: only event-campaign nodes count, so only they are suggested. */
  eventOnly: boolean
  /** Only nodes with this many deployment slots (a full team), when set. */
  slots?: number
  /** Only nodes where this alliance can deploy (an all-alliance objective), when set. */
  alliance?: string
  /** A faction-kill objective: a separate list of nodes with that faction's enemies, when set. */
  enemyFaction?: { faction: string; killsToGo: number }
}

/** The best-priority goal a node feeds, for the tie-break among equal energy costs. */
export type MissionGoalNode = {
  priority: number
  goalIds: string[]
  resourceId: EstimateResourceId
}

type MissionRaidRow = {
  battleId: BattleId
  energyCost: number
  raids: number
  energy: number
  /** Set when the node drops a resource an in-scope goal still needs. */
  goal: MissionGoalNode | null
}

type MissionRaidsEmptyReason =
  "no-energy" | "no-attempts" | "no-candidates" | "filtered" | "no-event"

export type MissionRaidPlan = {
  /** Battles still needed for the objective. */
  battlesLeft: number
  /** Daily energy minus the energy really spent today, never below 0. */
  energyBudget: number
  /** Suggestions over nodes that drop something. */
  rows: MissionRaidRow[]
  totalRaids: number
  totalEnergy: number
  /** Battles still left once today's suggestions are done. */
  remainingAfter: number
  empty: MissionRaidsEmptyReason | null
  /** The same fill over the nodes that drop nothing (Indomitus 6 to 14): an alternative some players
   * use first, since each of these raids replaces one of `rows` for less energy. */
  noDropRows: MissionRaidRow[]
  /** Every raidable node (unlock state and Raids Filters applied, the lightning restriction not),
   * for the event-bounded campaign outlook, which sorts them itself. */
  outlookNodes: Pick<Battle, "energyCost" | "dailyAttempts">[]
  /** The Planning Settings daily energy, for the outlook. */
  dailyEnergy: number
  /** For a faction-kill objective: nodes with that faction's enemies, most enemies first, any campaign
   * (only nodes with a lightning condition while lightning victories are open),
   * filled until their enemies cover the kills still needed, with the energy `rows` leave. */
  factionRows: MissionRaidRow[]
}

export type MissionRaidBattle = Pick<Battle, "energyCost" | "dailyAttempts"> & {
  id: BattleId
  isEvent: boolean
  /** Average guaranteed gold of one win (0 when it guarantees none). */
  expectedGold: number
  /** Drop rate per resource the node can drop; empty for a node that drops nothing. */
  dropRates: ReadonlyMap<string, number>
  /** False for a node with no lightning-victory condition (Indomitus below node 19); absent means
   * it has one. */
  lightningCondition?: boolean
}

export type PlanMissionRaidsInput = MissionRaidsRequest & {
  /** The battles the player can raid by campaign progress (event nodes only while their event runs). */
  battles: readonly MissionRaidBattle[]
  /** Synced attempts left today; a node absent here has its full daily cap. */
  attemptsLeftByBattle: ReadonlyMap<BattleId, number>
  dailyEnergy: number
  realEnergyUsedToday: number
  goalNodesByBattle: ReadonlyMap<BattleId, MissionGoalNode>
  passesFilter: (battleId: BattleId) => boolean
  /** Kills one raid of a node yields toward `enemyFaction`: its enemy count when that faction is
   * among its enemies, else 0. */
  factionKillsPerRaid?: (battleId: BattleId) => number
}

const compareIds = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
const descending = (a: number, b: number) => b - a

/**
 * Suggestion order: energy cost; then a node feeding an in-scope goal; among those, the higher drop
 * rate of the goal's resource (common and uncommon drop more often), then more gold, then the
 * goal's priority; other nodes by gold; then battle id.
 */
function compareCandidates(
  goalNodes: ReadonlyMap<BattleId, MissionGoalNode>
): (a: MissionRaidBattle, b: MissionRaidBattle) => number {
  const rate = (
    battle: MissionRaidBattle,
    goal: MissionGoalNode | undefined
  ) => (goal ? (battle.dropRates.get(goal.resourceId) ?? 0) : 0)
  return (a, b) => {
    const goalA = goalNodes.get(a.id)
    const goalB = goalNodes.get(b.id)
    return (
      a.energyCost - b.energyCost ||
      Number(!goalA) - Number(!goalB) ||
      descending(rate(a, goalA), rate(b, goalB)) ||
      descending(a.expectedGold, b.expectedGold) ||
      (goalA?.priority ?? 0) - (goalB?.priority ?? 0) ||
      compareIds(a.id, b.id)
    )
  }
}

/**
 * Where to raid today so the current HRE mission's campaign objective finishes with the least
 * energy left today. Today's plan is not counted: the battles still needed are filled over the
 * eligible nodes that drop something, in `compareCandidates` order, each getting as many raids as
 * its attempts, the budget and the battles left allow. A node that does not fit is
 * skipped, not a stop. The nodes that drop nothing get the same fill on their own, as an
 * alternative.
 */
export function planMissionRaids(
  input: PlanMissionRaidsInput
): MissionRaidPlan {
  const battlesLeft = Math.max(0, Math.floor(input.battlesToGo))
  const energyBudget = Math.max(
    0,
    input.dailyEnergy - input.realEnergyUsedToday
  )

  const raidable = (battle: MissionRaidBattle) =>
    battle.energyCost > 0 && (!input.eventOnly || battle.isEvent)
  const filtered = input.battles.filter(
    (battle) => raidable(battle) && input.passesFilter(battle.id)
  )
  const pool = filtered.filter((battle) => battle.dropRates.size > 0)
  const noDropPool = filtered.filter((battle) => battle.dropRates.size === 0)
  const unfiltered = input.battles.some(
    (battle) => raidable(battle) && battle.dropRates.size > 0
  )
  // The outlook counts campaign battles, which any node serves, so it ignores the lightning
  // restriction (but keeps unlock state and the Raids Filters).
  const outlookNodes = input.battles
    .filter((battle) => battle.energyCost > 0 && input.passesFilter(battle.id))
    .map(({ energyCost, dailyAttempts }) => ({ energyCost, dailyAttempts }))

  const sort = compareCandidates(input.goalNodesByBattle)
  const fillFrom = (candidates: readonly MissionRaidBattle[]) =>
    fill([...candidates].sort(sort), energyBudget, battlesLeft, input)
  const noDropRows =
    battlesLeft > 0 && energyBudget > 0 ? fillFrom(noDropPool).rows : []

  // Nodes with the faction's enemies, outside the main list, with the energy it leaves; each raid
  // counts the node's enemies toward the kills still needed, so the most enemies come first (the
  // fewest raids), then the usual order.
  const factionFill = (rows: readonly MissionRaidRow[]): MissionRaidRow[] => {
    const killsOf = input.factionKillsPerRaid
    const killsToGo = input.enemyFaction?.killsToGo ?? 0
    if (!killsOf || killsToGo <= 0) return []
    const used = new Set(rows.map((row) => row.battleId))
    const spent = rows.reduce((total, row) => total + row.energy, 0)
    const candidates = input.battles
      .filter(
        (battle) =>
          battle.energyCost > 0 &&
          !used.has(battle.id) &&
          input.passesFilter(battle.id) &&
          killsOf(battle.id) > 0 &&
          // With lightning victories open, each raid should serve both objectives.
          (!input.eventOnly || battle.lightningCondition !== false)
      )
      .sort((a, b) => killsOf(b.id) - killsOf(a.id) || sort(a, b))
    return fill(candidates, energyBudget - spent, killsToGo, input, killsOf)
      .rows
  }

  const done = (
    rows: MissionRaidRow[],
    empty: MissionRaidsEmptyReason | null
  ): MissionRaidPlan => {
    const totalRaids = rows.reduce((total, row) => total + row.raids, 0)
    return {
      battlesLeft,
      energyBudget,
      rows,
      totalRaids,
      totalEnergy: rows.reduce((total, row) => total + row.energy, 0),
      remainingAfter: Math.max(0, battlesLeft - totalRaids),
      empty: rows.length > 0 ? null : empty,
      noDropRows,
      outlookNodes,
      dailyEnergy: input.dailyEnergy,
      factionRows: factionFill(rows),
    }
  }

  if (input.eventOnly && !input.battles.some((battle) => battle.isEvent)) {
    return done([], "no-event")
  }
  if (pool.length === 0) {
    return done([], unfiltered ? "filtered" : "no-candidates")
  }
  if (energyBudget <= 0) return done([], "no-energy")

  const { rows, attemptsBlocked } = fillFrom(pool)
  return done(rows, attemptsBlocked ? "no-attempts" : "no-energy")
}

/** Gives each sorted candidate as many raids as its attempts, the budget and the battles allow;
 * with `weightOf`, each raid counts that many toward `battlesLeft` (kills, for faction nodes). */
function fill(
  candidates: readonly MissionRaidBattle[],
  energyBudget: number,
  battlesLeft: number,
  input: PlanMissionRaidsInput,
  weightOf: (battleId: BattleId) => number = () => 1
): { rows: MissionRaidRow[]; attemptsBlocked: boolean } {
  let budget = energyBudget
  let left = battlesLeft
  // An affordable node with no attempts left: an empty fill then means attempts ran out, not energy.
  let attemptsBlocked = false
  const rows: MissionRaidRow[] = []
  for (const battle of candidates) {
    if (left <= 0) break
    const cap =
      input.attemptsLeftByBattle.get(battle.id) ??
      (battle.dailyAttempts > 0 ? battle.dailyAttempts : Infinity)
    const attempts = cap
    if (attempts <= 0 && budget >= battle.energyCost) attemptsBlocked = true
    const weight = weightOf(battle.id)
    const raids = Math.min(
      attempts,
      Math.floor(budget / battle.energyCost),
      Math.ceil(left / weight)
    )
    if (raids <= 0) continue
    budget -= raids * battle.energyCost
    left -= raids * weight
    rows.push({
      battleId: battle.id,
      energyCost: battle.energyCost,
      raids,
      energy: raids * battle.energyCost,
      goal: input.goalNodesByBattle.get(battle.id) ?? null,
    })
  }
  return { rows, attemptsBlocked }
}

/**
 * Per node, the best-priority in-scope goal it feeds: a node drops a resource some goal still needs
 * over its whole schedule (after the Plan's priority-ordered inventory allocation). A goal with
 * pinned farm locations is served only by them, as on the HSE farm list.
 */
export function buildMissionGoalNodes(
  goals: readonly GoalNeed[],
  inventory: EstimatePlanParams["inventory"],
  upgradesById: ReadonlyMap<EstimateResourceId, EstimateUpgrade>,
  battlesById: ReadonlyMap<BattleId, Battle>
): Map<BattleId, MissionGoalNode> {
  const sorted = [...goals].sort((a, b) => a.priority - b.priority)
  const allocations = allocatePlanInventory(sorted, inventory)
  const nodes = new Map<BattleId, MissionGoalNode>()
  for (const goal of sorted) {
    const pins =
      goal.farmingLocationIds && goal.farmingLocationIds.length > 0
        ? goal.farmingLocationIds
        : undefined
    for (const stage of allocations.get(goal.goalId)?.stages ?? []) {
      for (const need of stage.remaining) {
        if (need.count <= 0) continue
        const upgrade = upgradesById.get(need.id)
        if (!upgrade) continue
        for (const node of collectFarmNodes(upgrade, battlesById, pins)) {
          const existing = nodes.get(node.battleId)
          if (!existing) {
            nodes.set(node.battleId, {
              priority: goal.priority,
              goalIds: [goal.goalId],
              resourceId: need.id,
            })
          } else if (!existing.goalIds.includes(goal.goalId)) {
            existing.goalIds.push(goal.goalId)
          }
        }
      }
    }
  }
  return nodes
}
