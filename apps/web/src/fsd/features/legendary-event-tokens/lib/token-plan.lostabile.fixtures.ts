import {
  buildLanePointsModel,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"

// `lostaBile` (Fabius Bile) lanes from the catalog source (tacticus-planner-api GameCatalog
// Data/lres/lres-lostabile.json): `battlesPoints`, `defeatAll` and the five objectives in catalog
// `index` order. V1 shows the Final Justice trait as "Final Vengeance" and Teleport Strike as
// "Deep Strike".

type LaneSource = Parameters<typeof buildLanePointsModel>[0]

const lane = (
  laneId: LegendaryEventLaneId,
  battlesPoints: number[],
  defeatAll: number[],
  objectives: [name: string, points: number][]
): LaneSource =>
  ({
    battleIds: battlesPoints.map(
      (_, index) => `lostaBile-${laneId}-${index + 1}`
    ),
    battlesPoints,
    defeatAll,
    unitsRestrictions: objectives.map(([name, points], index) => ({
      name,
      points,
      index,
    })),
  }) as unknown as LaneSource

export const lostaBileLanes: Record<LegendaryEventLaneId, LaneSource> = {
  alpha: lane(
    "alpha",
    [31, 33, 35, 37, 39, 41, 38, 45, 39, 38, 41, 47, 49, 49, 57, 49, 55, 65],
    [...Array.from({ length: 17 }, () => 37), 45],
    [
      ["Black Templars", 100],
      ["Blast", 95],
      ["Final Justice", 90],
      ["Max 2 hits", 60],
      ["No Bolter", 30],
    ]
  ),
  beta: lane(
    "beta",
    [29, 31, 33, 35, 37, 39, 41, 43, 43, 43, 45, 43, 47, 50, 49, 51, 47, 55],
    [...Array.from({ length: 17 }, () => 40), 48],
    [
      ["Piercing", 90],
      ["Max 3 hits", 40],
      ["Teleport Strike", 95],
      ["Parry", 100],
      ["No Power", 50],
    ]
  ),
  gamma: lane(
    "gamma",
    [23, 31, 32, 36, 36, 37, 39, 39, 40, 42, 40, 42, 40, 44, 48, 50, 50, 34],
    [...Array.from({ length: 17 }, () => 46), 62],
    [
      ["Mechanical", 80],
      ["Infiltrate", 100],
      ["Min 5 hits", 70],
      ["Flame", 95],
      ["No Flying", 30],
    ]
  ),
}
