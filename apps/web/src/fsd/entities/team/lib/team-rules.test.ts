import { describe, expect, it } from "vitest"

import { compareCodeUnits } from "@/shared/lib"

import { TEAM_RULE_CODES } from "../model/team-modes"
import type { TeamMode, TeamRuleCode } from "../model/types"
import { buildTeamRuleFacts } from "./team-rule-facts"
import {
  allowedFactions,
  charactersConcerned,
  evaluateTeamRules,
} from "./team-rules"
import type { TeamRuleInput } from "./team-rules"

// A slice of the served catalog with the ids and factions the API spec's scenarios name.
const characters = (
  [
    ["ultraTigurius", "Ultramarines"],
    ["ultraEliminatorSgt", "Ultramarines"],
    ["ultraInceptorSgt", "Ultramarines"],
    ["ultraCalgar", "Ultramarines"],
    ["ultraTitus", "Ultramarines"],
    ["ultraApothecary", "Ultramarines"],
    ["templHelbrecht", "BlackTemplars"],
    ["adeptCanoness", "Sisterhood"],
    ["orksNob", "Orks"],
    ["blackAbaddon", "BlackLegion"],
  ] as const
).map(([id, faction]) => ({ id, faction }))

const imperial = [
  "Ultramarines",
  "BlackTemplars",
  "SpaceWolves",
  "DarkAngels",
  "BloodAngels",
  "Custodes",
]

const facts = buildTeamRuleFacts({
  characters,
  mows: [
    { id: "ultraDreadnought" },
    { id: "tauBroadside" },
    { id: "orksRukkatrukk" },
  ],
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
      groupId: "elite1",
      types: ["Elite"],
      coreCharacters: [
        "ultraTigurius",
        "ultraEliminatorSgt",
        "ultraInceptorSgt",
      ],
    },
  ],
  campaignBattles: [
    { campaignGroupId: "campaign1", alliesFactions: ["Ultramarines"] },
    { campaignGroupId: "campaign1", alliesFactions: ["Ultramarines"] },
    { campaignGroupId: "elite1", alliesFactions: ["Ultramarines"] },
  ],
  incursions: [
    { mowId: "orksRukkatrukk", allowedFactions: imperial },
    { mowId: "tauBroadside", allowedFactions: ["Sisterhood", "Ultramarines"] },
    {
      mowId: "ultraDreadnought",
      allowedFactions: ["BlackLegion", "WorldEaters"],
    },
  ],
  survivalEvents: [
    {
      id: "december-2026",
      featuredCharacterId: "ultraCalgar",
      rules: {
        allowedFactionIds: ["Ultramarines", "BlackTemplars"],
        maxCharacters: 4,
        maxMows: 0,
      },
    },
    {
      id: "crescendo-a",
      featuredCharacterId: "orksNob",
      rules: {
        allowedFactionIds: ["Ultramarines"],
        maxCharacters: 10,
        maxMows: 1,
      },
    },
  ],
})

const team = (overrides: Partial<TeamRuleInput> = {}): TeamRuleInput => ({
  name: "Test team",
  modes: ["horde"],
  characterIds: ["ultraCalgar", "ultraTitus", "ultraApothecary"],
  flexStartIndex: null,
  mowIds: [],
  mowFlexStartIndex: null,
  campaignGroupId: null,
  incursionMowIds: [],
  ...overrides,
})

const seven = [
  "ultraTigurius",
  "ultraEliminatorSgt",
  "ultraInceptorSgt",
  "ultraCalgar",
  "ultraTitus",
  "ultraApothecary",
  "templHelbrecht",
]

const campaignTeam = (
  characterIds: string[],
  flexStartIndex: number | null = null
) =>
  team({
    modes: ["campaign"],
    campaignGroupId: "campaign1",
    characterIds,
    flexStartIndex,
  })

const rules = (input: TeamRuleInput) => evaluateTeamRules(input, facts)

