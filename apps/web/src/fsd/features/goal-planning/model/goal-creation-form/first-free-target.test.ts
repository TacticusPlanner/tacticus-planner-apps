import { describe, expect, it } from "vitest"
import { Rank } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"

import {
  firstFreeTarget,
  rankEndKey,
  takenTargetsOf,
} from "./first-free-target"

const NONE = new Set<string>()

describe("firstFreeTarget", () => {
  it("defaults Ascension to the next step, never the current one", () => {
    expect(firstFreeTarget("Ascension", "Legendary:RedThreeStars", NONE)).toBe(
      "Legendary:RedFourStars"
    )
  })

  it("skips Rank targets in-flight goals hold: Gold II skips Gold III and Diamond I", () => {
    const taken = new Set([rankEndKey(Rank.Gold3), rankEndKey(Rank.Diamond1)])
    expect(firstFreeTarget("Rank", Rank.Gold2, taken)).toBe(Rank.Diamond2)
  })

  it("falls back to the next step (the slot conflict then shows) when every step is taken", () => {
    const taken = new Set([Rank.Adamantine1, Rank.Adamantine2].map(rankEndKey))
    expect(firstFreeTarget("Rank", Rank.Diamond3, taken)).toBe(Rank.Adamantine1)
  })

  it("raises both ability tracks a level, skipping a taken pair", () => {
    expect(
      firstFreeTarget(
        "Ability",
        { active: 20, passive: 18 },
        new Set(["21:19"])
      )
    ).toEqual({ active: 22, passive: 20 })
  })
})

describe("takenTargetsOf", () => {
  const goal = (overrides: Partial<GoalDetail>) =>
    ({
      goalId: "g",
      entityType: "Character",
      entityId: "incisus",
      goalType: "Rank",
      status: "Active",
      config: {},
      ...overrides,
    }) as GoalDetail

  it("collects in-flight targets of the unit per type, and its Unlock goal", () => {
    const { taken, unlockGoal } = takenTargetsOf(
      [
        goal({
          goalType: "Rank",
          config: {
            rank: {
              start: 0,
              end: 11,
              endPointFive: false,
              endAppliedUpgrades: 0,
            },
          } as never,
        }),
        goal({ goalId: "u", goalType: "Unlock" }),
        goal({
          goalType: "Ascension",
          status: "Completed",
          config: { progression: { start: "Rare:None", end: "Epic:None" } },
        } as never),
        goal({ entityId: "other", goalType: "Unlock" }),
      ],
      "Character",
      "incisus"
    )

    expect([...(taken.get("Rank") ?? [])]).toEqual(["11:0"])
    expect(taken.has("Ascension")).toBe(false)
    expect(unlockGoal?.goalId).toBe("u")
  })
})
