import type { GuildWar, GuildWarAttack } from "./types"

/** Attacks won and lost (an attack without a result counts as neither). */
export function attackResults(attacks: readonly GuildWarAttack[]) {
  return {
    won: attacks.filter((attack) => attack.result === "won").length,
    lost: attacks.filter((attack) => attack.result === "lost").length,
  }
}

/** The tokens a war has left of its season's attempts; never negative. */
export function tokensLeft(war: GuildWar | null, maxAttempts: number) {
  return Math.max(0, maxAttempts - (war?.tokensUsed ?? 0))
}