describe("evaluateTeamRules (API spec scenarios)", () => {
  it("passes a valid team", () => {
    expect(rules(team())).toEqual([])
  })

  it("six core characters in Guild War break the five-core rule", () => {
    expect(
      rules(team({ modes: ["warOffense"], characterIds: seven.slice(0, 6) }))
    ).toEqual(["tooManyCoreCharacters"])
  })

  it("flex characters do not count toward five", () => {
    expect(
      rules(
        team({ modes: ["warDefense"], characterIds: seven, flexStartIndex: 5 })
      )
    ).toEqual([])
  })

  it("Guild Raid has no size limit", () => {
    expect(
      rules(
        team({
          modes: ["guildRaid"],
          characterIds: seven,
          mowIds: ["ultraDreadnought", "tauBroadside"],
        })
      )
    ).toEqual([])
  })

  it.each<TeamMode>(["warOffense", "warDefense", "tournamentArena"])(
    "%s allows one core MoW",
    (mode) => {
      expect(
        rules(
          team({ modes: [mode], mowIds: ["ultraDreadnought", "tauBroadside"] })
        )
      ).toEqual(["tooManyCoreMows"])
    }
  )

  it("does not count flex MoWs toward one", () => {
    expect(
      rules(
        team({
          modes: ["warOffense"],
          mowIds: ["ultraDreadnought", "tauBroadside", "orksRukkatrukk"],
          mowFlexStartIndex: 1,
        })
      )
    ).toEqual([])
  })

  it("allows every MoW to be flex", () => {
    expect(
      rules(
        team({
          modes: ["warDefense"],
          mowIds: ["ultraDreadnought", "tauBroadside"],
          mowFlexStartIndex: 0,
        })
      )
    ).toEqual([])
  })

  it("Campaign cannot be combined with another mode", () => {
    expect(
      rules({
        ...campaignTeam(seven.slice(0, 3)),
        modes: ["campaign", "horde"],
      })
    ).toEqual(["modeNotCombinable"])
  })

  it("Campaign needs every core character of its campaign", () => {
    expect(
      rules(
        campaignTeam(["ultraTigurius", "ultraEliminatorSgt", "ultraCalgar"])
      )
    ).toEqual(["coreCharacterMissing"])
    expect(rules(campaignTeam(seven.slice(0, 3)))).toEqual([])
  })

  it("a core character listed as flex is missing from the core", () => {
    expect(
      rules(
        campaignTeam(
          [
            "ultraEliminatorSgt",
            "ultraInceptorSgt",
            "ultraCalgar",
            "ultraTigurius",
          ],
          3
        )
      )
    ).toEqual(["coreCharacterMissing"])
  })

  it("Elite is not a separate campaign", () => {
    expect(
      rules({ ...campaignTeam(seven.slice(0, 3)), campaignGroupId: "elite1" })
    ).toEqual(["unknownCampaign"])
  })

  it("Campaign characters come from the campaign's factions", () => {
    expect(rules(campaignTeam([...seven.slice(0, 3), "orksNob"]))).toEqual([
      "factionNotAllowed",
    ])
  })

  it("Campaign needs a campaign, and other teams none", () => {
    expect(
      rules({ ...campaignTeam(seven.slice(0, 3)), campaignGroupId: null })
    ).toEqual(["campaignRequired"])
    expect(rules(team({ campaignGroupId: "campaign1" }))).toEqual([
      "campaignRequired",
    ])
  })

  it("Campaign and Incursion teams have no MoWs", () => {
    expect(
      rules({
        ...campaignTeam(seven.slice(0, 3)),
        mowIds: ["ultraDreadnought"],
      })
    ).toEqual(["mowsNotAllowed"])
  })

  it("an Incursion character outside what Rukkatrukk allows", () => {
    expect(
      rules(
        team({
          modes: ["incursion"],
          incursionMowIds: ["orksRukkatrukk"],
          characterIds: ["ultraCalgar", "ultraTitus", "adeptCanoness"],
        })
      )
    ).toEqual(["factionNotAllowed"])
  })

  it("a team for two Incursions takes only factions both allow", () => {
    expect(
      rules(
        team({
          modes: ["incursion"],
          incursionMowIds: ["tauBroadside", "orksRukkatrukk"],
          characterIds: ["ultraCalgar", "ultraTitus", "adeptCanoness"],
        })
      )
    ).toEqual(["factionNotAllowed"])
    expect(
      rules(
        team({
          modes: ["incursion"],
          incursionMowIds: ["tauBroadside", "orksRukkatrukk"],
          characterIds: ["ultraCalgar", "ultraTitus", "ultraApothecary"],
        })
      )
    ).toEqual([])
  })

  it("Incursions with no faction in common", () => {
    expect(
      rules(
        team({
          modes: ["incursion"],
          incursionMowIds: ["ultraDreadnought", "tauBroadside"],
          characterIds: [],
          mowIds: [],
        })
      )
    ).toEqual(["tooFewCharacters", "noSharedIncursionFaction"])
  })

  it("Incursion needs an Incursion, and other teams none", () => {
    expect(rules(team({ modes: ["incursion"] }))).toEqual(["incursionRequired"])
    expect(rules(team({ incursionMowIds: ["orksRukkatrukk"] }))).toEqual([
      "incursionRequired",
    ])
  })

  it("an Incursion the catalog does not serve", () => {
    expect(
      rules(team({ modes: ["incursion"], incursionMowIds: ["notAMow"] }))
    ).toEqual(["unknownIncursion"])
  })

  it("names, modes, units and unknown units", () => {
    expect(rules(team({ name: "  ab " }))).toEqual(["nameLength"])
    expect(rules(team({ name: "x".repeat(41) }))).toEqual(["nameLength"])
    expect(rules(team({ modes: [] }))).toEqual(["noMode"])
    expect(rules(team({ characterIds: [] }))).toEqual(["tooFewCharacters"])
    expect(
      rules(
        team({
          characterIds: ["ultraCalgar", "ultraTitus"],
          mowIds: ["ultraDreadnought", "tauBroadside"],
          mowFlexStartIndex: 1,
        })
      )
    ).toEqual(["tooFewCharacters"])
    expect(
      rules(team({ characterIds: ["notAUnit", "ultraTitus", "ultraCalgar"] }))
    ).toEqual(["unknownUnit"])
    expect(rules(team({ mowIds: ["notAMow"] }))).toEqual(["unknownUnit"])
  })

  it("an unknown character is not also a faction failure", () => {
    expect(
      rules(
        team({
          modes: ["incursion"],
          incursionMowIds: ["orksRukkatrukk"],
          characterIds: ["notAUnit", "ultraCalgar", "ultraTitus"],
        })
      )
    ).toEqual(["unknownUnit"])
  })

  it("lists broken rules in the API's order", () => {
    const broken = rules(
      team({
        name: "x",
        modes: ["warOffense", "campaign"],
        characterIds: seven.slice(0, 6),
        mowIds: ["ultraDreadnought", "tauBroadside"],
      })
    )
    expect(broken).toEqual(
      TEAM_RULE_CODES.filter((code: TeamRuleCode) => broken.includes(code))
    )
    expect(broken).toEqual([
      "nameLength",
      "modeNotCombinable",
      "tooManyCoreCharacters",
      "tooManyCoreMows",
      "mowsNotAllowed",
      "campaignRequired",
    ])
  })
})

