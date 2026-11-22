import { describe, expect, it } from "vitest"

import { buildTeamRuleFacts } from "@/entities/team"
import type { Team } from "@/entities/team"

import {
  FLEX_DIVIDER,
  addCharacter,
  arrangeCharacters,
  arrangeMows,
  canMakeCore,
  canMakeFlex,
  canMakeMowCore,
  chooseCampaign,
  draftFromTeam,
  draftToFields,
  emptyDraft,
  lineupSections,
  makeCore,
  makeFlex,
  makeMowCore,
  makeMowFlex,
  modeBlock,
  mowSections,
  nextPlacement,
  removeCharacter,
  setIncursions,
  takesMows,
  toggleMode,
  toggleMow,
  undoToggle,
  unitPlacement,
} from "./team-draft"
import type { TeamDraft } from "./team-draft"

const draft = (overrides: Partial<TeamDraft> = {}): TeamDraft => ({
  ...emptyDraft(),
  name: "Team",
  modes: ["horde"],
  ...overrides,
})

const sections = (value: TeamDraft) => lineupSections(value)

describe("core and flex", () => {
  it("makes a character flex: it leads the flex section after the core", () => {
    const next = makeFlex(draft({ characterIds: ["A", "B", "C"] }), "A")
    expect(sections(next)).toEqual({ core: ["B", "C"], flex: ["A"] })
    expect(next.characterIds).toEqual(["B", "C", "A"])
    expect(next.flexStartIndex).toBe(2)
  })

  it("adds a new character as the last core character, keeping flex", () => {
    const next = addCharacter(
      draft({ characterIds: ["A", "B"], flexStartIndex: 1 }),
      "C"
    )
    expect(sections(next)).toEqual({ core: ["A", "C"], flex: ["B"] })
  })

  it("makes a flex character core again, at the end of the core", () => {
    const next = makeCore(
      draft({ characterIds: ["A", "B", "C"], flexStartIndex: 1 }),
      "C"
    )
    expect(sections(next)).toEqual({ core: ["A", "C"], flex: ["B"] })
  })

  it("saves a null flex index when no flex character is left", () => {
    const withFlex = draft({ characterIds: ["A", "B"], flexStartIndex: 1 })
    expect(makeCore(withFlex, "B").flexStartIndex).toBeNull()
    expect(removeCharacter(withFlex, "B").flexStartIndex).toBeNull()
    expect(addCharacter(draft(), "A").flexStartIndex).toBeNull()
  })

  it("moves the first flex character into core when the last core one is removed", () => {
    const value = draft({ characterIds: ["A", "B", "C"], flexStartIndex: 1 })
    const next = removeCharacter(value, "A")
    expect(sections(next)).toEqual({ core: ["B"], flex: ["C"] })
    expect(next.flexStartIndex).toBe(1)
    const lastOne = removeCharacter(
      draft({ characterIds: ["A", "B"], flexStartIndex: 1 }),
      "A"
    )
    expect(sections(lastOne)).toEqual({ core: ["B"], flex: [] })
    expect(lastOne.flexStartIndex).toBeNull()
  })

  it("keeps at least one core character", () => {
    const value = draft({ characterIds: ["A", "B"], flexStartIndex: 1 })
    expect(canMakeFlex(value, "A")).toBe(false)
    expect(canMakeFlex(draft({ characterIds: ["A", "B"] }), "A")).toBe(true)
  })

  it("does not add a character twice, and toggles MoWs", () => {
    const value = draft({ characterIds: ["A"] })
    expect(addCharacter(value, "A")).toBe(value)
    expect(toggleMow(toggleMow(value, "M"), "M").mowIds).toEqual([])
  })

  it("sends a sixth character to flex in a war team", () => {
    const full = draft({
      modes: ["warOffense"],
      characterIds: ["A", "B", "C", "D", "E"],
    })
    expect(nextPlacement(full, "character")).toBe("flex")
    const added = addCharacter(full, "F")
    expect(sections(added)).toEqual({
      core: ["A", "B", "C", "D", "E"],
      flex: ["F"],
    })
  })

  it("keeps adding to core where no limit applies", () => {
    const horde = draft({ characterIds: ["A", "B", "C", "D", "E"] })
    expect(sections(addCharacter(horde, "F")).core).toHaveLength(6)
  })
})

