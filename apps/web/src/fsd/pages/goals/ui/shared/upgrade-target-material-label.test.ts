import { describe, expect, it } from "vitest"
import type { TFunction } from "i18next"

import { upgradeMaterialLabel } from "./upgrade-target-material-label"

const t = ((key: string, options?: Record<string, unknown>) =>
  options ? `${key}:${JSON.stringify(options)}` : key) as unknown as TFunction

const material = {
  upgradeId: "boon",
  label: "Boon",
  owned: 12,
  quantity: 28,
} as never

describe("upgradeMaterialLabel", () => {
  it("is the owned/needed count alone when no earlier goal holds the material", () => {
    expect(upgradeMaterialLabel(t, material)).toBe(
      'goals.overview.upgradeMaterial:{"name":"Boon","owned":"12","quantity":28}'
    )
  })

  it("adds a line per holder, taken-first or counted", () => {
    const label = upgradeMaterialLabel(t, {
      ...(material as object),
      heldBy: [
        {
          unitName: "Z'Kar",
          goalType: "Rank",
          priority: 12,
          amount: 12,
          counted: false,
        },
        {
          unitName: "Ahriman",
          goalType: "Rank",
          priority: null,
          amount: 2,
          counted: true,
        },
      ],
    } as never)
    expect(label.split("\n")).toEqual([
      'goals.overview.upgradeMaterial:{"name":"Boon","owned":"12","quantity":28}',
      'goals.overview.upgradeMaterialTakenFirst:{"amount":12,"unit":"Z\'Kar","goalType":"goals.create.goalTypes.Rank","priority":12}',
      'goals.overview.upgradeMaterialCounted:{"amount":2,"unit":"Ahriman","goalType":"goals.create.goalTypes.Rank","priority":"–"}',
    ])
  })
})
