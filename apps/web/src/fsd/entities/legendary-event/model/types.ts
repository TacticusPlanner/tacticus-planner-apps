import type {
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

export type LegendaryEventLifecycleState = "active" | "upcoming" | "archived"

/**
 * Where an event stands at an instant: an `active` event carries its current run window, an
 * `upcoming` one its next run window, an `archived` one no window.
 */
export type LegendaryEventLifecycle =
  | { state: "active" | "upcoming"; runStartMs: number; runEndMs: number }
  | { state: "archived"; runStartMs?: undefined; runEndMs?: undefined }
