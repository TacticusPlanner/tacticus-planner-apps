import { describe, expect, it } from "vitest"

import type { GuildRaidModifierView } from "./guild-raid-status-view-model"
import {
  countActivatedModifiers,
  nextModifierToActivate,
} from "./guild-raid-modifier-selection"

function modifier(
  overrides: Partial<GuildRaidModifierView> = {}
): GuildRaidModifierView {
  return {
    modifierId: "mod-1",
    description: { kind: "amount", text: "-10%" },
    activation: { kind: "known", remainingHp: 9000, active: false },
    ...overrides,
  }
}

describe("nextModifierToActivate", () => {
  it("returns undefined for an empty list", () => {
    expect(nextModifierToActivate([])).toBeUndefined()
  })

  it("returns the first modifier that isn't confirmed active", () => {
    const active = modifier({
      modifierId: "a",
      activation: { kind: "known", remainingHp: 10500, active: true },
    })
    const pending = modifier({
      modifierId: "b",
      activation: { kind: "known", remainingHp: 9000, active: false },
    })
    const later = modifier({
      modifierId: "c",
      activation: { kind: "known", remainingHp: 7500, active: false },
    })

    expect(nextModifierToActivate([active, pending, later])).toBe(pending)
  })

  it("treats an unknown activation as not-yet-confirmed rather than skipping it", () => {
    const active = modifier({
      modifierId: "a",
      activation: { kind: "known", remainingHp: 10500, active: true },
    })
    const unknown = modifier({
      modifierId: "b",
      activation: { kind: "unknown" },
    })

    expect(nextModifierToActivate([active, unknown])).toBe(unknown)
  })

  it("returns undefined once every modifier is confirmed active", () => {
    const first = modifier({
      modifierId: "a",
      activation: { kind: "known", remainingHp: 10500, active: true },
    })
    const second = modifier({
      modifierId: "b",
      activation: { kind: "known", remainingHp: 9000, active: true },
    })

    expect(nextModifierToActivate([first, second])).toBeUndefined()
  })
})

describe("countActivatedModifiers", () => {
  it("counts only modifiers with a confirmed active activation", () => {
    const active = modifier({
      activation: { kind: "known", remainingHp: 10500, active: true },
    })
    const pending = modifier({
      activation: { kind: "known", remainingHp: 9000, active: false },
    })
    const unknown = modifier({ activation: { kind: "unknown" } })

    expect(countActivatedModifiers([active, pending, unknown])).toBe(1)
  })

  it("is zero for an empty list", () => {
    expect(countActivatedModifiers([])).toBe(0)
  })
})
