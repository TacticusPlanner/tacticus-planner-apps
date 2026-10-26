import { describe, expect, it } from "vitest"
import type { TFunction } from "i18next"

import { goalTargetKey, goalTargetLabel } from "./goal-target-key"
import { rankTargetKey } from "./rank-target-key"

const ability = (
  activeStart: number,
  activeEnd: number,
  passiveStart: number,
  passiveEnd: number
) => ({ ability: { activeStart, activeEnd, passiveStart, passiveEnd } })

const upgrade = (
  targets: { upgradeId: string; quantity: number }[],
  ranges: Record<string, { start: number; end: number }> = {}
) => ({ upgrade: { targets, ...ranges } })

describe("goalTargetKey", () => {
  it("delegates Rank to rankTargetKey", () => {
    const rank = {
      start: 0,
      startPointFive: false,
      startAppliedUpgrades: 0,
      end: 11,
      endPointFive: false,
      endAppliedUpgrades: 3,
    }
    expect(goalTargetKey("Rank", { rank })).toBe(rankTargetKey(rank))
  })

  it("keys Ascension by its end only", () => {
    const end = "Legendary:RedFiveStars"
    expect(
      goalTargetKey("Ascension", {
        progression: { start: "Epic:RedOneStar", end },
      })
    ).toBe(end)
    expect(
      goalTargetKey("Ascension", {
        progression: { start: "Rare:FourStars", end },
      })
    ).toBe(end)
  })

  it("keys Ability by both ends, with an unadvanced track as -", () => {
    expect(goalTargetKey("Ability", ability(40, 50, 40, 45))).toBe("50:45")
    expect(goalTargetKey("Ability", ability(40, 50, 30, 30))).toBe("50:-")
    expect(goalTargetKey("Ability", ability(40, 50, 35, 35))).toBe("50:-")
  })

  it("keys Upgrade by its sorted materials, quantities and ranges", () => {
    const forward = upgrade([
      { upgradeId: "b", quantity: 2 },
      { upgradeId: "a", quantity: 1 },
    ])
    const reversed = upgrade([
      { upgradeId: "a", quantity: 1 },
      { upgradeId: "b", quantity: 2 },
    ])
    expect(goalTargetKey("Upgrade", forward)).toBe("ax1,bx2")
    expect(goalTargetKey("Upgrade", reversed)).toBe("ax1,bx2")
    expect(
      goalTargetKey("Upgrade", upgrade([{ upgradeId: "a", quantity: 3 }]))
    ).toBe("ax3")
    expect(
      goalTargetKey(
        "Upgrade",
        upgrade([{ upgradeId: "a", quantity: 1 }], {
          rankRange: { start: 2, end: 5 },
          passiveRange: { start: 1, end: 9 },
        })
      )
    ).toBe("ax1|r2-5|p1-9")
  })

  it("has no key for Unlock or a goal without its target group", () => {
    expect(goalTargetKey("Unlock", {})).toBeNull()
    expect(goalTargetKey("Ascension", {})).toBeNull()
    expect(goalTargetKey("Rank", { rank: null })).toBeNull()
  })
})

describe("goalTargetLabel", () => {
  const t = ((key: string, options?: Record<string, unknown>) =>
    options && "count" in options
      ? `${key}:${String(options.count)}`
      : typeof options?.defaultValue === "string"
        ? options.defaultValue
        : key) as unknown as TFunction

  it("labels Ability tracks and Upgrade material counts", () => {
    expect(
      goalTargetLabel(t, {
        goalType: "Ability",
        config: ability(40, 50, 30, 30),
      })
    ).toBe("50/–")
    expect(
      goalTargetLabel(t, {
        goalType: "Upgrade",
        config: upgrade([
          { upgradeId: "a", quantity: 1 },
          { upgradeId: "b", quantity: 2 },
        ]),
      })
    ).toBe("goals.target.upgradeMaterials:2")
    expect(goalTargetLabel(t, { goalType: "Unlock", config: {} })).toBeNull()
  })
})
