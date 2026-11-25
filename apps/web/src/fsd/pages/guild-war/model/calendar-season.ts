import type { EventsCalendarStorageModel } from "@workspace/game-catalog"

/** The calendar's Guild War season event, whose occurrences name the season config they run. */
const GUILD_WAR_SEASON_DEFINITION = "guild-war-season"
const SEASON_CONFIG_PARAMETER = "seasonConfigId"

type CalendarRow = Pick<
  EventsCalendarStorageModel,
  "definitionId" | "startUtc" | "parameters"
>

/**
 * The season config the calendar says is running: that of the latest Guild War season started by
 * `nowMs`, else of the next one to start. Only occurrences naming a served config count; undefined
 * when none does.
 */
export function calendarSeasonId(
  rows: readonly CalendarRow[],
  servedIds: ReadonlySet<string>,
  nowMs: number
): string | undefined {
  const named = rows.flatMap((row) => {
    if (row.definitionId !== GUILD_WAR_SEASON_DEFINITION) return []
    const id = row.parameters?.[SEASON_CONFIG_PARAMETER]
    return typeof id === "string" && servedIds.has(id)
      ? [{ id, startMs: Date.parse(row.startUtc) }]
      : []
  })
  const started = named
    .filter((entry) => entry.startMs <= nowMs)
    .toSorted((a, b) => b.startMs - a.startMs)
  const upcoming = named
    .filter((entry) => entry.startMs > nowMs)
    .toSorted((a, b) => a.startMs - b.startMs)
  return (started[0] ?? upcoming[0])?.id
}
