import { apiIssue } from "@/shared/api"

import { GUILD_WAR_ATTACK_RULES, guildWarIssues } from "./types"
import type { GuildWar, GuildWarAttack, GuildWarAttackRule } from "./types"

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

/** Whether a settings save was refused because the war's season is locked by its attacks. */
export function isGuildWarSeasonLocked(error: unknown): boolean {
  return apiIssue(error, guildWarIssues.hasAttacks) !== null
}

/** Whether an attack was refused because there is no current war. */
export function isGuildWarNotStarted(error: unknown): boolean {
  return apiIssue(error, guildWarIssues.notStarted) !== null
}

/** The rule a refused attack broke, else null. */
function guildWarAttackRule(error: unknown): GuildWarAttackRule | null {
  const code = apiIssue(error, ...GUILD_WAR_ATTACK_RULES)?.issueCode
  return GUILD_WAR_ATTACK_RULES.find((rule) => rule === code) ?? null
}

/** Why an attack save failed, as a `log.errors` key: the war changed meanwhile, the rule it
 *  broke, or anything else. */
export function attackSaveError(
  error: unknown
): "stale" | GuildWarAttackRule | "failed" {
  if (staleGuildWar(error)) return "stale"
  return guildWarAttackRule(error) ?? "failed"
}

/** The attack as it now stands when an edit was stale, so saving again replaces it; undefined when
 *  the save was not stale or the attack is gone. */
export function freshAttack(
  error: unknown,
  attackId: string
): GuildWarAttack | undefined {
  return staleGuildWar(error)?.attacks.find((attack) => attack.id === attackId)
}
