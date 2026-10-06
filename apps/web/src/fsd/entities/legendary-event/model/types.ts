import type {
  GameCatalogCharacterView,
  GameCatalogLreTrackView,
  LegendaryEventCommonStorageModel,
  LegendaryEventStorageModel,
} from "@workspace/game-catalog"
import type { PlayerDataChunkDto } from "@workspace/player-data"

// Domain names follow the glossary (lane / objective / run); the catalog storage models keep their
// V1 names (`lres`, `unitsRestrictions`, `lre-progress`) until the pending API rename lands.

/** One catalog Legendary Event; `id` is the event unit's snowprint id (e.g. "astarLysander"). */
export type LegendaryEvent = LegendaryEventStorageModel

/** The shared reward ladder (`lre-common`), assumed the same for every event. */
export type LegendaryEventCommon = LegendaryEventCommonStorageModel

export type LegendaryEventLaneId = "alpha" | "beta" | "gamma"

export const LEGENDARY_EVENT_LANE_IDS: readonly LegendaryEventLaneId[] = [
  "alpha",
  "beta",
  "gamma",
]

/** One lane of an event (the catalog's track view). */
export type LegendaryEventLane = GameCatalogLreTrackView

/** One lane objective (the catalog's `unitsRestrictions` record under its glossary name). */
export type LegendaryEventObjective =
  LegendaryEventLane["unitsRestrictions"][number]

/** A unit filter `{ kind, target, exclude }`, shared by objectives and a lane's allowed units. */
export type LegendaryEventUnitFilter = LegendaryEventObjective["filter"]

/** The caller's synced progress for one event (an `lre-progress` entry). */
export type LegendaryEventProgress = PlayerDataChunkDto<"lre-progress">[number]

/** One lane's synced record (`alpha` / `beta` / `gamma` of an `lre-progress` entry). */
export type LegendaryEventLaneRecord = NonNullable<
  LegendaryEventProgress[LegendaryEventLaneId]
>

/** The catalog character fields objective matching reads. Ability damage arrays are optional
 *  because rows cached before the schema default may lack them (see `characterDamageTypes`). */
export type LegendaryEventUnit = Pick<
  GameCatalogCharacterView,
  | "id"
  | "name"
  | "faction"
  | "alliance"
  | "meleeDamage"
  | "meleeHits"
  | "rangedDamage"
  | "rangedHits"
  | "traits"
> & {
  activeAbilityDamage?: readonly string[]
  passiveAbilityDamage?: readonly string[]
}

/** The roster fields the leaderboard reads (one synced `characters` record). */
export type LegendaryEventRosterUnit = Pick<
  PlayerDataChunkDto<"characters">[number],
  "unitId" | "rank" | "progressionIndex"
>

export type LegendaryEventLifecycleState = "active" | "upcoming" | "archived"

/**
 * Where an event stands at an instant: an `active` event carries its current run window, an
 * `upcoming` one its next run window, an `archived` one no window.
 */
export type LegendaryEventLifecycle =
  | { state: "active" | "upcoming"; runStartMs: number; runEndMs: number }
  // An unfinished event with no future run date yet (the catalog's "TBA").
  | {
      state: "upcoming" | "archived"
      runStartMs?: undefined
      runEndMs?: undefined
    }
