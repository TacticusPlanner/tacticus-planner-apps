/** The quest token bank: at most 6, one more every 2 hours while below the cap (wiki). */
export const TOKEN_BANK = 6
const REGEN_MS = 2 * 3_600_000

export type QuestTokens = { count: number; atUtc: string }

export type QuestTokenPlan =
  | { kind: "closed" }
  | { kind: "preview"; attempts: number }
  | {
      kind: "running"
      attempts: number
      /** True without an entry: the plan assumes a full bank now. */
      assumedFull: boolean
      battlesToImprove: number
      /** Attempts minus battles to improve; negative when short. */
      spare: number
      /** When the bank fills from the entry, or null (no entry, or after the quest ends). */
      bankFullMs: number | null
    }

/**
 * Attempts left to the end of the quest against the battles still below their maximum (design D4).
 * The regen timer is taken to restart at the entry, which undercounts by at most one token.
 */
export function questTokenPlan(params: {
  phase: "running" | "claim" | "preview"
  startMs: number
  endMs: number
  nowMs: number
  tokens: QuestTokens | null
  battlesToImprove: number
}): QuestTokenPlan {
  const { phase, startMs, endMs, nowMs, tokens, battlesToImprove } = params
  if (phase === "claim") return { kind: "closed" }
  if (phase === "preview") {
    return {
      kind: "preview",
      attempts: TOKEN_BANK + Math.floor((endMs - startMs) / REGEN_MS),
    }
  }
  const atMs = tokens ? Date.parse(tokens.atUtc) : nowMs
  const count = tokens ? tokens.count : TOKEN_BANK
  const attempts = count + Math.max(0, Math.floor((endMs - atMs) / REGEN_MS))
  const bankFullMs = tokens ? atMs + (TOKEN_BANK - count) * REGEN_MS : null
  return {
    kind: "running",
    attempts,
    assumedFull: !tokens,
    battlesToImprove,
    spare: attempts - battlesToImprove,
    bankFullMs: bankFullMs !== null && bankFullMs < endMs ? bankFullMs : null,
  }
}
