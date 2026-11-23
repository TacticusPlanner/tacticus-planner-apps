import { campaignDescriptor } from "@workspace/game-catalog"
import { Rarity, rarityRank } from "@workspace/game-domain"
import type { BattleId } from "@workspace/game-domain"

import {
  allocatePlanInventory,
  collectFarmNodes,
} from "@/entities/goal-farming"
import type {
  EstimatePlanParams,
  EstimateResourceId,
  EstimateUpgrade,
  GoalNeed,
} from "@/entities/goal-farming"
import type { Battle } from "@/shared/lib"
import { compareCodeUnits, firstDifference } from "@/shared/lib"

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
  /** Only nodes where this faction can deploy (the featured hero's), when set. */
  heroFaction?: string
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
  /** How many of the resource the in-scope goals still need in all; unknown when absent. */
  need?: number
  /** The resource is an Epic or higher upgrade on a node that is not Elite, which drops it rarely:
   * the node still feeds the goal, but ranks after the nodes that feed one at a good rate (and
   * before the nodes that feed none). */
  lowRate?: true
}

/** 0 for a node feeding a goal, 1 for one feeding it at a low rate (`lowRate`), 2 for none. */
const goalTier = (goal: MissionGoalNode | undefined) =>
  goal ? (goal.lowRate ? 1 : 0) : 2

type MissionRaidRow = {
  battleId: BattleId
  energyCost: number
  raids: number
  energy: number
  /** Set when the node drops a resource an in-scope goal still needs. */
  goal: MissionGoalNode | null
  /** Points these raids earn in the running Home Screen Event; 0 without one. */
  eventPoints: number
  /** Who may deploy there, for the team that fights it by hand. */
  deploy?: MissionDeploy
  /** The enemies one battle there defeats toward a kill objective, on rows fought by hand for one. */
  enemies?: number
}

/** A node's deployment rules: the allied factions its campaign lets you field and its slots. */
export type MissionDeploy = {
  factions: readonly string[]
  slots: number
}

type MissionRaidsEmptyReason =
  "no-energy" | "no-attempts" | "no-candidates" | "filtered" | "no-event"

export type MissionRaidPlan = {
  /** Battles still needed for the objective. */
  battlesLeft: number
  /** The energy the suggestions may spend: Infinity from `planHookMissionRaids` (not bound to today), else daily energy minus the energy really spent today, never below 0. */
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
  deploy?: MissionDeploy
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
  /** Today's "Combine goals": goal priority no longer breaks ties between nodes. */
  combineGoals?: boolean
  /** "CE nodes first": the running campaign event's reached nodes, ranked ahead of the others that
   * feed a goal the same way (or none), even when they cost more energy. */
  preferredBattleIds?: ReadonlySet<BattleId>
  /** Plan as if energy were unlimited: only attempts and the objective bound the suggestions. */
  unlimitedEnergy?: boolean
  /** Whether a node may be fought by hand for `battles` (the Raids Filters plus its slots, alliance
   * and faction). */
  passesBattlesFilter?: (battleId: BattleId) => boolean
  /** What one battle of a node fought by hand yields toward a manual objective. */
  battleYield?: (battleId: BattleId, per: MissionBattleYield) => number
}

const descending = (a: number, b: number) => b - a

/**
 * Suggestion order: a node feeding an in-scope goal first, one feeding it at a low rate next
 * (`goalTier`); then, with "CE nodes first", the running
 * campaign event's nodes; then energy cost; then more points in a running Home Screen Event; then more HRE
 * points (a lightning-victory condition, then more enemy power); then a node feeding an in-scope goal; among those, the higher drop rate of the goal's resource (common and
 * uncommon drop more often), then more gold, then the goal's priority (skipped with `combineGoals`);
 * other nodes by gold; then battle id.
 */
