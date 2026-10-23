import type { Alliance, Rank } from "@workspace/game-domain"

import type {
  HseEventPointsState,
  HseInstance,
} from "@/features/home-screen-event-points"
import {
  buildHseTeamsViewModel,
  type HseTeamsRead,
} from "@/features/team-recommendations/model/hse-teams-view-model"
import { anyUnitPowerFixture } from "./team-power"

// A synced roster for the HSE event teams: Psykers in every alliance (four Imperial among other
// Imperial characters, five Chaos, one Xenos) and only two Xenos characters, so the Xenos teams
// fall back to the insufficient-roster message. Ranks set the combat-power order (higher first).

type FixtureCharacter = {
  unitId: string
  rank: Rank
  alliance: Alliance
  faction: string
  traits: string[]
}

const character = (
  unitId: string,
  rank: Rank,
  alliance: Alliance,
  faction: string,
  traits: string[] = []
): FixtureCharacter => ({ unitId, rank, alliance, faction, traits })

export const hseTeamsFixtureCharacters: FixtureCharacter[] = [
  // Imperial Psykers, strongest first: Mephiston, Tigurius, Njal, Sibyll.
  character("bloodMephiston", "Gold3", "Imperial", "BloodAngels", ["Psyker"]),
  character("ultraTigurius", "Gold2", "Imperial", "Ultramarines", ["Psyker"]),
  character("spaceStormcaller", "Gold1", "Imperial", "SpaceWolves", ["Psyker"]),
  character("astraPrimarisPsy", "Silver3", "Imperial", "AstraMilitarum", [
    "Psyker",
  ]),
  // Other Imperial characters: Calgar is the strongest of all, Azrael the next.
  character("ultraCalgar", "Diamond3", "Imperial", "Ultramarines"),
  character("darkaAzrael", "Diamond1", "Imperial", "DarkAngels"),
  // Chaos Psykers, strongest first: Ahriman, Abraxas, Thaumachus, Typhus, Archimatos.
  character("thousAhriman", "Diamond2", "Chaos", "ThousandSons", ["Psyker"]),
  character("thousInfernalMaster", "Gold3", "Chaos", "ThousandSons", [
    "Psyker",
  ]),
  character("thousSorcerer", "Gold2", "Chaos", "ThousandSons", ["Psyker"]),
  character("deathTyphus", "Gold1", "Chaos", "DeathGuard", ["Psyker"]),
  character("blackPossession", "Silver1", "Chaos", "BlackLegion", ["Psyker"]),
  // Two Xenos characters only (Eldryon is a Psyker).
  character("eldarFarseer", "Gold1", "Xenos", "Aeldari", ["Psyker"]),
  character("necroSpyder", "Gold2", "Xenos", "Necrons"),
]

/** The roster and catalog read of `characters` (defaults to the fixture roster). */
export function hseTeamsFixtureRead(
  characters: readonly FixtureCharacter[] = hseTeamsFixtureCharacters
): HseTeamsRead {
  return {
    status: "ready",
    roster: characters.map((entry) => ({
      unitId: entry.unitId as never,
      rank: entry.rank,
      progressionIndex: "Common:None" as never,
      xpLevel: 1,
      appliedUpgradeSlots: [],
      abilities: [{ level: 1 }, { level: 1 }],
    })),
    catalog: new Map(
      characters.map((entry) => [
        entry.unitId,
        {
          traits: entry.traits,
          alliance: entry.alliance,
          faction: entry.faction,
        },
      ])
    ),
  }
}

/** Stands in for `useHseTeamRecommendations` in page and tour tests: the real view-model builder
 * over a read (undefined: loading). */
export function fixtureHseTeams(
  instance: HseInstance | null,
  points: HseEventPointsState,
  read: HseTeamsRead | undefined
) {
  return buildHseTeamsViewModel({
    instance,
    points,
    read,
    unitPower: anyUnitPowerFixture(),
    retry: () => {},
  })
}
