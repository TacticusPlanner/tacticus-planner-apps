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

/** The waves fought at one rarity cap, with every enemy they field and what clearing them brings. */
export interface WaveGroup {
  /** The rarity cap these waves are fought at. */
  rarity: string
  rows: WaveRow[]
  /** Each enemy across the group's waves (clone waves field none), with how many spawn in all,
   *  in order of first appearance. */
  enemies: { npcId: string; count: number }[]
  /** The medals first earned in these waves, in wave order. */
  medals: string[]
  /** Each power-up the group's clears grant, with how many in all, in order of first grant. A
   *  summon granted at several levels counts once per grant. */
  powerUps: { id: string; npcId?: string; count: number }[]
}

/** Adds a non-clone wave's enemies to its group's totals. */
function addEnemies(group: WaveGroup, wave: SurvivalWave) {
  if (wave.cloneHealthPct !== undefined) return
  for (const enemy of wave.enemies) {
    const seen = group.enemies.find((entry) => entry.npcId === enemy.npcId)
    if (seen) seen.count += enemy.count
    else group.enemies.push({ npcId: enemy.npcId, count: enemy.count })
  }
}

/** Adds the power-ups a wave's clear grants to its group's totals. */
function addPowerUps(group: WaveGroup, wave: SurvivalWave) {
  for (const powerUp of wave.powerUpsOnClear) {
    const seen = group.powerUps.find((entry) => entry.id === powerUp.id)
    if (seen) seen.count += powerUp.count
    else
      group.powerUps.push({
        id: powerUp.id,
        npcId: powerUp.npcId,
        count: powerUp.count,
      })
  }
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
      current = { rarity, rows: [], enemies: [], medals: [], powerUps: [] }
      groups.push(current)
    }
    current.rows.push(row)
    if (row.medal) current.medals.push(row.medal)
    addEnemies(current, row.wave)
    addPowerUps(current, row.wave)
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
