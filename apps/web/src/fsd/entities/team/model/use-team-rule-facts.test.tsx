import { waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderHook } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { useTeamRuleFacts } from "./use-team-rule-facts"

describe("useTeamRuleFacts", () => {
  it("builds the facts from the served catalog, without Elite campaigns", async () => {
    await seedGameCatalog({
      characters: [
        { id: "ultraCalgar", name: "Calgar", faction: "Ultramarines" },
      ],
      mows: [{ id: "orksRukkatrukk", name: "Rukkatrukk", faction: "Orks" }],
      "campaign-definitions": [
        {
          groupId: "campaign1",
          types: ["Standard"],
          coreCharacters: ["ultraCalgar"],
          battleIds: [],
        },
        {
          groupId: "elite1",
          types: ["Elite"],
          coreCharacters: ["ultraCalgar"],
          battleIds: [],
        },
      ],
      "campaign-battles": [
        {
          id: "b1",
          campaignGroupId: "campaign1",
          alliesFactions: ["Ultramarines"],
        },
      ],
      incursions: [
        {
          mowId: "orksRukkatrukk",
          allowedFactions: ["Ultramarines", "Custodes"],
        },
      ],
    })

    const { result } = renderHook(() => useTeamRuleFacts())

    await waitFor(() => expect(result.current.status).toBe("ready"))
    if (result.current.status !== "ready") return
    const facts = result.current.data
    expect(facts.characterFactions.get("ultraCalgar")).toBe("Ultramarines")
    expect([...facts.mowIds]).toEqual(["orksRukkatrukk"])
    expect([...facts.campaigns.keys()]).toEqual(["campaign1"])
    expect([
      ...(facts.campaigns.get("campaign1")?.alliesFactions ?? []),
    ]).toEqual(["Ultramarines"])
    expect([
      ...(facts.incursionFactionsByMowId.get("orksRukkatrukk") ?? []),
    ]).toEqual(["Ultramarines", "Custodes"])
  })
})
