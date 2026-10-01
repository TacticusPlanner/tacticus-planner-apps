import type { CampaignDescriptor } from "@workspace/game-catalog"
import type {
  BattleId,
  Rank,
  Rarity,
  UnitId,
  UpgradeId,
} from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"
import type {
  EstimateBlocker,
  FilteredOutNeed,
  RaidDaySchedule,
  RaidPlanSummary,
} from "@/features/goal-farming/@x/daily-raids"

import type { TodaysAttempt } from "./daily-raids-energy"
import type { EventFarm } from "./home-screen-event-farm"

export type DailyRaidGoalViewModel = {
  goalId: string
  priority: number
  unitId: UnitId
  unitType: "Character" | "Mow"
  unitLabel: string
  targetLabel: string
  goalKind: GoalKind
  // Only set when goalKind === "Rank" — the raw target rank, for icon-only rendering.
  targetRank?: Rank
}

export type DailyRaidResourceVisual =
  | {
      kind: "upgrade"
      id: UpgradeId
      rarity: Rarity
      crafted: boolean
    }
  | { kind: "shard"; unitId: UnitId }

/** What a single campaign node drops, as Today's Attempts renders it (icon + tooltip text). */
export type DailyRaidBattleResource = {
  label: string
  visual: DailyRaidResourceVisual
}

/** A goal in the plan with at least one requirement that has no supported source. `partial` means
 *  its obtainable work is still scheduled; either way it has no completion date. */
export type DailyRaidBlockedGoal = {
  goalId: string
  blockers: EstimateBlocker[]
  partial: boolean
}

export type DailyRaidResourceProgress = {
  owned: number
  target: number
}

export type DailyRaidResourceUrgency = {
  days: number
  energyTotal: number
}

export type DailyRaidLocationViewModel = {
  id: string
  // The campaign's own display name (e.g. "Indomitus"), with no tier/difficulty/mirror qualifier —
  // the first line of the location-primary Today/Bonus/Home rendering. Falls back to the raw battle
  // id when the catalog has no descriptor for the battle.
  campaignName: string
  // Tier words + node number + a challenge node's "B" (e.g. "Elite 40", "Extremis 12B") — the
  // second line of that same rendering. Empty when the catalog has no descriptor, in which case
  // renderers omit the line entirely rather than inventing one.
  nodeLabel: string
  // Compact "{name} {code} {node}{B?}" form Raids Plan's chips still use verbatim.
  shortLabel: string
  challenge: boolean
  icon?: string
}

/**
 * The two lines a location renders as: the campaign's own name, then its tier words + node number
 * (+ "B" for a challenge node). A battle the catalog has no descriptor for keeps its raw id on the
 * first line and gets no second line — a node number with no tier word identifies nothing.
 */
export function campaignLocationLabels(
  battleId: BattleId,
  battle: { nodeNumber: number; challenge: boolean },
  descriptor: CampaignDescriptor | undefined,
  display: {
    name: (descriptor: CampaignDescriptor) => string
    tierLabel: (descriptor: CampaignDescriptor) => string
  }
): Pick<DailyRaidLocationViewModel, "campaignName" | "nodeLabel"> {
  if (!descriptor) return { campaignName: battleId, nodeLabel: "" }
  return {
    campaignName: display.name(descriptor),
    nodeLabel: `${display.tierLabel(descriptor)} ${battle.nodeNumber}${
      battle.challenge ? "B" : ""
    }`,
  }
}

export function dailyRaidResourceKey(goalId: string, resourceId: string) {
  return `${goalId}:${resourceId}`
}

/** Display label for a character's shard resource — shared so a node resolved from the plan and the
 *  same node resolved from the catalog (see `buildResourceByBattle`) never read differently. */
export function shardResourceLabel(characterName: string) {
  return `${characterName} shards`
}

/**
 * Optional display-text hooks for a farmable resource, so this model layer keeps taking catalog
 * records rather than a `t` (tests and any non-React caller can omit them and get the catalog's own
 * English). `use-daily-raids` supplies one implementation to both the plan path (`calculateDailyRaids`)
 * and the catalog path (`buildResourceByBattle`) — passing it to only one would reintroduce exactly
 * the split `shardResourceLabel` exists to prevent.
 *
 * `catalogLabel`/`characterName` are the catalog's own strings, passed through as the `defaultValue`
 * for the id-keyed `upgrades`/`characters` namespaces.
 */
export type DailyRaidResourceLabels = {
  upgrade?: (id: UpgradeId, catalogLabel: string) => string
  shards?: (unitId: UnitId, characterName: string) => string
}

export type DailyRaidsReadyViewModel = {
  status: "ready"
  today: RaidDaySchedule
  bonus: RaidDaySchedule
  planDays: RaidDaySchedule[]
  planSummary: RaidPlanSummary
  /** Goals whose plan outcome is Blocked, in priority order — same result the schedule came from. */
  blockedGoals: DailyRaidBlockedGoal[]
  /** Needs the applied Raids Filters left with no allowed node in Today's run. Today only: the Plan
   *  and `blockedGoals` are unfiltered and never carry these. */
  filteredOut: FilteredOutNeed[]
  dailyEnergy: number
  goalsById: ReadonlyMap<string, DailyRaidGoalViewModel>
  resourceLabels: ReadonlyMap<string, string>
  resourceVisuals: ReadonlyMap<string, DailyRaidResourceVisual>
  resourceUrgencyByGoalAndResource: ReadonlyMap<
    string,
    DailyRaidResourceUrgency
  >
  /** Have/need per resource over every goal in the run: total target and what the player holds. */
  resourceTotals: ReadonlyMap<string, DailyRaidResourceProgress>
  resourceProgressByDay: ReadonlyMap<
    number,
    ReadonlyMap<string, DailyRaidResourceProgress>
  >
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
  // What every raidable node drops, straight from the catalog and independent of this project's
  // plan — Today's Attempts is account-wide, so it needs an icon for nodes the plan never mentions.
  resourceByBattleId: ReadonlyMap<BattleId, DailyRaidBattleResource>
  attemptsUsedByBattle: ReadonlyMap<BattleId, number>
  // Real, account-wide energy spent today per synced attempts at standing (non-event) campaign
  // nodes — independent of this project's simulated plan, and NOT capped at `dailyEnergy`.
  realEnergyUsedToday: number
  // Real, per-node attempts remaining today for standing (non-event) campaign nodes, keyed by
  // BattleId — the ground truth for de-duping an exhausted location out of Today's/Bonus's normal
  // schedule listing (attemptsLeft === 0), independent of the simulated plan's own attempt counters.
  attemptsLeftByBattle: ReadonlyMap<BattleId, number>
  // Every standing-campaign node actually raided today, account-wide — backs the "Today's
  // Attempts" section (not scoped to this project's schedule).
  todaysAttempts: TodaysAttempt[]
  /** The Dailies > HSE farm list; set only when the run was given the event inputs. */
  eventFarm?: EventFarm
}

export type DailyRaidsCalculationViewModel = Omit<
  DailyRaidsReadyViewModel,
  | "locationsByBattleId"
  | "resourceByBattleId"
  | "realEnergyUsedToday"
  | "attemptsLeftByBattle"
  | "todaysAttempts"
>

export type DailyRaidsViewModel =
  | { status: "no-goals" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "no-farmable" }
  | DailyRaidsReadyViewModel
