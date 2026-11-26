import { deriveGuildWarPhases } from "./events-calendar-calc"
import type {
  RawEventDefinition,
  RawEventsCalendarEntry,
} from "./events-calendar.types"

/** The calendar's definition id for a Guild War season; its occurrence names the season number. */
export const GUILD_WAR_DEFINITION_ID = "guild-war-season"

/** One phase of one war of a Guild War season: preparation (defenses are set) or war (attacks are
 *  made). */
export interface GuildWarPhase {
  phase: "preparation" | "war"
  /** 1 for a season's first war. */
  war: number
  /** The season number players know (29), when the calendar names it. */
  season: number | null
  startMs: number
  endMs: number
}

type SeasonEntry = Pick<
  RawEventsCalendarEntry,
  "definitionId" | "startUtc" | "endUtc"
> & { parameters?: Readonly<Record<string, unknown>> | null }

/**
 * The Guild War phase running at `nowMs` and the next one to start, across the calendar's Guild
 * War seasons split into wars by the season definition (as the events calendar splits them; an
 * entry repeated in the calendar counts once). Null where there is none, or without a definition.
 */
export function guildWarLiveAndNext(
  entries: readonly SeasonEntry[],
  definition: RawEventDefinition | undefined,
  nowMs: number
): { live: GuildWarPhase | null; next: GuildWarPhase | null } {
  const seasons = new Map<string, SeasonEntry>()
  for (const entry of entries) {
    if (entry.definitionId === GUILD_WAR_DEFINITION_ID) {
      seasons.set(entry.startUtc, entry)
    }
  }
  const phases = [...seasons.values()]
    .flatMap((entry) => {
      const number = entry.parameters?.season
      const season = typeof number === "number" ? number : null
      return deriveGuildWarPhases(entry, definition).map(
        (phase): GuildWarPhase => ({
          phase: phase.kind,
          war: phase.war,
          season,
          startMs: Date.parse(phase.startUtc),
          endMs: Date.parse(phase.endUtc),
        })
      )
    })
    .toSorted((a, b) => a.startMs - b.startMs)
  return {
    live:
      phases.find((phase) => phase.startMs <= nowMs && nowMs < phase.endMs) ??
      null,
    next: phases.find((phase) => phase.startMs > nowMs) ?? null,
  }
}
