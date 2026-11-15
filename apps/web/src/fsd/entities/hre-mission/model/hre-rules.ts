import type {
  HreStorageModel,
  ProgressionRulesStorageModel,
} from "@workspace/game-catalog"

import type { HreMission, HreObjective, HreObjectiveKind } from "./hre-missions"
import { HRE_RARITY_STEP_IDS, type HreRarityStepId } from "./hre-reward-tables"

/** A leaderboard bracket by its last position, with the daily currency payout and the week 1 and
 *  week 2 crates' currency and shards. */
export type HreBracket = {
  upTo: number
  daily: number
  week1: { currency: number; shards: number }
  week2: { currency: number; shards: number }
}

export type HreStep = {
  id: HreRarityStepId
  /** Cumulative event shards from a Common unlock. */
  shards: number
  unlockFor?: "Common" | "Uncommon" | "Rare"
}

/** The served reward rules the pace projects with. */
export type HreRewardRules = {
  /** Event points threshold → cumulative event currency from milestones. */
  milestones: readonly { points: number; cumulative: number }[]
  brackets: readonly HreBracket[]
  /** Chest tiers in order: currency cost and the minimum shards inside. */
  chests: readonly { cost: number; shards: number }[]
  /** The currency the paid missions give in all, and how many there are. */
  missionCurrency: number
  paidMissions: number
  steps: readonly HreStep[]
}

/** One Hero Release Event's served missions and reward rules. */
export type HreRules = {
  missions: readonly HreMission[]
  rewards: HreRewardRules
}

type HreTask = HreStorageModel["missions"][number]["tasks"][number]

/** The game modes "play battles in" tasks name, by the objective kind each counts toward. */
const GAME_MODE_KINDS: Readonly<Record<string, HreObjectiveKind>> = {
  PvP: "arenaBattles",
  GuildBoss: "guildRaids",
  Waves: "onslaught",
  TreasureBeach: "salvageRuns",
}

/** The objective kind of each game task name (the "play battles in" task goes by its game mode). */
const TASK_KINDS: Readonly<Record<string, HreObjectiveKind>> = {
  WinCampaignBattles: "campaignWins",
  RaidBattles: "campaignRaids",
  WinLightningVictories: "lightningVictories",
  SlayEnemies: "killEnemies",
  SlayEnemiesWithMeleeAttacks: "killWithMelee",
  SlayEnemiesWithRangedAttacks: "killWithRanged",
  SlayEnemiesWithFactionTrait: "killWithAlliance",
  SlayEnemiesOfFaction: "killFaction",
  DealDamage: "damage",
  DealAbilityDamage: "abilityDamage",
  DealDamageOfProfileType: "damageType",
  DealDamageWithHero: "featuredDamage",
  UseAbility: "useAbilities",
  UseAbilityWithFactionTrait: "useAbilitiesAlliance",
  UseAbilityWithHero: "useAbilitiesFeatured",
  HealHealth: "heal",
  WinBattlesWithoutUsingSummons: "winWithoutSummons",
  WinBattlesWithFactionTraitLineup: "winWithAllianceLineup",
}

/** A game task as a mission objective, or undefined for a task the tracker does not know. The
 *  alliance and the featured hero are read at render time, so only a faction or damage type is kept. */
function toObjective(task: HreTask): HreObjective | undefined {
  const kind =
    task.name === "PlayBattlesInGameMode"
      ? GAME_MODE_KINDS[task.parameters.gameMode ?? ""]
      : TASK_KINDS[task.name]
  if (!kind) return undefined
  const qualifier =
    kind === "killFaction"
      ? task.parameters.factionId
      : kind === "damageType"
        ? task.parameters.damageProfileType
        : undefined
  return qualifier
    ? { kind, target: task.target, qualifier }
    : { kind, target: task.target }
}

function toMissions(
  record: Pick<HreStorageModel, "missions">
): HreMission[] | undefined {
  const missions: HreMission[] = []
  for (const [index, mission] of record.missions.entries()) {
    const [first, second] = mission.tasks.map(toObjective)
    if (!first || !second) return undefined
    missions.push({
      number: index + 1,
      bonus: mission.bonus,
      currency: mission.currency,
      objectives: [first, second],
    })
  }
  return missions.length > 0 ? missions : undefined
}

/** The leaderboard's brackets: each position bracket runs from its start (0 is first place) to the
 *  next one's, with that bracket's daily currency and the two phases' crates. */
function toBrackets(
  leaderboard: HreStorageModel["leaderboard"]
): HreBracket[] | undefined {
  const [week1, week2] = leaderboard.phases
  if (!week1 || !week2) return undefined
  const brackets: HreBracket[] = []
  for (const [index, reward] of leaderboard.dailyRewards.entries()) {
    const crate1 = week1.tiers.find((tier) => tier.position === reward.position)
    const crate2 = week2.tiers.find((tier) => tier.position === reward.position)
    if (!crate1 || !crate2) return undefined
    brackets.push({
      upTo: leaderboard.dailyRewards[index + 1]?.position ?? Infinity,
      daily: reward.currency,
      week1: { currency: crate1.currency, shards: crate1.shards },
      week2: { currency: crate2.currency, shards: crate2.shards },
    })
  }
  return brackets.length > 0 ? brackets : undefined
}

/** The pace's rarity steps with their cumulative event shards from a Common unlock. */
function toSteps(
  heroSteps: ProgressionRulesStorageModel["heroProgressionSteps"]
): HreStep[] | undefined {
  const shardsByProgression = new Map(
    heroSteps.map((step) => [step.progression as string, step.hreShards])
  )
  let shards = 0
  const steps: HreStep[] = []
  for (const { progression, ...step } of HRE_RARITY_STEP_IDS) {
    const stepShards = shardsByProgression.get(progression)
    if (stepShards == null) return undefined
    shards += stepShards
    steps.push({ ...step, shards })
  }
  return steps
}

/** The record of the event featuring `heroId`; else the latest event, since every Hero Release Event
 *  shares one mission chain and reward ladder (Severyn, 2026-10). */
function recordFor(
  records: readonly HreStorageModel[],
  heroId: string | null
): HreStorageModel | undefined {
  return records.find((record) => record.heroId === heroId) ?? records.at(-1)
}

/** The served rules of the event featuring `heroId`, or undefined when the served data lacks a
 *  part the tracker needs (an unknown task, a missing phase, a missing step). */
export function toHreRules(
  records: readonly HreStorageModel[],
  progression: readonly Pick<
    ProgressionRulesStorageModel,
    "heroProgressionSteps"
  >[],
  heroId: string | null
): HreRules | undefined {
  const record = recordFor(records, heroId)
  const heroSteps = progression[0]?.heroProgressionSteps
  if (!record || !heroSteps) return undefined
  const missions = toMissions(record)
  const brackets = toBrackets(record.leaderboard)
  const steps = toSteps(heroSteps)
  if (!missions || !brackets || !steps) return undefined
  let cumulative = 0
  const milestones = record.milestones.map((milestone) => {
    cumulative += milestone.currency
    return { points: milestone.scorePoints, cumulative }
  })
  const paid = missions.filter((mission) => mission.currency > 0)
  return {
    missions,
    rewards: {
      milestones,
      brackets,
      chests: record.chestShop.map((chest) => ({
        cost: chest.cost,
        shards: chest.minShards,
      })),
      missionCurrency: paid.reduce((sum, mission) => sum + mission.currency, 0),
      paidMissions: paid.length,
      steps,
    },
  }
}
