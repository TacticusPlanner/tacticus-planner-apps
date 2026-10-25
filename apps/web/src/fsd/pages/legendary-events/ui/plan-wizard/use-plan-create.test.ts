import { beforeEach, describe, expect, it, vi } from "vitest"

import type { LegendaryEventPlan } from "@/entities/legendary-event"

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
})
