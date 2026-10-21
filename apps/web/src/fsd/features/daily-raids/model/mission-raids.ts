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

/** What one battle fought by hand counts toward a manual objective (see hre-campaign-raids). */
type MissionBattleYield =
  "battle" | "abilityUses" | "enemies" | "factionEnemies" | "enemyHealth"

/** The current HRE mission's manual objectives: battles to fight by hand, since raids count no kills,
 * damage or ability uses. */
export type MissionBattlesRequest = {
  /** Each open manual objective: what is left, and what one battle yields toward it (null: the page
   * cannot estimate it, so the list is open-ended unless another objective is quantified). */
  needs: readonly { toGo: number; per: MissionBattleYield | null }[]
  /** Only nodes with this many deployment slots (a full team), when set. */
  slots?: number
  /** Only nodes where this alliance can deploy, when set. */
  alliance?: string
  /** Only nodes with this faction's enemies, when set. */
  faction?: string
  /** Nodes with a lightning-victory condition first (lightning victories are open). */
  preferLightning: boolean
  /** Each battle won by hand also counts toward the raid objective (campaign wins). */
  countsAsRaids: boolean
}

/** What a campaign mission's objectives ask of the HRE lists (see hre-campaign-raids). */
export type MissionRaidsRequest = {
  /** Raids still needed for the current mission's campaign or lightning objective (0: none). */
  battlesToGo: number
  /** Lightning victories: only event-campaign nodes count, so only they are suggested. */
  eventOnly: boolean
  /** The mission's manual objectives, when any is open. */
  manual?: MissionBattlesRequest
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
  /** Points these raids earn in the running Home Screen Event; 0 without one. */
  eventPoints: number
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
  /** The battles to fight by hand for the manual objectives, filled first; null without any. */
  battles: MissionBattlesPlan | null
}

export type MissionBattlesPlan = {
  /** Nodes to fight by hand, in suggestion order. Open-ended rows (no estimate) have 0 battles. */
  rows: MissionRaidRow[]
  totalBattles: number
  totalEnergy: number
  /** No objective has an estimate per battle: the rows are the best nodes, fought until done. */
  openEnded: boolean
  /** Some objective still needs battles once today's suggestions are done. */
  moreNeeded: boolean
  empty: MissionRaidsEmptyReason | null
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
  /** The node's enemy power: HRE campaign points grow with it (the wiki's points formula). */
  enemyPower?: number
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
  /** Points one raid of a node earns in the running Home Screen Event, when one with a raid rule
   * runs: among equal energy costs, nodes earning more come first, so both events progress. */
  eventPointsByBattle?: ReadonlyMap<BattleId, number>
  /** Whether a node may be fought by hand for `battles` (the Raids Filters plus its slots, alliance
   * and faction). */
  passesBattlesFilter?: (battleId: BattleId) => boolean
  /** What one battle of a node fought by hand yields toward a manual objective. */
  battleYield?: (battleId: BattleId, per: MissionBattleYield) => number
}

const compareIds = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
const descending = (a: number, b: number) => b - a

/**
 * Suggestion order: energy cost; then more points in a running Home Screen Event; then more HRE
 * points (a lightning-victory condition, then more enemy power); then a node feeding an in-scope goal; among those, the higher drop rate of the goal's resource (common and
 * uncommon drop more often), then more gold, then the goal's priority; other nodes by gold; then
 * battle id.
 */
function compareCandidates(
  goalNodes: ReadonlyMap<BattleId, MissionGoalNode>,
  eventPoints: ReadonlyMap<BattleId, number> | undefined
): (a: MissionRaidBattle, b: MissionRaidBattle) => number {
  const points = (battle: MissionRaidBattle) => eventPoints?.get(battle.id) ?? 0
  const rate = (
    battle: MissionRaidBattle,
    goal: MissionGoalNode | undefined
  ) => (goal ? (battle.dropRates.get(goal.resourceId) ?? 0) : 0)
  return (a, b) => {
    const goalA = goalNodes.get(a.id)
    const goalB = goalNodes.get(b.id)
    return (
      a.energyCost - b.energyCost ||
      descending(points(a), points(b)) ||
      Number(a.lightningCondition === false) -
        Number(b.lightningCondition === false) ||
      descending(a.enemyPower ?? 0, b.enemyPower ?? 0) ||
      Number(!goalA) - Number(!goalB) ||
      descending(rate(a, goalA), rate(b, goalB)) ||
      descending(a.expectedGold, b.expectedGold) ||
      (goalA?.priority ?? 0) - (goalB?.priority ?? 0) ||
      compareIds(a.id, b.id)
    )
  }
}

