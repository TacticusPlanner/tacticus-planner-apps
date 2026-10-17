import {
  battleEnemyCount,
  defaultBattleIndex,
  orderLaneBattles,
  sortedWaves,
  type LaneProgressView,
  type LegendaryEventBattle,
} from "@/entities/legendary-event"
import {
  npcLibraryHref,
  resolveLadderRow,
  type NpcRecord,
  type NpcStatRow,
} from "@/entities/npc"

import type { ReadValue } from "../legendary-event-page.view-model"

/** One enemy entry of a wave: an NPC at a ladder index, `count` times. */
export interface EnemyTileViewModel {
  key: string
  npcId: string
  /** The served NPC, or undefined while `npcs` is pending or when the id is unknown. */
  npc: NpcRecord | undefined
  count: number
  /** The resolved ladder row; undefined when the level is unknown (or NPCs are pending). */
  row: NpcStatRow | undefined
  /** The NPC Library page at this variation and level, when the Library lists the variation. */
  libraryHref: string | undefined
  /** `pending`: NPCs not read yet; `unknownLevel`: unknown id or an index past the ladder. */
  level: "resolved" | "unknownLevel" | "pending"
}

interface WaveViewModel {
  /** 1-based wave number in round order. */
  number: number
  round: number
  power: number
  enemies: EnemyTileViewModel[]
}

export interface BattlePreviewViewModel {
  id: string
  /** 1-based battle number in the lane. */
  number: number
  power: number
  enemyCount: number
  mapId: string
  complete: boolean
  waves: WaveViewModel[]
}

export type BattlesSectionState =
  | { kind: "loading" }
  | { kind: "error"; retry: () => void }
  | { kind: "empty" }
  | {
      kind: "ready"
      battles: BattlePreviewViewModel[]
      /** 0-based default selection (first incomplete battle). */
      defaultIndex: number
    }

/** The selected lane's Battles section with its page-held selection (design D3). */
export interface BattlesViewModel {
  state: BattlesSectionState
  /** 0-based battle the user picked on this lane; undefined uses `defaultIndex`. */
  selectedIndex: number | undefined
  onSelect: (index: number) => void
  /** The mobile Map disclosure, kept open across battles and lanes while on the page. */
  mapOpen: boolean
  onMapOpenChange: (open: boolean) => void
}

/**
 * A lane's Battles section from the event page's `lre-battles` read, the `npcs` read and the lane's
 * synced progress. Enemy levels resolve through `resolveLadderRow` (1-based `ladderIndex`).
 */
export function buildBattlesSection({
  battleIds,
  battles,
  retryBattles,
  npcs,
  progress,
}: {
  battleIds: readonly string[]
  battles: ReadValue<LegendaryEventBattle[]>
  retryBattles: () => void
  npcs: ReadValue<ReadonlyMap<string, NpcRecord>>
  progress: LaneProgressView | undefined
}): BattlesSectionState {
  if (battles === "loading") return { kind: "loading" }
  if (battles === "error") return { kind: "error", retry: retryBattles }
  const lane = orderLaneBattles(battleIds, battles)
  if (lane.length === 0) return { kind: "empty" }
  const npcsById = typeof npcs === "string" ? undefined : npcs
  // Progress is indexed by `battleIds` position, which differs from `lane` if a battle is unserved.
  const positionOf = (battle: LegendaryEventBattle) =>
    battleIds.indexOf(battle.id)
  const completeAt = (position: number) =>
    progress?.status === "synced" &&
    progress.battles[position]?.complete === true
  const defaultPosition = defaultBattleIndex(progress, battleIds.length)
  const defaultIndex = lane.findIndex(
    (battle) => positionOf(battle) >= defaultPosition
  )

  return {
    kind: "ready",
    defaultIndex: defaultIndex === -1 ? lane.length - 1 : defaultIndex,
    battles: lane.map((battle) => ({
      id: battle.id,
      number: battle.number,
      power: battle.power,
      enemyCount: battleEnemyCount(battle),
      mapId: battle.mapId,
      complete: completeAt(positionOf(battle)),
      waves: sortedWaves(battle).map((wave, waveIndex) => ({
        number: waveIndex + 1,
        round: wave.round,
        power: wave.power,
        enemies: wave.enemies.map((enemy, enemyIndex) =>
          enemyTile(enemy, `${waveIndex}-${enemyIndex}`, npcsById)
        ),
      })),
    })),
  }
}

function enemyTile(
  enemy: { id: string; ladderIndex: number; count: number },
  key: string,
  npcsById: ReadonlyMap<string, NpcRecord> | undefined
): EnemyTileViewModel {
  if (!npcsById) {
    return {
      key,
      npcId: enemy.id,
      npc: undefined,
      count: enemy.count,
      row: undefined,
      libraryHref: undefined,
      level: "pending",
    }
  }
  const npc = npcsById.get(enemy.id)
  const resolved = resolveLadderRow(npc, enemy.ladderIndex)
  return {
    key,
    npcId: enemy.id,
    npc,
    count: enemy.count,
    row: resolved?.row,
    libraryHref:
      npc && resolved ? npcLibraryHref(npc, resolved.servedIndex) : undefined,
    level: resolved ? "resolved" : "unknownLevel",
  }
}
