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

/** The waves fought at one rarity cap, with every enemy they field. */
export interface WaveGroup {
  /** The rarity cap these waves are fought at. */
  rarity: string
  rows: WaveRow[]
  /** Each enemy across the group's waves (clone waves field none), with how many spawn in all,
   *  in order of first appearance. */
  enemies: { npcId: string; count: number }[]
}

/**
 * The waves split where the rarity cap rises: a wave whose clear raises it ends its group. The first
 * group is at the event's lowest featured-hero rarity (Common when the event names none).
 */
export function waveGroups(
  event: Pick<SurvivalEvent, "waves" | "scoring" | "rules">
): WaveGroup[] {
  const groups: WaveGroup[] = []
  let rarity = event.rules.featuredHeroStats[0]?.rarity ?? "Common"
  let current: WaveGroup | undefined
  for (const row of waveRows(event)) {
    if (!current) {
      current = { rarity, rows: [], enemies: [] }
      groups.push(current)
    }
    current.rows.push(row)
    if (row.wave.cloneHealthPct === undefined) {
      for (const enemy of row.wave.enemies) {
        const seen = current.enemies.find(
          (entry) => entry.npcId === enemy.npcId
        )
        if (seen) seen.count += enemy.count
        else current.enemies.push({ npcId: enemy.npcId, count: enemy.count })
      }
    }
    if (row.wave.enemyRarityOnClear) {
      rarity = row.wave.enemyRarityOnClear
      current = undefined
    }
  }
  return groups
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