describe("evaluateTeamRules (Survival)", () => {
  const survivalTeam = (overrides: Partial<TeamRuleInput> = {}) =>
    team({
      survivalEventKey: "december-2026",
      characterIds: ["ultraTitus", "ultraApothecary", "templHelbrecht"],
      ...overrides,
    })

  it("passes a Horde team within the event's caps and factions", () => {
    expect(rules(survivalTeam())).toEqual([])
  })

  it("needs the Horde mode alone", () => {
    expect(rules(survivalTeam({ modes: ["horde", "guildRaid"] }))).toEqual([
      "survivalModeRequired",
    ])
  })

  it("rejects an event the catalog does not know", () => {
    expect(rules(survivalTeam({ survivalEventKey: "march-2020" }))).toEqual([
      "unknownSurvivalEvent",
    ])
  })

  it("does not store the featured hero", () => {
    expect(
      rules(
        survivalTeam({
          characterIds: ["ultraCalgar", "ultraTitus", "templHelbrecht"],
        })
      )
    ).toEqual(["survivalFeaturedCharacter"])
  })

  it("caps the characters", () => {
    expect(
      rules(
        survivalTeam({
          characterIds: [
            "ultraTigurius",
            "ultraEliminatorSgt",
            "ultraInceptorSgt",
            "ultraTitus",
            "templHelbrecht",
          ],
        })
      )
    ).toEqual(["survivalTooManyCharacters"])
  })

  it("rejects MoWs when the event takes none, and caps them otherwise", () => {
    expect(rules(survivalTeam({ mowIds: ["ultraDreadnought"] }))).toEqual([
      "mowsNotAllowed",
    ])
    const crescendo = survivalTeam({
      survivalEventKey: "crescendo-a",
      characterIds: ["ultraTitus", "ultraApothecary", "ultraTigurius"],
    })
    expect(rules({ ...crescendo, mowIds: ["ultraDreadnought"] })).toEqual([])
    expect(
      rules({ ...crescendo, mowIds: ["ultraDreadnought", "tauBroadside"] })
    ).toEqual(["survivalTooManyMows"])
  })

  it("takes characters only from the allowed factions", () => {
    expect(
      rules(
        survivalTeam({
          characterIds: ["ultraTitus", "orksNob", "templHelbrecht"],
        })
      )
    ).toEqual(["factionNotAllowed"])
  })

  it("marks the featured hero and the characters from other factions", () => {
    const concerned = charactersConcerned(
      survivalTeam({ characterIds: ["ultraCalgar", "orksNob", "ultraTitus"] }),
      facts
    )
    expect([...concerned.notAllowed].toSorted(compareCodeUnits)).toEqual([
      "orksNob",
      "ultraCalgar",
    ])
    expect([...(allowedFactions(survivalTeam(), facts) ?? [])]).toEqual([
      "Ultramarines",
      "BlackTemplars",
    ])
  })
})