/** Open-ended lists (no estimate per battle) show this many of the best nodes. */
const OPEN_ENDED_NODES = 3

/**
 * Where to fight and raid today for the current HRE mission, with the least of today's energy.
 * Today's plan is not counted. The manual objectives' battles to fight by hand come first
 * (`planMissionBattles`); then the raid objective's battles still needed (less the battles won by
 * hand, for campaign wins) are filled over the eligible nodes that drop something, in
 * `compareCandidates` order, each getting as many raids as its attempts left, the budget left and
 * the battles left allow. A node that does not fit is skipped, not a stop. The nodes that drop
 * nothing get the same fill on their own, as an alternative.
 */
export function planMissionRaids(
  input: PlanMissionRaidsInput
): MissionRaidPlan {
  const energyBudget = Math.max(
    0,
    input.dailyEnergy - input.realEnergyUsedToday
  )
  const sort = compareCandidates(
    input.goalNodesByBattle,
    input.eventPointsByBattle
  )
  const battles = input.manual
    ? planMissionBattles(input, input.manual, energyBudget, sort)
    : null
  const spent = battles?.totalEnergy ?? 0
  const raidBudget = energyBudget - spent
  const usedAttempts = new Map(
    (battles?.rows ?? []).map((row) => [row.battleId, row.raids])
  )
  const battlesLeft = Math.max(
    0,
    Math.floor(input.battlesToGo) -
      (input.manual?.countsAsRaids ? (battles?.totalBattles ?? 0) : 0)
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

  const fillFrom = (candidates: readonly MissionRaidBattle[]) =>
    fill(
      [...candidates].sort(sort),
      raidBudget,
      [{ left: battlesLeft, weightOf: () => 1 }],
      input,
      usedAttempts
    )
  const noDropRows =
    battlesLeft > 0 && raidBudget > 0 ? fillFrom(noDropPool).rows : []

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
      battles,
    }
  }

  if (battlesLeft <= 0) return done([], null)
  if (input.eventOnly && !input.battles.some((battle) => battle.isEvent)) {
    return done([], "no-event")
  }
  if (pool.length === 0) {
    return done([], unfiltered ? "filtered" : "no-candidates")
  }
  if (raidBudget <= 0) return done([], "no-energy")

  const { rows, attemptsBlocked } = fillFrom(pool)
  return done(rows, attemptsBlocked ? "no-attempts" : "no-energy")
}

/**
 * The battles to fight by hand for the mission's manual objectives, over every node that passes
 * `passesBattlesFilter` (drops or not: a kill counts anywhere). Nodes with a lightning condition
 * come first while lightning victories are open; then the most of the first estimated objective
 * per energy (the most enemies, enemy health or ability uses; for wins, the cheapest); then
 * `compareCandidates`. Each node gets as many battles as its attempts, the budget and the
 * objective still needing the most battles allow. Without any estimate, the best few nodes are
 * listed open-ended, ranked by enemy health.
 */
