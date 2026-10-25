/** What the Quest selection reads of a calendar entry (`EventsCalendarStorageModel` satisfies it). */
export type QuestCalendarEntry = {
  occurrenceId?: string | null
  definitionId: string
  startUtc: string
  endUtc: string
  parameters?: Record<string, unknown> | null
}

/** What the selection reads of an event definition. */
export type QuestDefinition = { type: string; config?: unknown }

type QuestPhase = "running" | "claim" | "preview"

export type QuestInstance<
  TEntry extends QuestCalendarEntry = QuestCalendarEntry,
> = {
  /** The storage key of the instance: the occurrence id, else `definitionId@startUtc`. */
  key: string
  entry: TEntry
  phase: QuestPhase
  /** The occurrence's `featuredCharacterId`, or null when it has none. */
  featuredCharacterId: string | null
  /** When the claim window closes (end plus the definition's `rewardsClaimWindowHours`). */
  claimEndMs: number
}

const QUEST_DEFINITION_TYPE = "Quest"
const HOUR_MS = 3_600_000
/** The claim window when a definition does not state one (the shipped `quest` definition says 24). */
const DEFAULT_CLAIM_WINDOW_HOURS = 24

const compareIds = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

const instanceKey = (entry: QuestCalendarEntry) =>
  entry.occurrenceId ?? `${entry.definitionId}@${entry.startUtc}`

/** The definition's `config.rewardsClaimWindowHours`, so a config change needs no code. */
function claimWindowHours(definition: QuestDefinition | undefined) {
  const config = definition?.config
  const hours =
    typeof config === "object" && config !== null
      ? (config as Record<string, unknown>).rewardsClaimWindowHours
      : undefined
  return typeof hours === "number" && Number.isFinite(hours) && hours >= 0
    ? hours
    : DEFAULT_CLAIM_WINDOW_HOURS
}

/** Latest start first, then the lowest occurrence key. */
const latestFirst = (a: QuestCalendarEntry, b: QuestCalendarEntry) =>
  Date.parse(b.startUtc) - Date.parse(a.startUtc) ||
  compareIds(instanceKey(a), instanceKey(b))

/**
 * The quest the tab shows (UTC, start inclusive, end exclusive): the running one, else the one in
 * its claim window, else the next upcoming one as a preview, else none. Several candidates at one
 * step resolve to the latest start, then the lowest occurrence key (the next upcoming: the earliest).
 */
export function selectQuestInstance<TEntry extends QuestCalendarEntry>(
  entries: readonly TEntry[],
  definitionsById: ReadonlyMap<string, QuestDefinition>,
  nowMs: number
): QuestInstance<TEntry> | null {
  const quests = entries.filter(
    (entry) =>
      definitionsById.get(entry.definitionId)?.type === QUEST_DEFINITION_TYPE
  )
  const claimEnd = (entry: TEntry) =>
    Date.parse(entry.endUtc) +
    claimWindowHours(definitionsById.get(entry.definitionId)) * HOUR_MS
  const toInstance = (
    entry: TEntry,
    phase: QuestPhase
  ): QuestInstance<TEntry> => {
    const featured = entry.parameters?.featuredCharacterId
    return {
      key: instanceKey(entry),
      entry,
      phase,
      featuredCharacterId: typeof featured === "string" ? featured : null,
      claimEndMs: claimEnd(entry),
    }
  }

  const running = quests
    .filter(
      (entry) =>
        Date.parse(entry.startUtc) <= nowMs && nowMs < Date.parse(entry.endUtc)
    )
    .sort(latestFirst)[0]
  if (running) return toInstance(running, "running")
  const claim = quests
    .filter(
      (entry) => Date.parse(entry.endUtc) <= nowMs && nowMs < claimEnd(entry)
    )
    .sort(latestFirst)[0]
  if (claim) return toInstance(claim, "claim")
  const next = quests
    .filter((entry) => Date.parse(entry.startUtc) > nowMs)
    .sort(
      (a, b) =>
        Date.parse(a.startUtc) - Date.parse(b.startUtc) ||
        compareIds(instanceKey(a), instanceKey(b))
    )[0]
  return next ? toInstance(next, "preview") : null
}
