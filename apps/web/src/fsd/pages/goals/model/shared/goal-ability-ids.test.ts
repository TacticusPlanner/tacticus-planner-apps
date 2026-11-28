import { describe, expect, it } from "vitest"

import { goalAbilityIds } from "./goal-ability-ids"

describe("goalAbilityIds", () => {
  const charactersById = new Map([
    [
      "ultraTigurius",
      { activeAbilityNames: ["Storm"], passiveAbilityNames: ["Foresight"] },
    ],
  ])
  const mowsById = new Map([
    [
      "tauRazorshark",
      {
        primaryAbility: { name: "QuadIonTurret" },
        secondaryAbility: { name: "SeekerMissiles" },
      },
    ],
  ])

  it("reads a character's active and passive abilities", () => {
    expect(
      goalAbilityIds("Character", "ultraTigurius", { charactersById })
    ).toEqual(["Storm", "Foresight"])
  })

  it("reads a Machine of War's primary and secondary abilities", () => {
    expect(goalAbilityIds("Mow", "tauRazorshark", { mowsById })).toEqual([
      "QuadIonTurret",
      "SeekerMissiles",
    ])
  })

  it("has none while the catalog is loading or the unit is unknown", () => {
    expect(goalAbilityIds("Character", "ultraTigurius", {})).toEqual([
      undefined,
      undefined,
    ])
    expect(goalAbilityIds("Character", "nobody", { charactersById })).toEqual([
      undefined,
      undefined,
    ])
  })
})
