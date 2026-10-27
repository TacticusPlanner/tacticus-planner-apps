import { useMemo, useState } from "react"
import type {
  EventDefinitionStorageModel,
  EventsCalendarStorageModel,
} from "@workspace/game-catalog"

import type { EstimateOutcome } from "@/features/goal-farming/@x/goal-planning"
import { combineReadStates } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"

import type { GoalRow } from "../shared/types"
import {
  computeSeasonFits,
  type GoalSeasonFit,
  type SeasonFitMode,
} from "./season-fit"
import {
  resolveSeasonWindows,
  SEASON_FIT_DEFINITION_TYPES,
  type SeasonFitSeason,
  type SeasonWindows,
} from "./season-windows"

const SEASONS = Object.keys(SEASON_FIT_DEFINITION_TYPES) as SeasonFitSeason[]

/** The measured season while a mode is on and the catalog has its dates. */
export type ActiveSeasonFit = {
  season: SeasonFitSeason
  seasonNumber: number | undefined
  /** The current season's deadline: its end, or for Guild War the next season's start. */
  deadlineMs: number
  fits: ReadonlyMap<string, GoalSeasonFit>
}

export type SeasonFitState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | {
      status: "ready"
      /** Which modes the catalog can measure right now (the select disables the rest). */
      available: Readonly<Record<SeasonFitSeason, boolean>>
      /** Null while Off, or when the chosen mode has no season dates. */
      active: ActiveSeasonFit | null
    }

/** Every season type's windows around `nowMs`; a type the catalog cannot place maps to null. */
function resolveAllSeasonWindows(
  definitions: readonly EventDefinitionStorageModel[],
  occurrences: readonly EventsCalendarStorageModel[],
  nowMs: number
): Record<SeasonFitSeason, SeasonWindows | null> {
  const windows = {} as Record<SeasonFitSeason, SeasonWindows | null>
  for (const season of SEASONS) {
    const definition = definitions.find(
      (candidate) => candidate.type === SEASON_FIT_DEFINITION_TYPES[season]
    )
    windows[season] = resolveSeasonWindows(definition, occurrences, nowMs)
  }
  return windows
}

/**
 * The Goals page's Season fit (goal-season-fit spec): which modes are available and, for the chosen
 * one, each eligible row's fit against the catalog's season windows. `nowMs` is fixed per mount so
 * render stays pure; a season rolling over while the page is open shows on the next visit.
 */
export function useSeasonFit(
  mode: SeasonFitMode,
  rows: readonly GoalRow[],
  estimates: ReadonlyMap<string, EstimateOutcome> | undefined,
  reachedByGoalId: ReadonlyMap<string, boolean> | undefined
): SeasonFitState {
  const [nowMs] = useState(() => Date.now())
  const definitions = useCatalogDataset("event-definitions")
  const calendar = useCatalogDataset("events-calendar")
  const read = useMemo(
    () => combineReadStates(definitions, calendar),
    [definitions, calendar]
  )
  const windows = useMemo(
    () =>
      read.status === "ready"
        ? resolveAllSeasonWindows(read.data[0], read.data[1], nowMs)
        : null,
    [read, nowMs]
  )
  const chosen = mode === "off" || !windows ? null : windows[mode]
  const fits = useMemo(
    () =>
      chosen
        ? computeSeasonFits(rows, estimates, reachedByGoalId, chosen)
        : null,
    [chosen, rows, estimates, reachedByGoalId]
  )

  if (read.status === "error") return { status: "error", retry: read.retry }
  if (!windows) return { status: "loading" }
  return {
    status: "ready",
    available: {
      battlePass: windows.battlePass !== null,
      guildRaid: windows.guildRaid !== null,
      guildWar: windows.guildWar !== null,
    },
    active:
      mode !== "off" && chosen && fits
        ? {
            season: mode,
            seasonNumber: chosen.seasonNumber,
            deadlineMs: chosen.boundariesMs[0]!,
            fits,
          }
        : null,
  }
}
