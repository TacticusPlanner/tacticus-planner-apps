import {
  type LaneProgressView,
  type LegendaryEventBattle,
} from "@/entities/legendary-event"
import {
  battleEnemyCount,
  defaultBattleIndex,
  orderLaneBattles,
  sortedWaves,
} from "../../../lib/battle-preview"
import type { NpcRecord } from "@/entities/npc"
import {
  buildEnemyTile,
  type EnemyTileViewModel,
} from "@/widgets/battle-preview"

import type { ReadValue } from "../legendary-event-page.view-model"

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
      /** Re-runs the `npcs` read; set only when it failed (tiles then show no level). */
      retryNpcs: (() => void) | undefined
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
 * synced progress.
 */
export function buildBattlesSection({
  battleIds,
  battles,
  retryBattles,
  npcs,
  retryNpcs,
  progress,
}: {
  battleIds: readonly string[]
  battles: ReadValue<LegendaryEventBattle[]>
  retryBattles: () => void
  npcs: ReadValue<ReadonlyMap<string, NpcRecord>>
  retryNpcs: () => void
  progress: LaneProgressView | undefined
}): BattlesSectionState {
  if (battles === "loading") return { kind: "loading" }
  if (battles === "error") return { kind: "error", retry: retryBattles }
  const lane = orderLaneBattles(battleIds, battles)
  if (lane.length === 0) return { kind: "empty" }
  const npcsById =
    typeof npcs === "string"
      ? npcs === "error"
        ? ("unavailable" as const)
        : ("pending" as const)
      : npcs
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
    retryNpcs: npcs === "error" ? retryNpcs : undefined,
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
          buildEnemyTile(enemy, `${waveIndex}-${enemyIndex}`, npcsById)
        ),
      })),
    })),
  }
}
