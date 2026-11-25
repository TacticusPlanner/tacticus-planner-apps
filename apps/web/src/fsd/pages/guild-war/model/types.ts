import type { ApiSchemas as S } from "@/shared/api"

/** A war as the API serves it: its season, level, attacks (oldest first) and derived usage. */
export type GuildWar = S["GuildWarResponse"]

/** One logged attack: zone, slot, the rarity cap it was logged at, lineup, result and enemy. */
export type GuildWarAttack = S["GuildWarAttackResponse"]

/** A lineup unit as it stood when the attack was logged. */
export type GuildWarLineupUnit = S["GuildWarLineupUnitDto"]

/** The optional enemy details of an attack. */
export type GuildWarEnemy = S["GuildWarEnemyDto"]
export type GuildWarEnemyUnit = S["GuildWarEnemyUnitDto"]
export type GuildWarEnemyUnitState = S["GuildWarEnemyUnitState"]
export type GuildWarAttackResult = S["GuildWarAttackResult"]

/** A page of ended wars, newest first, and the cursor of the next (older) page. */
export type PastGuildWars = S["PastGuildWarsResponse"]

/** The fields an attack is logged with; `attackedAt` is left to the server (now). */
export type GuildWarAttackFields = Omit<
  S["CreateGuildWarAttackRequest"],
  "attackedAt"
>

/** The war's season and battlefield level, as Settings and Start new war send them. */
export interface GuildWarSettings {
  seasonId: string
  battlefieldLevel: number
}

/** The issue codes the war endpoints answer with. */
export const guildWarIssues = {
  revisionStale: "guildWarRevisionStale",
  attackRevisionStale: "guildWarAttackRevisionStale",
  notStarted: "guildWarNotStarted",
  unknownSeason: "guildWarUnknownSeason",
  unknownLevel: "guildWarUnknownLevel",
  unknownZone: "guildWarUnknownZone",
  unknownUnit: "guildWarUnknownUnit",
  unitDeployed: "guildWarUnitDeployed",
  tokensSpent: "guildWarTokensSpent",
} as const

/** The rule codes a refused attack names, in the order the API checks them. */
export const GUILD_WAR_ATTACK_RULES = [
  guildWarIssues.unknownZone,
  guildWarIssues.unknownUnit,
  guildWarIssues.unitDeployed,
  guildWarIssues.tokensSpent,
] as const
export type GuildWarAttackRule = (typeof GUILD_WAR_ATTACK_RULES)[number]