function compareCandidates(
  goalNodes: ReadonlyMap<BattleId, MissionGoalNode>,
  eventPoints: ReadonlyMap<BattleId, number> | undefined,
  combineGoals = false,
  preferred?: ReadonlySet<BattleId>
): (a: MissionRaidBattle, b: MissionRaidBattle) => number {
  const later = (battle: MissionRaidBattle) =>
    preferred ? Number(!preferred.has(battle.id)) : 0
  const points = (battle: MissionRaidBattle) => eventPoints?.get(battle.id) ?? 0
  const rate = (
    battle: MissionRaidBattle,
    goal: MissionGoalNode | undefined
  ) => (goal ? (battle.dropRates.get(goal.resourceId) ?? 0) : 0)
  return (a, b) => {
    const goalA = goalNodes.get(a.id)
    const goalB = goalNodes.get(b.id)
    // Nodes that feed a goal come first of all (Severyn, 2026-10), then the cheapest.
    return firstDifference(
      goalTier(goalA) - goalTier(goalB),
      later(a) - later(b),
      a.energyCost - b.energyCost,
      descending(points(a), points(b)),
      Number(a.lightningCondition === false) -
        Number(b.lightningCondition === false),
      descending(a.enemyPower ?? 0, b.enemyPower ?? 0),
      descending(rate(a, goalA), rate(b, goalB)),
      descending(a.expectedGold, b.expectedGold),
      combineGoals ? 0 : (goalA?.priority ?? 0) - (goalB?.priority ?? 0),
      compareCodeUnits(a.id, b.id)
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
  const energyBudget = input.unlimitedEnergy
    ? Infinity
    : Math.max(0, input.dailyEnergy - input.realEnergyUsedToday)
  const sort = compareCandidates(
    input.goalNodesByBattle,
    input.eventPointsByBattle,
    input.combineGoals,
    input.preferredBattleIds
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

  const noDropRows =
    battlesLeft > 0 && raidBudget > 0
      ? fill(
          noDropPool.toSorted(sort),
          raidBudget,
          [{ left: battlesLeft, weightOf: () => 1 }],
          input,
          usedAttempts
        ).rows
      : []

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
  if (input.eventOnly && input.battles.every((battle) => !battle.isEvent)) {
    return done([], "no-event")
  }
  if (pool.length === 0) {
    return done([], unfiltered ? "filtered" : "no-candidates")
  }
  if (raidBudget <= 0) return done([], "no-energy")

  const { rows, attemptsBlocked } = fillRaids(
    pool,
    raidBudget,
    battlesLeft,
    input,
    usedAttempts
  )
  return done(rows, attemptsBlocked ? "no-attempts" : "no-energy")
}

/**
 * The raid fill over the nodes that drop something: like `fill` with one need (the battles left),
 * but a node feeds its goal only until the raids already taken are expected to drop what the goals
 * still need of its resource (raids times drop rate). A goal node gets no more raids for its goal
 * than that, and once its resource is covered every node dropping it ranks as a node that feeds no
 * goal, so six Combat Stimms take the Extremis raids that cover them and not every node that drops
 * them (Severyn, 2026-11). Nodes still feeding a goal rank by energy per expected drop (after "CE
 * nodes first"), so the best drop rate wins over a cheaper node that rarely drops it. The battles
 * left are then filled as usual.
 */
function fillRaids(
  pool: readonly MissionRaidBattle[],
  energyBudget: number,
  battlesLeft: number,
  input: PlanMissionRaidsInput,
  usedAttempts: ReadonlyMap<BattleId, number>
): { rows: MissionRaidRow[]; attemptsBlocked: boolean } {
  const expected = new Map<string, number>()
  const used = new Map(usedAttempts)
  const raidsOf = new Map<MissionRaidBattle, number>()
  let budget = energyBudget
  let left = battlesLeft
  let attemptsBlocked = false
  // The goal a node still feeds: none once the raids taken cover its resource.
  const openGoal = (battle: MissionRaidBattle) => {
    const goal = input.goalNodesByBattle.get(battle.id)
    if (!goal || goal.need === undefined) return goal
    return (expected.get(goal.resourceId) ?? 0) < goal.need ? goal : undefined
  }
  const attemptsLeft = (battle: MissionRaidBattle) =>
    (input.attemptsLeftByBattle.get(battle.id) ??
      (battle.dailyAttempts > 0 ? battle.dailyAttempts : Infinity)) -
    (used.get(battle.id) ?? 0)
  for (;;) {
    if (left <= 0) break
    const open = new Map<BattleId, MissionGoalNode>()
    for (const battle of pool) {
      const goal = openGoal(battle)
      if (goal) open.set(battle.id, goal)
    }
    const sort = openGoalSort(open, input)
    const next = pool
      .filter((battle) => {
        const attempts = attemptsLeft(battle)
        if (attempts <= 0 && budget >= battle.energyCost) {
          attemptsBlocked = true
        }
        return attempts > 0 && budget >= battle.energyCost
      })
      .toSorted(sort)[0]
    if (!next) break
    const raids = Math.min(
      attemptsLeft(next),
      Math.floor(budget / next.energyCost),
      left,
      raidsForGoal(next, open.get(next.id), expected)
    )
    budget -= raids * next.energyCost
    left -= raids
    used.set(next.id, (used.get(next.id) ?? 0) + raids)
    const drops = input.goalNodesByBattle.get(next.id)
    if (drops) {
      const dropRate = next.dropRates.get(drops.resourceId) ?? 0
      expected.set(
        drops.resourceId,
        (expected.get(drops.resourceId) ?? 0) + raids * dropRate
      )
    }
    const taken = raidsOf.get(next)
    raidsOf.set(next, (taken ?? 0) + raids)
  }
  // A node picked twice (for its goal, then as filler) keeps its first place.
  const rows = [...raidsOf].map(([battle, raids]) => row(battle, raids, input))
  return { rows, attemptsBlocked: rows.length === 0 && attemptsBlocked }
}

/** `compareCandidates` with the nodes still feeding a goal (`open`) first (by `goalTier`), then "CE nodes first",
 * then among goal nodes the least energy per expected drop of the goal's resource. */
function openGoalSort(
  open: ReadonlyMap<BattleId, MissionGoalNode>,
  input: PlanMissionRaidsInput
): (a: MissionRaidBattle, b: MissionRaidBattle) => number {
  const preferred = input.preferredBattleIds
  const base = compareCandidates(
    open,
    input.eventPointsByBattle,
    input.combineGoals,
    preferred
  )
  const later = (battle: MissionRaidBattle) =>
    preferred ? Number(!preferred.has(battle.id)) : 0
  const perItem = (battle: MissionRaidBattle) => {
    const goal = open.get(battle.id)
    const rate = goal ? (battle.dropRates.get(goal.resourceId) ?? 0) : 0
    return goal && rate > 0 ? battle.energyCost / rate : 0
  }
  return (a, b) =>
    firstDifference(
      goalTier(open.get(a.id)) - goalTier(open.get(b.id)),
      later(a) - later(b),
      perItem(a) - perItem(b),
      base(a, b)
    )
}

/** The raids a node still feeding `goal` gets for it: enough to drop what is left of the need at
 * its rate; unbounded for a node feeding no goal or one whose need is unknown. */
function raidsForGoal(
  battle: MissionRaidBattle,
  goal: MissionGoalNode | undefined,
  expected: ReadonlyMap<string, number>
): number {
  const rate = goal ? (battle.dropRates.get(goal.resourceId) ?? 0) : 0
  if (goal?.need === undefined || rate <= 0) return Infinity
  const left = goal.need - (expected.get(goal.resourceId) ?? 0)
  return Math.max(1, Math.ceil(left / rate - 1e-9))
}

/**
 * The battles to fight by hand for the mission's manual objectives, over every node that passes
 * `passesBattlesFilter` (drops or not: a kill counts anywhere). Nodes with a lightning condition
 * come first while lightning victories are open; then the nodes that feed a goal; then
 * the least energy to finish the first estimated objective at that node alone (its battles times
 * their cost, so a node with more enemies than the kills left is no better than one with just
 * enough), then the fewest of those battles; then
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
  const primaryLeft = quantified[0]?.toGo
  // The battles a node alone takes to finish the first estimated objective, and their energy: five
  // kills to go rank every node with five enemies or more by energy alone, not the biggest node
  // first. Open-ended, the most of it per energy.
  const battlesToFinish = (battle: MissionRaidBattle) =>
    primaryLeft === undefined
      ? 1
      : Math.ceil(primaryLeft / yieldOf(battle.id, primary))
  const finishCost = (battle: MissionRaidBattle) =>
    primaryLeft === undefined
      ? -yieldOf(battle.id, primary) / battle.energyCost
      : battlesToFinish(battle) * battle.energyCost
  const kills = quantified.find(
    (need) => need.per === "enemies" || need.per === "factionEnemies"
  )?.per
  const withEnemies = (rows: MissionRaidRow[]) =>
    kills
      ? rows.map((row) => ({ ...row, enemies: yieldOf(row.battleId, kills) }))
      : rows
  const candidates = input.battles
    .filter(
      (battle) =>
        battle.energyCost > 0 &&
        passes(battle.id) &&
        quantified.every((need) => yieldOf(battle.id, need.per) > 0)
    )
    .toSorted((a, b) =>
      firstDifference(
        request.preferLightning
          ? Number(a.lightningCondition === false) -
              Number(b.lightningCondition === false)
          : 0,
        goalTier(input.goalNodesByBattle.get(a.id)) -
          goalTier(input.goalNodesByBattle.get(b.id)),
        finishCost(a) - finishCost(b),
        battlesToFinish(a) - battlesToFinish(b),
        sort(a, b)
      )
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
    withEnemies(rows),
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
  ...(battle.deploy ? { deploy: battle.deploy } : {}),
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
  // Each need's remaining amount, updated as battles are taken.
  const open = needs.map((need) => ({ ...need }))
  // An affordable node with no attempts left: an empty fill then means attempts ran out, not energy.
  let attemptsBlocked = false
  const rows: MissionRaidRow[] = []
  for (const battle of candidates) {
    if (open.every((need) => need.left <= 0)) break
    const cap =
      input.attemptsLeftByBattle.get(battle.id) ??
      (battle.dailyAttempts > 0 ? battle.dailyAttempts : Infinity)
    const attempts = cap - (usedAttempts.get(battle.id) ?? 0)
    if (attempts <= 0 && budget >= battle.energyCost) attemptsBlocked = true
    const wanted = Math.max(
      0,
      ...open.map((need) => {
        const weight = need.weightOf(battle.id)
        return need.left > 0 && weight > 0 ? Math.ceil(need.left / weight) : 0
      })
    )
    const raids = Math.min(
      attempts,
      Math.floor(budget / battle.energyCost),
      wanted
    )
    if (raids <= 0) continue
    budget -= raids * battle.energyCost
    for (const need of open) need.left -= raids * need.weightOf(battle.id)
    rows.push(row(battle, raids, input))
  }
  return { rows, attemptsBlocked, left: open.map((need) => need.left) }
}

/**
 * Whether a node is an Elite tier: a storyline Elite or Elite Mirror node, or an event's Extremis
 * node. Only these drop Epic and higher upgrades often enough to farm them.
 */
function isEliteBattle(
  battle: Pick<Battle, "campaignGroupId" | "type">
): boolean {
  const token = campaignDescriptor(
    battle.campaignGroupId,
    battle.type
  )?.difficultyToken
  return token === "elite" || token === "eventExtremis"
}

/** How well a node farms a goal's upgrade: an Epic or higher one (`eliteOnly`) only at a low rate
 * off Elite nodes; unknown when the node is not in the catalog. */
function farmRate(
  eliteOnly: boolean,
  battle: Battle | undefined
): "full" | "low" | "unknown" {
  if (!eliteOnly) return "full"
  if (!battle) return "unknown"
  return isEliteBattle(battle) ? "full" : "low"
}

/** An Epic or higher upgrade, farmed at a good rate only on Elite nodes (see `isEliteBattle`). */
const eliteOnlyRarity = (rarity: Rarity | undefined) =>
  rarity !== undefined && rarityRank(rarity) >= rarityRank(Rarity.Epic)

/**
 * Per node, the best-priority in-scope goal it feeds: a node drops a resource some goal still needs
 * over its whole schedule (after the Plan's priority-ordered inventory allocation). A goal with
 * pinned farm locations is served only by them, as on the HSE farm list. Otherwise an Epic or higher
 * upgrade (`rarityOf` gives an upgrade's rarity) on a node that is not Elite is marked `lowRate`: a
 * standard or Mirror node drops it too rarely to farm it there first (Severyn, 2026-11), but a raid
 * there still beats one that feeds no goal, such as an event's 25B when only event nodes count
 * (Severyn, 2026-11). Each node carries how many of its resource the goals still need in all, so the
 * raids stop favouring it once they cover that.
 */
export function buildMissionGoalNodes(
  goals: readonly GoalNeed[],
  inventory: EstimatePlanParams["inventory"],
  upgradesById: ReadonlyMap<EstimateResourceId, EstimateUpgrade>,
  battlesById: ReadonlyMap<BattleId, Battle>,
  rarityOf: (id: EstimateResourceId) => Rarity | undefined = () => undefined
): Map<BattleId, MissionGoalNode> {
  const sorted = goals.toSorted((a, b) => a.priority - b.priority)
  const allocations = allocatePlanInventory(sorted, inventory)
  const nodes = new Map<BattleId, MissionGoalNode>()
  const needs = new Map<EstimateResourceId, number>()
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
        needs.set(need.id, (needs.get(need.id) ?? 0) + need.count)
        // A pinned location is the player's own pick, kept whatever its tier.
        const eliteOnly = !pins && eliteOnlyRarity(rarityOf(need.id))
        for (const node of collectFarmNodes(upgrade, battlesById, pins)) {
          const rate = farmRate(eliteOnly, battlesById.get(node.battleId))
          if (rate === "unknown") continue
          const lowRate = rate === "low"
          const existing = nodes.get(node.battleId)
          if (!existing) {
            nodes.set(node.battleId, {
              priority: goal.priority,
              goalIds: [goal.goalId],
              resourceId: need.id,
              ...(lowRate ? { lowRate: true as const } : {}),
            })
          } else if (!existing.goalIds.includes(goal.goalId)) {
            existing.goalIds.push(goal.goalId)
          }
        }
      }
    }
  }
  for (const node of nodes.values()) node.need = needs.get(node.resourceId)
  return nodes
}