function planMissionBattles(
  input: PlanMissionRaidsInput,
  request: MissionBattlesRequest,
  energyBudget: number,
  sort: (a: MissionRaidBattle, b: MissionRaidBattle) => number
): MissionBattlesPlan {
  const yieldOf = (battleId: BattleId, per: MissionBattleYield) =>
    input.battleYield?.(battleId, per) ?? (per === "battle" ? 1 : 0)
  const passes = input.passesBattlesFilter ?? input.passesFilter
  const quantified = request.needs.flatMap((need) =>
    need.per && need.toGo > 0 ? [{ toGo: need.toGo, per: need.per }] : []
  )
  const primary = quantified[0]?.per ?? "enemyHealth"
  const efficiency = (battle: MissionRaidBattle) =>
    yieldOf(battle.id, primary) / battle.energyCost
  const candidates = input.battles
    .filter(
      (battle) =>
        battle.energyCost > 0 &&
        passes(battle.id) &&
        quantified.every((need) => yieldOf(battle.id, need.per) > 0)
    )
    .sort(
      (a, b) =>
        (request.preferLightning
          ? Number(a.lightningCondition === false) -
            Number(b.lightningCondition === false)
          : 0) ||
        efficiency(b) - efficiency(a) ||
        sort(a, b)
    )
  const plan = (
    rows: MissionRaidRow[],
    openEnded: boolean,
    moreNeeded: boolean,
    empty: MissionRaidsEmptyReason | null
  ): MissionBattlesPlan => ({
    rows,
    totalBattles: rows.reduce((total, row) => total + row.raids, 0),
    totalEnergy: rows.reduce((total, row) => total + row.energy, 0),
    openEnded,
    moreNeeded,
    empty: rows.length > 0 ? null : empty,
  })

  if (quantified.length === 0) {
    const rows = candidates
      .filter(
        (battle) =>
          (input.attemptsLeftByBattle.get(battle.id) ?? 1) > 0 &&
          battle.energyCost <= energyBudget
      )
      .slice(0, OPEN_ENDED_NODES)
      .map((battle) => row(battle, 0, input))
    return plan(
      rows,
      true,
      false,
      candidates.length === 0 ? "no-candidates" : "no-energy"
    )
  }
  if (candidates.length === 0) return plan([], false, true, "no-candidates")
  if (energyBudget <= 0) return plan([], false, true, "no-energy")
  const needs = quantified.map((need) => ({
    left: need.toGo,
    weightOf: (battleId: BattleId) => yieldOf(battleId, need.per),
  }))
  const { rows, attemptsBlocked, left } = fill(
    candidates,
    energyBudget,
    needs,
    input
  )
  return plan(
    rows,
    false,
    left.some((value) => value > 0),
    attemptsBlocked ? "no-attempts" : "no-energy"
  )
}

const row = (
  battle: MissionRaidBattle,
  raids: number,
  input: PlanMissionRaidsInput
): MissionRaidRow => ({
  battleId: battle.id,
  energyCost: battle.energyCost,
  raids,
  energy: raids * battle.energyCost,
  goal: input.goalNodesByBattle.get(battle.id) ?? null,
  eventPoints: raids * (input.eventPointsByBattle?.get(battle.id) ?? 0),
})

/** Gives each sorted candidate as many battles as its attempts left (less `usedAttempts`), the
 * budget and the need still wanting the most battles allow; each battle counts `weightOf` toward
 * its need (1 for raids; kills, uses or damage for battles by hand). */
function fill(
  candidates: readonly MissionRaidBattle[],
  energyBudget: number,
  needs: readonly {
    left: number
    weightOf: (battleId: BattleId) => number
  }[],
  input: PlanMissionRaidsInput,
  usedAttempts: ReadonlyMap<BattleId, number> = new Map()
): { rows: MissionRaidRow[]; attemptsBlocked: boolean; left: number[] } {
  let budget = energyBudget
  const left = needs.map((need) => need.left)
  // An affordable node with no attempts left: an empty fill then means attempts ran out, not energy.
  let attemptsBlocked = false
  const rows: MissionRaidRow[] = []
  for (const battle of candidates) {
    if (left.every((value) => value <= 0)) break
    const cap =
      input.attemptsLeftByBattle.get(battle.id) ??
      (battle.dailyAttempts > 0 ? battle.dailyAttempts : Infinity)
    const attempts = cap - (usedAttempts.get(battle.id) ?? 0)
    if (attempts <= 0 && budget >= battle.energyCost) attemptsBlocked = true
    const wanted = Math.max(
      0,
      ...needs.map((need, index) => {
        const weight = need.weightOf(battle.id)
        return left[index]! > 0 && weight > 0
          ? Math.ceil(left[index]! / weight)
          : 0
      })
    )
    const raids = Math.min(
      attempts,
      Math.floor(budget / battle.energyCost),
      wanted
    )
    if (raids <= 0) continue
    budget -= raids * battle.energyCost
    needs.forEach((need, index) => {
      left[index] = left[index]! - raids * need.weightOf(battle.id)
    })
    rows.push(row(battle, raids, input))
  }
  return { rows, attemptsBlocked, left }
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
