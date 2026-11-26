import type { SurvivalEvent, SurvivalWave } from "./survival-event"

/** One wave as the Enemies tab shows it. */
export interface WaveRow {
  wave: SurvivalWave
  /** The medal first earned by clearing this wave. */
  medal: string | undefined
  /** The run's last wave, built to be out of reach: shown as "Final wave". */
  final: boolean
}

/** The waves in order, each with the medal it earns and whether it is the last. */
export function waveRows(
  event: Pick<SurvivalEvent, "waves" | "scoring">
): WaveRow[] {
  const medals = new Map(
    event.scoring.medals.map((medal) => [medal.wave, medal.medal])
  )
  const last = Math.max(...event.waves.map((wave) => wave.wave))
  return event.waves
    .toSorted((a, b) => a.wave - b.wave)
    .map((wave) => ({
      wave,
      medal: medals.get(wave.wave),
      final: wave.wave === last,
    }))
}

/** The points each enemy is worth on a kill, by `npcId:statsIndex`. */
export function killScoreIndex(
  event: Pick<SurvivalEvent, "scoring">
): ReadonlyMap<string, number> {
  return new Map(
    event.scoring.killScores.map((score) => [
      `${score.npcId}:${score.statsIndex}`,
      score.score,
    ])
  )
}
