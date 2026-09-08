import { describe, expect, it } from "vitest"

import type {
  AscensionCostStorageModel,
  CharacterStorageModel,
  MowStorageModel,
} from "@workspace/game-catalog"
import { progressionOrder } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"

import {
  recommendOnslaughtShardRecipient,
  type RecommendOnslaughtShardRecipientInput,
} from "./onslaught-shard-recipient"

// A flat ascension ladder: every step past the first costs 10 regular shards, except the Mythic
// steps which cost 10 mythic shards. Enough to make "remaining shards" a function of the range.
const ascensionCostsById: ReadonlyMap<string, AscensionCostStorageModel> =
  new Map(
    progressionOrder.map((step, index) => [
      step,
      {
        id: step,
        shards: index === 0 ? 0 : step.startsWith("Mythic:") ? 0 : 10,
        mythicShards: step.startsWith("Mythic:") ? 10 : 0,
        orbs: 0,
        orbRarity: null,
      } as unknown as AscensionCostStorageModel,
    ])
  )

const character = (name: string, alliance: string) =>
  ({ id: name, name, alliance }) as unknown as CharacterStorageModel
const mow = (name: string, alliance: string) =>
  ({ id: name, name, alliance }) as unknown as MowStorageModel

type GoalOver = {
  goalId: string
  entityId: string
  entityType?: "Character" | "Mow"
  start?: string
  end?: string
  onslaught?: boolean
  status?: string
}

const makeGoal = (over: GoalOver): GoalDetail =>
  ({
    goalId: over.goalId,
    entityType: over.entityType ?? "Character",
    entityId: over.entityId,
    goalType: "Ascension",
    status: over.status ?? "Active",
    projectIds: [],
    config: {
      progression: {
        start: over.start ?? "Common:None",
        end: over.end ?? "Rare:FourStars",
      },
      acquisitionSources:
        over.onslaught === false ? [] : [{ kind: "Onslaught", ids: [] }],
    },
  }) as unknown as GoalDetail

const owned = (
  progressionIndex = "Common:None",
  shards = 0,
  mythicShards = 0
) => ({
  progressionIndex,
  shards,
  mythicShards,
})

const baseInput = (
  over: Partial<RecommendOnslaughtShardRecipientInput>
): RecommendOnslaughtShardRecipientInput => ({
  track: "Imperial",
  ascensionGoals: [],
  charactersById: new Map(),
  mowsById: new Map(),
  playerCharacterById: new Map(),
  playerMowById: new Map(),
  ascensionCostsById,
  selectedProjectId: undefined,
  selectedProjectGoalPriority: new Map(),
  overallGoalOrder: [],
  ...over,
})

