import { describe, expect, it } from "vitest"

import { variationMode, variationModeLabelKey } from "./variation-mode"

describe("variationMode", () => {
  it.each([
    ["necroBossWardenLHE", "lhe"],
    ["astarCyrus_LHE", "lhe"],
    ["necroBossWardenLEG", "legendary"],
    ["necroNpc1WarriorSurv", "survival"],
    ["necroBossC1Warden", "campaign"],
    ["admecBossDominusCE", "championEvent"],
    ["tyranNpc4WarriorCE2Gorgon", "gorgon"],
    ["necroNpc1TutWarrior", "tutorial"],
    ["necroNpc1TutWarriorFTUEtest", "tutorial"],
    ["astraNpc4Mortar_SyncPvp_Kronos", "syncPvp"],
    ["tyranNpc3TermagantLeviathan", "leviathan"],
    ["tyranNpc3TermagantKronos", "kronos"],
  ])("%s -> %s", (id, mode) => {
    expect(variationMode(id, false)).toBe(mode)
  })

  it("reads an unsuffixed id as standard only when it is the group default", () => {
    expect(variationMode("necroNpcWarden", true)).toBe("standard")
    expect(variationMode("necroBossWarden", false)).toBe("unknown")
  })

  it("does not mistake an unrelated id fragment for a mode", () => {
    expect(variationMode("necroNpcLHESwarm", false)).toBe("unknown")
    expect(variationMode("tauNpc1Pathfinder", false)).toBe("unknown")
  })

  it("maps a mode to its library namespace key", () => {
    expect(variationModeLabelKey("lhe")).toBe("npcs.variationMode.lhe")
  })
})
