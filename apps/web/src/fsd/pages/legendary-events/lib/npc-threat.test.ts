import { describe, expect, it } from "vitest"

import en from "../../../../../public/locales/en/npcThreats.json"
import { parseNpcThreatText } from "./npc-threat"

describe("parseNpcThreatText", () => {
  it("keeps the non-blank string fields", () => {
    expect(
      parseNpcThreatText({ threat: "Plasma", counter: " ", extra: "x" })
    ).toEqual({ threat: "Plasma" })
  })

  it("is empty for a missing or malformed entry", () => {
    expect(parseNpcThreatText(undefined)).toEqual({})
    expect(parseNpcThreatText("text")).toEqual({})
  })

  it("gives every curated NPC both fields", () => {
    for (const [npcId, entry] of Object.entries(en)) {
      expect(Object.keys(parseNpcThreatText(entry)), npcId).toEqual([
        "threat",
        "counter",
      ])
    }
  })
})