describe("allowedFactions and charactersConcerned", () => {
  it("a campaign allows its factions; an Incursion team the shared ones", () => {
    expect([...(allowedFactions(campaignTeam([]), facts) ?? [])]).toEqual([
      "Ultramarines",
    ])
    expect([
      ...(allowedFactions(
        team({
          modes: ["incursion"],
          incursionMowIds: ["tauBroadside", "orksRukkatrukk"],
        }),
        facts
      ) ?? []),
    ]).toEqual(["Ultramarines"])
    expect(allowedFactions(team(), facts)).toBeUndefined()
  })

  it("marks the Sisterhood character on a Rukkatrukk team", () => {
    const concerned = charactersConcerned(
      team({
        modes: ["incursion"],
        incursionMowIds: ["orksRukkatrukk"],
        characterIds: ["ultraCalgar", "adeptCanoness"],
      }),
      facts
    )
    expect([...concerned.notAllowed]).toEqual(["adeptCanoness"])
  })

  it("marks a campaign core character sitting in the flex section", () => {
    const concerned = charactersConcerned(
      campaignTeam(
        ["ultraEliminatorSgt", "ultraInceptorSgt", "ultraTigurius"],
        2
      ),
      facts
    )
    expect([...concerned.missingCore]).toEqual(["ultraTigurius"])
  })
})
