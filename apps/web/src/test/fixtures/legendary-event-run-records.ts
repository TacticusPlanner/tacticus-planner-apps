// Run records for Uthar shaped like `GET /me/legendary-event-plans/votanUthar/run-records`
// (spec: legendary-event-run-history worked examples): run 1 with Alpha teams "Ultras" (objectives
// Ultramarines and Melee) and "Melee" (Melee), Calgar at Diamond 1 / 5 red stars and Tigurius not
// yet owned; run 2 started a week later with one Alpha battle.
import type { LegendaryEventRunRecord } from "@/entities/legendary-event"

export const utharRun1Record: LegendaryEventRunRecord = {
  id: "record-run-1",
  run: 1,
  startedAt: "2026-10-04T08:00:00Z",
  progressAt: "2026-10-06T19:30:00Z",
  catalogVersion: "1",
  points: 2410,
  lanes: {
    alpha: [
      { objectivesCleared: [0, 1, 2, 3, 4, 5], highScore: 29 },
      { objectivesCleared: [0, 1, 4, 5], highScore: 31 },
      { objectivesCleared: [0, 4], highScore: 35 },
      { objectivesCleared: [0, 1], highScore: 30 },
      { objectivesCleared: [], highScore: 12 },
    ],
    beta: null,
    gamma: null,
  },
  teams: [
    {
      teamId: "team-ultras",
      laneId: "alpha",
      name: "Ultras",
      sortOrder: 0,
      memberUnitIds: ["ultraCalgar", "ultraTigurius"],
      reserveUnitId: null,
      objectiveIndexes: [0, 3],
      expectedBattleClears: 6,
      expectedBattleClearsSource: "manual",
    },
    {
      teamId: "team-melee",
      laneId: "alpha",
      name: "Melee",
      sortOrder: 1,
      memberUnitIds: ["ultraCalgar"],
      reserveUnitId: null,
      objectiveIndexes: [3],
      expectedBattleClears: null,
      expectedBattleClearsSource: null,
    },
  ],
  rosterSnapshot: {
    id: "snapshot-1",
    takenAt: "2026-10-06T19:30:00Z",
    catalogVersion: "1",
    characters: [
      {
        unitId: "ultraCalgar",
        progressionIndex: "Legendary:RedFiveStars",
        rank: "Diamond1",
        xp: 0,
        xpLevel: 45,
        shards: 0,
        mythicShards: 0,
        abilities: [
          { abilityId: "CalgarActive", level: 40 },
          { abilityId: "CalgarPassive", level: 38 },
        ],
        appliedUpgradeSlots: [],
        equippedItems: [],
      },
    ],
    mows: [],
  },
}

export const utharRun2Record: LegendaryEventRunRecord = {
  ...utharRun1Record,
  id: "record-run-2",
  run: 2,
  startedAt: "2026-10-11T08:00:00Z",
  progressAt: "2026-10-11T09:00:00Z",
  points: 300,
  lanes: {
    alpha: [{ objectivesCleared: [0, 1, 2], highScore: 34 }],
    beta: null,
    gamma: null,
  },
}

/** The current roster for the deltas: Calgar progressed, Tigurius unlocked. */
export const rosterAfterRun1 = [
  {
    unitId: "ultraCalgar",
    rank: "Diamond3",
    progressionIndex: "Legendary:OneBlueStar",
    abilities: [
      { abilityId: "CalgarActive", level: 45 },
      { abilityId: "CalgarPassive", level: 38 },
    ],
    appliedUpgradeSlots: [],
  },
  {
    unitId: "ultraTigurius",
    rank: "Gold1",
    progressionIndex: "Epic:RedOneStar",
    abilities: [],
    appliedUpgradeSlots: [],
  },
] as const