describe("core limits", () => {
  const war = (overrides: Partial<TeamDraft> = {}) =>
    draft({ modes: ["warOffense"], ...overrides })

  it("keeps a flex character flex while a war core is full", () => {
    const full = war({
      characterIds: ["A", "B", "C", "D", "E", "F"],
      flexStartIndex: 5,
    })
    expect(canMakeCore(full, "F")).toBe(false)
    expect(makeCore(full, "F")).toBe(full)
  })

  it("makes a flex character core while the war core has room, and always outside war", () => {
    const room = war({ characterIds: ["A", "B", "C"], flexStartIndex: 2 })
    expect(canMakeCore(room, "C")).toBe(true)
    const horde = draft({
      characterIds: ["A", "B", "C", "D", "E", "F"],
      flexStartIndex: 5,
    })
    expect(canMakeCore(horde, "F")).toBe(true)
    expect(sections(makeCore(horde, "F")).flex).toEqual([])
  })

  it("keeps a flex MoW flex while the war core MoW slot is taken", () => {
    const full = war({ mowIds: ["M", "N"], mowFlexStartIndex: 1 })
    expect(canMakeMowCore(full, "N")).toBe(false)
    expect(makeMowCore(full, "N")).toBe(full)
  })
})

describe("undo", () => {
  it("restores the lineup exactly while nothing changed since", () => {
    const before = war()
    const after = addCharacter(before, "F")
    expect(
      undoToggle(after, before, after, { kind: "character", id: "F" })
    ).toEqual(before)
  })

  it("reverses only its own unit after later changes", () => {
    const before = draft({ characterIds: ["A", "B", "C"] })
    const afterX = addCharacter(before, "X")
    const afterY = addCharacter(afterX, "Y")
    const flexed = makeFlex(afterY, "A")
    const undone = undoToggle(flexed, before, afterX, {
      kind: "character",
      id: "X",
    })
    expect(sections(undone)).toEqual({ core: ["B", "C", "Y"], flex: ["A"] })
  })

  it("puts back a removed MoW, and does nothing once the unit is already back", () => {
    const before = draft({ mowIds: ["M"] })
    const afterRemove = toggleMow(before, "M")
    const later = { ...afterRemove, name: "Renamed", mowIds: ["N"] }
    expect(
      undoToggle(later, before, afterRemove, { kind: "mow", id: "M" }).mowIds
    ).toEqual(["N", "M"])
    const back = { ...later, mowIds: ["N", "M"] }
    expect(
      undoToggle(back, before, afterRemove, { kind: "mow", id: "M" })
    ).toBe(back)
  })

  function war(overrides: Partial<TeamDraft> = {}) {
    return draft({
      modes: ["warOffense"],
      characterIds: ["A", "B", "C", "D", "E"],
      ...overrides,
    })
  }
})

describe("MoW core and flex", () => {
  it("sends a second MoW to flex in a war team, which still satisfies the rules", () => {
    const value = toggleMow(
      toggleMow(draft({ modes: ["warDefense"] }), "M"),
      "N"
    )
    expect(mowSections(value)).toEqual({ core: ["M"], flex: ["N"] })
    expect(value.mowFlexStartIndex).toBe(1)
    expect(modeBlock(value, "tournamentArena")).toBeNull()
  })

  it("lets every MoW be flex, saving index 0, and makes one core again", () => {
    const flexed = makeMowFlex(draft({ mowIds: ["M"] }), "M")
    expect(flexed.mowFlexStartIndex).toBe(0)
    const core = makeMowCore(flexed, "M")
    expect(core.mowFlexStartIndex).toBeNull()
    expect(mowSections(core).core).toEqual(["M"])
  })

  it("clears the MoW flex index with the MoWs when Campaign is chosen", () => {
    const value = toggleMode(
      draft({ modes: [], mowIds: ["M", "N"], mowFlexStartIndex: 1 }),
      "campaign"
    )
    expect(value).toMatchObject({ mowIds: [], mowFlexStartIndex: null })
  })
})

describe("modes", () => {
  it("selecting Campaign or Incursion clears the MoWs", () => {
    const value = draft({ modes: [], mowIds: ["M"] })
    expect(toggleMode(value, "campaign").mowIds).toEqual([])
    expect(toggleMode(value, "incursion").mowIds).toEqual([])
    expect(toggleMode(value, "horde").mowIds).toEqual(["M"])
  })

  it("clearing Campaign clears the campaign, and Incursion its Incursions", () => {
    expect(
      toggleMode(
        draft({ modes: ["campaign"], campaignGroupId: "campaign1" }),
        "campaign"
      ).campaignGroupId
    ).toBeNull()
    expect(
      toggleMode(
        draft({ modes: ["incursion"], incursionMowIds: ["M"] }),
        "incursion"
      ).incursionMowIds
    ).toEqual([])
  })

  it("explains why a mode is unavailable", () => {
    expect(modeBlock(draft({ modes: ["campaign"] }), "horde")).toEqual({
      reason: "exclusive",
      mode: "campaign",
    })
    expect(modeBlock(draft({ modes: ["horde"] }), "incursion")).toEqual({
      reason: "exclusiveBlocked",
      mode: "incursion",
    })
    expect(
      modeBlock(
        draft({ characterIds: ["1", "2", "3", "4", "5", "6"] }),
        "warOffense"
      )
    ).toEqual({ reason: "tooManyCore" })
    expect(
      modeBlock(
        draft({
          characterIds: ["1", "2", "3", "4", "5", "6"],
          flexStartIndex: 5,
        }),
        "warOffense"
      )
    ).toBeNull()
    expect(modeBlock(draft({ mowIds: ["M", "N"] }), "tournamentArena")).toEqual(
      {
        reason: "tooManyCoreMows",
      }
    )
    expect(modeBlock(draft({ modes: ["horde"] }), "horde")).toBeNull()
    expect(modeBlock(draft({ mowIds: ["M", "N"] }), "guildRaid")).toBeNull()
  })

  it("takes MoWs unless Campaign or Incursion is selected", () => {
    expect(takesMows(draft())).toBe(true)
    expect(takesMows(draft({ modes: ["campaign"] }))).toBe(false)
  })
})

