import type { BattleId } from "@workspace/game-domain"
import { describe, expect, it } from "vitest"

import { groupTodaysAttempts } from "./todays-attempts-groups"
import type { TodaysAttemptRow } from "./todays-attempts-groups"

const row = (
  battleId: string,
  attemptsUsed: number,
  resourceId: string | undefined,
  campaignKey: string | undefined
): TodaysAttemptRow => ({
  battleId: battleId as BattleId,
  attemptsUsed,
  resourceId,
  campaignKey,
})

// Saim-Hann Elite 39 and Saim-Hann Mirror Elite 6 farm the same material.
const rows = [
  row("saimHannElite39", 3, "upgA", "saimHann:Elite"),
  row("saimHannMirrorElite6", 5, "upgA", "saimHannMirror:Elite"),
  row("saimHannElite12", 4, "upgB", "saimHann:Elite"),
  row("unknown", 2, undefined, undefined),
]
const summary = (groups: ReturnType<typeof groupTodaysAttempts>) =>
  groups.map((group) => [
    group.groupKey ?? "none",
    group.attempts,
    group.rows.map((entry) => entry.battleId),
  ])

describe("groupTodaysAttempts", () => {
  it("groups by upgrade, so a material raided at two nodes shows its have / need once", () => {
    expect(summary(groupTodaysAttempts(rows, "upgrade"))).toEqual([
      ["upgA", 8, ["saimHannMirrorElite6", "saimHannElite39"]],
      ["upgB", 4, ["saimHannElite12"]],
      ["none", 2, ["unknown"]],
    ])
  })

  it("groups by campaign in the plan's campaign order, then the rest by most attempts", () => {
    expect(
      summary(
        groupTodaysAttempts(rows, "campaign", [
          "saimHannMirror:Elite",
          "saimHann:Elite",
        ])
      )
    ).toEqual([
      ["saimHannMirror:Elite", 5, ["saimHannMirrorElite6"]],
      ["saimHann:Elite", 7, ["saimHannElite12", "saimHannElite39"]],
      ["none", 2, ["unknown"]],
    ])
    expect(summary(groupTodaysAttempts(rows, "campaign"))[0]).toEqual([
      "saimHann:Elite",
      7,
      ["saimHannElite12", "saimHannElite39"],
    ])
  })
})