describe("recommendOnslaughtShardRecipient", () => {
  it("returns 'none' when the track has no eligible Onslaught Ascension goal", () => {
    const result = recommendOnslaughtShardRecipient(
      baseInput({
        ascensionGoals: [
          makeGoal({ goalId: "g1", entityId: "impHero", onslaught: false }),
        ],
        charactersById: new Map([
          ["impHero", character("impHero", "Imperial")],
        ]),
        playerCharacterById: new Map([["impHero", owned()]]),
      })
    )
    expect(result).toEqual({ status: "none" })
  })

  it("excludes a goal that has already reached its target rarity", () => {
    const result = recommendOnslaughtShardRecipient(
      baseInput({
        ascensionGoals: [
          makeGoal({
            goalId: "g1",
            entityId: "impHero",
            start: "Common:None",
            end: "Common:OneStar",
          }),
        ],
        charactersById: new Map([
          ["impHero", character("impHero", "Imperial")],
        ]),
        playerCharacterById: new Map([["impHero", owned("Common:TwoStars")]]),
      })
    )
    expect(result).toEqual({ status: "none" })
  })

  it("recommends a Machine of War when it is the only eligible goal", () => {
    const result = recommendOnslaughtShardRecipient(
      baseInput({
        ascensionGoals: [
          makeGoal({ goalId: "g1", entityId: "raxRax", entityType: "Mow" }),
        ],
        mowsById: new Map([["raxRax", mow("Rax", "Imperial")]]),
        playerMowById: new Map([["raxRax", owned()]]),
      })
    )
    expect(result.status).toBe("ready")
    if (result.status !== "ready") return
    expect(result.recipient.unitKind).toBe("mow")
    expect(result.recipient.unitId).toBe("raxRax")
    expect(result.recipient.reason).toBe("onlyCandidate")
  })

  it("prefers a goal in the selected project over one that is not", () => {
    const result = recommendOnslaughtShardRecipient(
      baseInput({
        selectedProjectId: "p1",
        selectedProjectGoalPriority: new Map([["gProj", 0]]),
        overallGoalOrder: ["gOther", "gProj"],
        ascensionGoals: [
          makeGoal({ goalId: "gOther", entityId: "heroOther" }),
          makeGoal({ goalId: "gProj", entityId: "heroProj" }),
        ],
        charactersById: new Map([
          ["heroOther", character("heroOther", "Imperial")],
          ["heroProj", character("heroProj", "Imperial")],
        ]),
        playerCharacterById: new Map([
          ["heroOther", owned()],
          ["heroProj", owned()],
        ]),
      })
    )
    expect(result.status).toBe("ready")
    if (result.status !== "ready") return
    expect(result.recipient.goalId).toBe("gProj")
    expect(result.recipient.projectId).toBe("p1")
    expect(result.recipient.reason).toBe("inSelectedProject")
  })

  it("within the selected project, the lower priority number wins", () => {
    const result = recommendOnslaughtShardRecipient(
      baseInput({
        selectedProjectId: "p1",
        selectedProjectGoalPriority: new Map([
          ["gLow", 5],
          ["gHigh", 1],
        ]),
        ascensionGoals: [
          makeGoal({ goalId: "gLow", entityId: "heroLow" }),
          makeGoal({ goalId: "gHigh", entityId: "heroHigh" }),
        ],
        charactersById: new Map([
          ["heroLow", character("heroLow", "Imperial")],
          ["heroHigh", character("heroHigh", "Imperial")],
        ]),
        playerCharacterById: new Map([
          ["heroLow", owned()],
          ["heroHigh", owned()],
        ]),
      })
    )
    expect(result.status).toBe("ready")
    if (result.status !== "ready") return
    expect(result.recipient.goalId).toBe("gHigh")
  })

  it("outside the project, the earlier position in the overall goal order wins", () => {
    const result = recommendOnslaughtShardRecipient(
      baseInput({
        overallGoalOrder: ["gFirst", "gSecond"],
        ascensionGoals: [
          makeGoal({ goalId: "gSecond", entityId: "heroB" }),
          makeGoal({ goalId: "gFirst", entityId: "heroA" }),
        ],
        charactersById: new Map([
          ["heroA", character("heroA", "Imperial")],
          ["heroB", character("heroB", "Imperial")],
        ]),
        playerCharacterById: new Map([
          ["heroA", owned()],
          ["heroB", owned()],
        ]),
      })
    )
    expect(result.status).toBe("ready")
    if (result.status !== "ready") return
    expect(result.recipient.goalId).toBe("gFirst")
    expect(result.recipient.reason).toBe("overallGoalPriority")
  })

  it("breaks an order tie by the smaller remaining shard count", () => {
    const result = recommendOnslaughtShardRecipient(
      baseInput({
        // Neither goal is in the overall order — both fall to the remaining-shards tiebreak.
        ascensionGoals: [
          makeGoal({
            goalId: "gFar",
            entityId: "heroFar",
            end: "Rare:FiveStars",
          }),
          makeGoal({
            goalId: "gNear",
            entityId: "heroNear",
            end: "Common:TwoStars",
          }),
        ],
        charactersById: new Map([
          ["heroFar", character("heroFar", "Imperial")],
          ["heroNear", character("heroNear", "Imperial")],
        ]),
        playerCharacterById: new Map([
          ["heroFar", owned()],
          ["heroNear", owned()],
        ]),
      })
    )
    expect(result.status).toBe("ready")
    if (result.status !== "ready") return
    expect(result.recipient.goalId).toBe("gNear")
    expect(result.recipient.reason).toBe("fewestRemainingShards")
    expect(result.recipient.remainingShards).toBeLessThan(
      result.alternates[0].remainingShards
    )
  })

  it("counts mythic shards for a goal that ascends into the Mythic tier", () => {
    const result = recommendOnslaughtShardRecipient(
      baseInput({
        ascensionGoals: [
          makeGoal({
            goalId: "gMyth",
            entityId: "heroMyth",
            start: "Legendary:OneBlueStar",
            end: "Mythic:TwoBlueStars",
          }),
        ],
        charactersById: new Map([
          ["heroMyth", character("heroMyth", "Imperial")],
        ]),
        playerCharacterById: new Map([
          ["heroMyth", owned("Legendary:OneBlueStar", 0, 4)],
        ]),
      })
    )
    expect(result.status).toBe("ready")
    if (result.status !== "ready") return
    // Two Mythic steps at 10 mythic shards each, less 4 owned mythic shards.
    expect(result.recipient.remainingShards).toBe(16)
    expect(result.recipient.currentShards).toBe(4)
    expect(result.recipient.targetRarity).toBe("Mythic")
  })

  it("ignores goals whose target unit is not of the selected track's alliance", () => {
    const result = recommendOnslaughtShardRecipient(
      baseInput({
        track: "Imperial",
        ascensionGoals: [makeGoal({ goalId: "gCha", entityId: "chaHero" })],
        charactersById: new Map([["chaHero", character("chaHero", "Chaos")]]),
        playerCharacterById: new Map([["chaHero", owned()]]),
      })
    )
    expect(result).toEqual({ status: "none" })
  })
})
