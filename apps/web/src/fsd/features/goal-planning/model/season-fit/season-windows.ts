import type {
  EventDefinitionStorageModel,
  EventsCalendarStorageModel,
} from "@workspace/game-catalog"

const DAY_MS = 86_400_000
/** Boundaries past the current deadline that a fit offset can reach: "In 2 seasons" needs the third. */
const BOUNDARY_COUNT = 3

/** The season types Season fit can measure against, keyed as the select stores them. */
export const SEASON_FIT_DEFINITION_TYPES = {
  battlePass: "BattlePass",
  guildRaid: "GuildRaidSeason",
  guildWar: "GuildWarSeason",
} as const

export type SeasonFitSeason = keyof typeof SEASON_FIT_DEFINITION_TYPES

type DefinitionInput = Pick<
  EventDefinitionStorageModel,
  "id" | "recurrence" | "config"
>
type OccurrenceInput = Pick<
  EventsCalendarStorageModel,
  "definitionId" | "occurrenceId" | "startUtc" | "endUtc" | "parameters"
>

/**
 * One season type resolved around "now" (goal-season-fit spec): the current season's number when the
 * catalog carries one, and the boundaries a finish instant is counted against - `boundariesMs[0]` is
 * the current season's deadline, the rest are the following cycle starts.
 */
export type SeasonWindows = {
  seasonNumber: number | undefined
  boundariesMs: number[]
}

function numberField(value: unknown, key: string): number | undefined {
  if (!value || typeof value !== "object" || !(key in value)) return undefined
  const field = (value as Record<string, unknown>)[key]
  return typeof field === "number" && Number.isFinite(field) ? field : undefined
}

/** Authored occurrences of one definition, once each (calendar rows repeat per spanned date). */
function authoredOccurrences(
  definitionId: string,
  occurrences: readonly OccurrenceInput[]
): OccurrenceInput[] {
  const byStart = new Map<string, OccurrenceInput>()
  for (const occurrence of occurrences) {
    if (
      occurrence.definitionId !== definitionId ||
      occurrence.occurrenceId === null
    )
      continue
    byStart.set(occurrence.startUtc, occurrence)
  }
  return [...byStart.values()].sort(
    (a, b) => Date.parse(a.startUtc) - Date.parse(b.startUtc)
  )
}

/** A `Fixed` definition's cycle starts from its anchor, with each authored start replacing the
 *  projected start of the slot it falls in (within half an interval). */
function resolveFixed(
  definition: DefinitionInput,
  authored: OccurrenceInput[],
  nowMs: number
): SeasonWindows | null {
  const { intervalDays, anchorUtc } = definition.recurrence
  if (!intervalDays || !anchorUtc) return null
  const anchorMs = Date.parse(anchorUtc)
  if (!Number.isFinite(anchorMs)) return null
  const intervalMs = intervalDays * DAY_MS

  const overrides = new Map<number, OccurrenceInput>()
  for (const occurrence of authored) {
    const startMs = Date.parse(occurrence.startUtc)
    const slot = Math.round((startMs - anchorMs) / intervalMs)
    if (Math.abs(startMs - (anchorMs + slot * intervalMs)) <= intervalMs / 2) {
      overrides.set(slot, occurrence)
    }
  }
  const startOf = (slot: number) => {
    const occurrence = overrides.get(slot)
    return occurrence
      ? Date.parse(occurrence.startUtc)
      : anchorMs + slot * intervalMs
  }

  let current = Math.floor((nowMs - anchorMs) / intervalMs)
  if (startOf(current) > nowMs) current -= 1
  else if (startOf(current + 1) <= nowMs) current += 1

  const authoredNumber = numberField(
    overrides.get(current)?.parameters,
    "season"
  )
  const anchorNumber = numberField(definition.config, "seasonNumberAtAnchor")
  return {
    seasonNumber:
      authoredNumber ??
      (anchorNumber === undefined ? undefined : anchorNumber + current),
    boundariesMs: Array.from({ length: BOUNDARY_COUNT }, (_, index) =>
      startOf(current + index + 1)
    ),
  }
}

/** A non-recurring definition: authored occurrences only, starting from the one covering now. */
function resolveAuthored(
  authored: OccurrenceInput[],
  nowMs: number
): SeasonWindows | null {
  const current = authored.find(
    (occurrence) =>
      Date.parse(occurrence.startUtc) <= nowMs &&
      Date.parse(occurrence.endUtc) > nowMs
  )
  if (!current) return null
  const currentStartMs = Date.parse(current.startUtc)
  const laterStarts = authored
    .map((occurrence) => Date.parse(occurrence.startUtc))
    .filter((startMs) => startMs > currentStartMs)
  return {
    seasonNumber: numberField(current.parameters, "season"),
    boundariesMs: [Date.parse(current.endUtc), ...laterStarts].slice(
      0,
      BOUNDARY_COUNT
    ),
  }
}

/**
 * Resolves one season type's windows around `nowMs` from the catalog (goal-season-fit spec: "Season
 * windows come from the events catalog"), or null when the catalog gives no current season - the
 * select then disables that mode.
 */
export function resolveSeasonWindows(
  definition: DefinitionInput | undefined,
  occurrences: readonly OccurrenceInput[],
  nowMs: number
): SeasonWindows | null {
  if (!definition) return null
  const authored = authoredOccurrences(definition.id, occurrences)
  return definition.recurrence.kind === "Fixed"
    ? resolveFixed(definition, authored, nowMs)
    : resolveAuthored(authored, nowMs)
}
