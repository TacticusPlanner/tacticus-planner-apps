// A small synthetic lane and units for the team builder tests (spec scenarios "Coverage follows
// the members" and friends): A and B both satisfy Melee and Min 5 Hits, only A satisfies No
// Resilient, R (the reserve candidate) is ranged with 2 hits and satisfies only No Resilient.
import type {
  GameCatalogCharacterView,
  GameCatalogLreTrackView,
} from "@workspace/game-catalog"

type Unit = {
  id: string
  name: string
  faction: string
  alliance: string
  meleeDamage: string
  meleeHits: number
  rangedDamage: string | null
  rangedHits: number | null
  traits: string[]
}

const unit = (overrides: Partial<Unit> & Pick<Unit, "id" | "name">): Unit => ({
  faction: "Ultramarines",
  alliance: "Imperial",
  meleeDamage: "Power",
  meleeHits: 5,
  rangedDamage: null,
  rangedHits: null,
  traits: [],
  ...overrides,
})

export const teamUnits = {
  a: unit({ id: "unitA", name: "Aleph" }),
  b: unit({ id: "unitB", name: "Beth", meleeHits: 6, traits: ["Resilient"] }),
  r: unit({
    id: "unitR",
    name: "Resh",
    rangedDamage: "Bolter",
    rangedHits: 2,
  }),
  c: unit({ id: "unitC", name: "Gimel" }),
  d: unit({ id: "unitD", name: "Dalet" }),
  e: unit({ id: "unitE", name: "He" }),
  x: unit({ id: "unitX", name: "Xenos", alliance: "Xenos" }),
}

export const teamUnitList = Object.values(
  teamUnits
) as unknown as GameCatalogCharacterView[]

/** Kill points 30; Melee 20, Min 5 Hits 25, No Resilient 15; Xenos are not allowed. */
export const teamLane = {
  killPoints: 30,
  allowedUnitsFilter: [{ kind: "Alliance", target: "Xenos", exclude: true }],
  unitsRestrictions: [
    {
      index: 0,
      name: "Melee",
      points: 20,
      filter: { kind: "AttackType", target: "Ranged", exclude: true },
    },
    {
      index: 1,
      name: "Min 5 Hits",
      points: 25,
      filter: { kind: "MinHits", target: "5", exclude: false },
    },
    {
      index: 2,
      name: "No Resilient",
      points: 15,
      filter: { kind: "Trait", target: "Resilient", exclude: true },
    },
  ],
  battleIds: Array.from({ length: 18 }, (_, index) => `battle-${index + 1}`),
  battlesPoints: Array.from({ length: 18 }, () => 100),
  availableUnitIds: Object.values(teamUnits)
    .filter((entry) => entry.alliance !== "Xenos")
    .map((entry) => entry.id),
} as unknown as GameCatalogLreTrackView