describe("campaign and Incursion", () => {
  const facts = buildTeamRuleFacts({
    characters: [],
    mows: [],
    campaignDefinitions: [
      {
        groupId: "campaign1",
        types: ["Standard"],
        coreCharacters: [
          "ultraTigurius",
          "ultraEliminatorSgt",
          "ultraInceptorSgt",
        ],
      },
      {
        groupId: "campaign3",
        types: ["Standard"],
        coreCharacters: ["orksNob"],
      },
    ],
    campaignBattles: [],
    incursions: [],
  })

  it("choosing a campaign replaces the lineup with its core characters", () => {
    const indomitus = chooseCampaign(
      draft({
        modes: ["campaign"],
        characterIds: ["A", "B"],
        flexStartIndex: 1,
      }),
      "campaign1",
      facts
    )
    expect(indomitus.characterIds).toEqual([
      "ultraTigurius",
      "ultraEliminatorSgt",
      "ultraInceptorSgt",
    ])
    expect(indomitus.flexStartIndex).toBeNull()
    expect(chooseCampaign(indomitus, "campaign3", facts).characterIds).toEqual([
      "orksNob",
    ])
  })

  it("changing the Incursions clears the lineup", () => {
    const next = setIncursions(
      draft({
        modes: ["incursion"],
        characterIds: ["A"],
        flexStartIndex: null,
      }),
      ["orksRukkatrukk"]
    )
    expect(next).toMatchObject({
      incursionMowIds: ["orksRukkatrukk"],
      characterIds: [],
    })
  })
})

describe("saved teams", () => {
  const team: Team = {
    id: "t1",
    revision: 3,
    position: 1,
    name: "Imported",
    modes: ["warOffense"],
    characterIds: ["A", "B"],
    flexStartIndex: 1,
    mowIds: ["M", "N"],
    mowFlexStartIndex: null,
    campaignGroupId: null,
    incursionMowIds: [],
    notes: null,
    rarityCap: "Epic",
    issues: ["tooManyCoreMows"],
  }

  it("starts from the team as saved, issues and all", () => {
    expect(draftFromTeam(team)).toMatchObject({
      notes: "",
      mowIds: ["M", "N"],
      mowFlexStartIndex: null,
      flexStartIndex: 1,
      rarityCap: "Epic",
    })
  })

  it("sends the name trimmed and blank notes as null", () => {
    expect(
      draftToFields({
        ...draftFromTeam(team),
        name: "  Imported ",
        notes: "  ",
      })
    ).toMatchObject({ name: "Imported", notes: null })
  })
})

describe("lineup band order", () => {
  const D = FLEX_DIVIDER

  it("makes the units before the divider core and the ones after it flex", () => {
    const next = arrangeCharacters(draft({ characterIds: ["A", "B", "C"] }), [
      "C",
      "A",
      D,
      "B",
    ])
    expect(next.characterIds).toEqual(["C", "A", "B"])
    expect(next.flexStartIndex).toBe(2)
    expect(unitPlacement(next, "character", "B")).toBe("flex")
  })

  it("saves a null flex start with the divider last", () => {
    const next = arrangeCharacters(
      draft({ characterIds: ["A", "B"], flexStartIndex: 1 }),
      ["B", "A", D]
    )
    expect(next.flexStartIndex).toBeNull()
  })

  it("keeps at least one core character and a campaign's core in core", () => {
    const start = draft({ characterIds: ["A", "B"] })
    expect(arrangeCharacters(start, [D, "A", "B"])).toBe(start)
    expect(arrangeCharacters(start, ["B", D, "A"], new Set(["A"]))).toBe(start)
  })

  it("lets every MoW be flex", () => {
    const next = arrangeMows(draft({ mowIds: ["M1", "M2"] }), [D, "M2", "M1"])
    expect(next.mowIds).toEqual(["M2", "M1"])
    expect(next.mowFlexStartIndex).toBe(0)
    expect(unitPlacement(next, "mow", "M1")).toBe("flex")
    expect(unitPlacement(next, "mow", "X")).toBeNull()
  })
})
