import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  MAX_TEAMS_PER_LANE,
  type LegendaryEventPlan,
} from "@/entities/legendary-event"

import type { DraftTeam } from "./plan-teams"
import { EMPTY_PLAN } from "./plan.fixtures"
import { writeLane } from "./use-plan-create"

const api = vi.hoisted(() => ({
  createLegendaryEventTeam: vi.fn(),
  deleteLegendaryEventTeam: vi.fn(),
  updateLegendaryEventTeam: vi.fn(),
}))
vi.mock("@/entities/legendary-event", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/legendary-event")>()),
  ...api,
}))

const STORED = {
  id: "melee",
  laneId: "alpha" as const,
  name: "Melee",
  sortOrder: 0,
  memberUnitIds: ["a", "b", "c"],
  reserveUnitId: null,
  objectiveIndexes: [0],
  runDepths: [],
}
const PLAN: LegendaryEventPlan = { ...EMPTY_PLAN, revision: 3, teams: [STORED] }

const draft = (overrides: Partial<DraftTeam>): DraftTeam => ({
  key: "melee",
  laneId: "alpha",
  storedId: "melee",
  name: "Melee",
  memberUnitIds: ["a", "b", "d"],
  reserveUnitId: null,
  objectiveIndexes: [0],
  depthByRun: {},
  edited: true,
  ...overrides,
})

const nameOf = (team: DraftTeam) => team.name || "Team"

describe("writeLane", () => {
  beforeEach(() => {
    for (const call of Object.values(api)) call.mockReset()
    api.updateLegendaryEventTeam.mockImplementation(
      (
        _eventId: string,
        teamId: string,
        request: { memberUnitIds: string[] }
      ) =>
        Promise.resolve({
          ...PLAN,
          revision: 4,
          teams: [
            { ...STORED, id: teamId, memberUnitIds: request.memberUnitIds },
          ],
        })
    )
    api.createLegendaryEventTeam.mockImplementation(() =>
      Promise.resolve({ ...PLAN, revision: 5 })
    )
  })

  it("sends an edited stored team as one update on the current revision", async () => {
    const edited = draft({})
    await writeLane(
      "uthar",
      PLAN,
      { laneId: "alpha", remove: [], update: [edited], create: [] },
      [2, 3],
      nameOf
    )
    expect(api.deleteLegendaryEventTeam).not.toHaveBeenCalled()
    expect(api.createLegendaryEventTeam).not.toHaveBeenCalled()
    expect(api.updateLegendaryEventTeam).toHaveBeenCalledWith(
      "uthar",
      "melee",
      expect.objectContaining({
        expectedRevision: 3,
        memberUnitIds: ["a", "b", "d"],
        run: 2,
      })
    )
  })

  it("skips an update an earlier attempt already applied", async () => {
    const applied = {
      ...PLAN,
      teams: [{ ...STORED, memberUnitIds: ["a", "b", "d"] }],
    }
    await writeLane(
      "uthar",
      applied,
      { laneId: "alpha", remove: [], update: [draft({})], create: [] },
      [2, 3],
      nameOf
    )
    expect(api.updateLegendaryEventTeam).not.toHaveBeenCalled()
  })

  it("creates an added team after the updates", async () => {
    const added = draft({
      key: "added:1",
      storedId: null,
      name: "Mine",
      memberUnitIds: ["x", "y", "z"],
      edited: false,
    })
    await writeLane(
      "uthar",
      PLAN,
      { laneId: "alpha", remove: [], update: [draft({})], create: [added] },
      [2, 3],
      nameOf
    )
    expect(api.createLegendaryEventTeam).toHaveBeenCalledWith(
      "uthar",
      expect.objectContaining({
        name: "Mine",
        memberUnitIds: ["x", "y", "z"],
        expectedRevision: 4,
      })
    )
  })

  it("saves the depth set in the wizard as the manual depth of every plan run", async () => {
    api.updateLegendaryEventTeam.mockImplementation(
      (
        _eventId: string,
        teamId: string,
        request: {
          memberUnitIds: string[]
          run: 2 | 3
          expectedBattleClears: number | null
          expectedBattleClearsSource: "manual" | null
          expectedRevision: number
        }
      ) =>
        Promise.resolve({
          ...PLAN,
          revision: request.expectedRevision + 1,
          teams: [
            {
              ...STORED,
              id: teamId,
              memberUnitIds: request.memberUnitIds,
              runDepths:
                request.expectedBattleClears === null
                  ? []
                  : [
                      {
                        run: request.run,
                        expectedBattleClears: request.expectedBattleClears,
                        expectedBattleClearsSource:
                          request.expectedBattleClearsSource,
                        recordedAt: "",
                      },
                    ],
            },
          ],
        })
    )
    await writeLane(
      "uthar",
      PLAN,
      {
        laneId: "alpha",
        remove: [],
        update: [draft({ depthOverride: 2 })],
        create: [],
      },
      [2, 3],
      nameOf
    )
    const calls = api.updateLegendaryEventTeam.mock.calls.map(
      (call) => call[2] as Record<string, unknown>
    )
    expect(calls).toEqual([
      expect.objectContaining({
        memberUnitIds: ["a", "b", "d"],
        run: 2,
        expectedBattleClears: 2,
        expectedBattleClearsSource: "manual",
        expectedRevision: 3,
      }),
      expect.objectContaining({
        run: 3,
        expectedBattleClears: 2,
        expectedBattleClearsSource: "manual",
        expectedRevision: 4,
      }),
    ])
  })

  it("writes only the depth of a stored team whose members are unchanged", async () => {
    await writeLane(
      "uthar",
      PLAN,
      {
        laneId: "alpha",
        remove: [],
        update: [draft({ memberUnitIds: ["a", "b", "c"], depthOverride: 1 })],
        create: [],
      },
      [2],
      nameOf
    )
    expect(api.updateLegendaryEventTeam).toHaveBeenCalledTimes(1)
    expect(api.updateLegendaryEventTeam).toHaveBeenCalledWith(
      "uthar",
      "melee",
      expect.objectContaining({
        memberUnitIds: ["a", "b", "c"],
        run: 2,
        expectedBattleClears: 1,
        expectedBattleClearsSource: "manual",
      })
    )
  })

  it("creates a team with the depth set in the wizard", async () => {
    const added = draft({
      key: "added:1",
      storedId: null,
      memberUnitIds: ["x", "y", "z"],
      depthOverride: 3,
    })
    await writeLane(
      "uthar",
      PLAN,
      { laneId: "alpha", remove: [], update: [], create: [added] },
      [2],
      nameOf
    )
    expect(api.createLegendaryEventTeam).toHaveBeenCalledWith(
      "uthar",
      expect.objectContaining({
        run: 2,
        expectedBattleClears: 3,
        expectedBattleClearsSource: "manual",
      })
    )
  })

  it("refuses a new team for a full lane without sending it", async () => {
    const full = {
      ...PLAN,
      teams: Array.from({ length: MAX_TEAMS_PER_LANE }, (_, index) => ({
        ...STORED,
        id: `team-${index}`,
        sortOrder: index,
        memberUnitIds: [`u${index}`],
      })),
    }
    const added = draft({
      key: "added:1",
      storedId: null,
      memberUnitIds: ["x", "y", "z"],
    })

    await expect(
      writeLane(
        "uthar",
        full,
        { laneId: "alpha", remove: [], update: [], create: [added] },
        [2],
        nameOf
      )
    ).rejects.toMatchObject({ issueCode: "legendaryEventTeamLimitReached" })
    expect(api.createLegendaryEventTeam).not.toHaveBeenCalled()
  })
})
