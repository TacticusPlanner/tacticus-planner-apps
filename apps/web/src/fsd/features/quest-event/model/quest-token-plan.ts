import type { QuestEventStorageModel } from "@workspace/game-catalog"

/** The quest's served token bank: at most `max`, `regenAmount` more every `regenSeconds` below it. */
export type QuestTokenBank = Pick<
  QuestEventStorageModel["tokens"],
  "max" | "regenSeconds" | "regenAmount"
>

export type QuestTokens = { count: number; atUtc: string }

export type QuestTokenPlan =
  | { kind: "closed" }
  | { kind: "preview"; attempts: number }
  | {
      kind: "running"
      /** The served bank's capacity, which a "tokens now" entry cannot exceed. */
      bankMax: number
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
  bank: QuestTokenBank
  startMs: number
  endMs: number
  nowMs: number
  tokens: QuestTokens | null
  battlesToImprove: number
}): QuestTokenPlan {
  const { phase, bank, startMs, endMs, nowMs, tokens, battlesToImprove } =
    params
  if (phase === "claim") return { kind: "closed" }
  const regenMs = bank.regenSeconds * 1000
  const regenerated = (fromMs: number) =>
    Math.max(0, Math.floor((endMs - fromMs) / regenMs)) * bank.regenAmount
  if (phase === "preview") {
    return {
      kind: "preview",
      attempts: bank.max + regenerated(startMs),
    }
  }
  const atMs = tokens ? Date.parse(tokens.atUtc) : nowMs
  const count = tokens ? Math.min(tokens.count, bank.max) : bank.max
  const attempts = count + regenerated(atMs)
  const bankFullMs = tokens
    ? atMs + Math.ceil((bank.max - count) / bank.regenAmount) * regenMs
    : null
  return {
    kind: "running",
    bankMax: bank.max,
    attempts,
    assumedFull: !tokens,
    battlesToImprove,
    spare: attempts - battlesToImprove,
    bankFullMs: bankFullMs !== null && bankFullMs < endMs ? bankFullMs : null,
  }
}
