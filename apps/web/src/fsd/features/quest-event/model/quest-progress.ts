import { TOKEN_BANK, type QuestTokens } from "./quest-token-plan"
import {
  MAX_LIGHTNING_POINTS,
  MAX_MEDALS,
  type QuestBattleEntry,
} from "./quest-score"

/** The player's own record of one quest occurrence, kept in this browser only (design D4). */
export type QuestProgress = {
  /** Best attempt per battle number. */
  battles: Record<number, QuestBattleEntry>
  /** Whether the player bought the Quest Bundle (triples the medal shards); off by default. */
  bundle?: boolean
  /** The player's last "tokens now" entry, with when it was made. */
  tokens?: QuestTokens
}

export const EMPTY_QUEST_PROGRESS: QuestProgress = { battles: {} }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const clampWhole = (value: unknown, max: number): number | null =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(Math.round(value), 0), max)
    : null

/** One stored battle entry, clamped (medals 0..3, lightning 0..100), or null when invalid. */
export function parseBattleEntry(value: unknown): QuestBattleEntry | null {
  if (!isRecord(value)) return null
  const medals = clampWhole(value.medals, MAX_MEDALS)
  const lightning = clampWhole(value.lightning, MAX_LIGHTNING_POINTS)
  if (medals === null || lightning === null) return null
  if (!Array.isArray(value.objectives)) return null
  return {
    medals,
    lightning,
    objectives: value.objectives.map((tick) => tick === true),
  }
}

/** One stored occurrence entry; invalid battle entries are dropped. Null when not a record. */
export function parseQuestProgress(value: unknown): QuestProgress | null {
  if (!isRecord(value)) return null
  const battles: Record<number, QuestBattleEntry> = {}
  if (isRecord(value.battles)) {
    for (const [number, entry] of Object.entries(value.battles)) {
      const parsed = parseBattleEntry(entry)
      const battleNumber = Number(number)
      if (parsed && Number.isInteger(battleNumber) && battleNumber > 0) {
        battles[battleNumber] = parsed
      }
    }
  }
  const progress: QuestProgress = { battles }
  if (value.bundle === true) progress.bundle = true
  const tokens = parseTokens(value.tokens)
  if (tokens) progress.tokens = tokens
  return progress
}

function parseTokens(value: unknown): QuestTokens | null {
  if (!isRecord(value)) return null
  const count = clampWhole(value.count, TOKEN_BANK)
  if (count === null || typeof value.atUtc !== "string") return null
  if (Number.isNaN(Date.parse(value.atUtc))) return null
  return { count, atUtc: value.atUtc }
}

/** An entry's ticks padded with `false` or cut to the battle's served objective count, so a data
 *  refresh that changes the count never shifts or overflows the stored ticks. */
export function fitObjectives(
  entry: QuestBattleEntry,
  objectiveCount: number
): QuestBattleEntry {
  if (entry.objectives.length === objectiveCount) return entry
  return {
    ...entry,
    objectives: Array.from(
      { length: objectiveCount },
      (_, index) => entry.objectives[index] === true
    ),
  }
}
