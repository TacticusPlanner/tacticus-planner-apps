import type { EventsCalendarStorageModel } from "@workspace/game-catalog"

/** The calendar's Guild War season event, whose occurrences name their number and the season
 *  config they run. */
const GUILD_WAR_SEASON_DEFINITION = "guild-war-season"
const SEASON_CONFIG_PARAMETER = "seasonConfigId"
const SEASON_NUMBER_PARAMETER = "season"

type CalendarRow = Pick<
  EventsCalendarStorageModel,
  "definitionId" | "startUtc" | "endUtc" | "parameters"
>

interface CalendarSeason {
  configId: string
  number: number | undefined
  startMs: number
  endMs: number
}

function calendarSeasons(rows: readonly CalendarRow[]): CalendarSeason[] {
  return rows.flatMap((row) => {
    if (row.definitionId !== GUILD_WAR_SEASON_DEFINITION) return []
    const configId = row.parameters?.[SEASON_CONFIG_PARAMETER]
    const number = row.parameters?.[SEASON_NUMBER_PARAMETER]
    return typeof configId === "string"
      ? [
          {
            configId,
            number: typeof number === "number" ? number : undefined,
            startMs: Date.parse(row.startUtc),
            endMs: Date.parse(row.endUtc),
          },
        ]
      : []
  })
}

/** The season that counts at a time: the one running, else the next to start (between seasons
 *  the coming one is what players prepare for), else the last one. */
function seasonAt(
  seasons: readonly CalendarSeason[],
  atMs: number
): CalendarSeason | undefined {
  const running = seasons.find(
    (season) => season.startMs <= atMs && atMs < season.endMs
  )
  if (running) return running
  const upcoming = seasons
    .filter((season) => season.startMs > atMs)
    .toSorted((a, b) => a.startMs - b.startMs)
  const past = seasons.toSorted((a, b) => b.startMs - a.startMs)
  return upcoming[0] ?? past[0]
}

/**
 * The season config the calendar says counts at `nowMs` (running, else next, else last). Only
 * occurrences naming a served config count; undefined when none does.
 */
export function calendarSeasonId(
  rows: readonly CalendarRow[],
  servedIds: ReadonlySet<string>,
  nowMs: number
): string | undefined {
  return seasonAt(
    calendarSeasons(rows).filter((season) => servedIds.has(season.configId)),
    nowMs
  )?.configId
}

/**
 * The season number players know (28, 29 …) of a war in `seasonId` at `atMs`: of the calendar
 * seasons running that config, the one that counts at that time. Undefined when the calendar
 * names none.
 */
export function calendarSeasonNumber(
  rows: readonly CalendarRow[],
  seasonId: string,
  atMs: number
): number | undefined {
  return seasonAt(
    calendarSeasons(rows).filter((season) => season.configId === seasonId),
    atMs
  )?.number
}
