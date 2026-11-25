import { apiIssue } from "@/shared/api"

import { GUILD_WAR_ATTACK_RULES, guildWarIssues } from "./types"
import type { GuildWar, GuildWarAttackRule } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

/** Whether a 409's `current` is a whole war, so the cache can take it as one. */
function isGuildWar(value: unknown): value is GuildWar {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.revision === "number" &&
    typeof value.seasonId === "string" &&
    typeof value.battlefieldLevel === "number" &&
    typeof value.tokensUsed === "number" &&
    Array.isArray(value.deployedUnitIds) &&
    Array.isArray(value.attacks)
  )
}

/** The war as it stands when a settings or attack save was stale, else null. */
export function staleGuildWar(error: unknown): GuildWar | null {
  const current = apiIssue(
    error,
    guildWarIssues.revisionStale,
    guildWarIssues.attackRevisionStale
  )?.current
  return isGuildWar(current) ? current : null
}

/** Whether an attack was refused because there is no current war. */
export function isGuildWarNotStarted(error: unknown): boolean {
  return apiIssue(error, guildWarIssues.notStarted) !== null
}

/** The rule a refused attack broke, else null. */
export function guildWarAttackRule(error: unknown): GuildWarAttackRule | null {
  const code = apiIssue(error, ...GUILD_WAR_ATTACK_RULES)?.issueCode
  return GUILD_WAR_ATTACK_RULES.find((rule) => rule === code) ?? null
}
