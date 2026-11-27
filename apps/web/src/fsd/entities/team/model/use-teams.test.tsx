import { act, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({
  listTeams: vi.fn(),
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  deleteTeam: vi.fn(),
  reorderTeams: vi.fn(),
}))
vi.mock("../api/team.api", () => api)

import { ApiError } from "@/shared/api"
import { renderHook } from "@/test/render"

import type { Team, TeamFields, TeamList } from "./types"
import {
  applyTeamOrder,
  useCreateTeam,
  useDeleteTeam,
  useReorderTeams,
  useTeams,
  useUpdateTeam,
} from "./use-teams"

const fields: TeamFields = {
  name: "Team",
  modes: ["horde"],
  characterIds: ["ultraCalgar"],
  flexStartIndex: null,
  mowIds: [],
  mowFlexStartIndex: null,
  campaignGroupId: null,
  incursionMowIds: [],
  notes: null,
  rarityCap: null,
  survivalEventKey: null,
}

const team = (id: string, position: number, revision = 1): Team => ({
  ...fields,
  name: `Team ${id}`,
  id,
  position,
  revision,
  issues: [],
  survivalEventKey: null,
})

const list = (...ids: string[]): TeamList => ({
  teams: ids.map((id, index) => team(id, index + 1)),
})

const ids = (value: TeamList | undefined) =>
  value?.teams.map((entry) => `${entry.position}:${entry.id}`)

/** A promise the test settles; its `settle` is filled in by the executor. */
function deferred<T>() {
  const handle = { settle: undefined as ((value: T) => void) | undefined }
  const promise = new Promise<T>((done) => {
    handle.settle = done
  })
  return { promise, handle }
}

function setup<T>(hook: () => T) {
  return renderHook(() => ({ teams: useTeams(), action: hook() }))
}

describe("team queries", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    api.listTeams.mockResolvedValue(list("a", "b", "c"))
  })

  it("lists the teams", async () => {
    const { result } = setup(() => null)
    await waitFor(() =>
      expect(ids(result.current.teams.data)).toEqual(["1:a", "2:b", "3:c"])
    )
  })

  it("adds a created team to the list", async () => {
    api.createTeam.mockResolvedValue(team("d", 4))
    const { result } = setup(useCreateTeam)
    await waitFor(() => expect(result.current.teams.data).toBeDefined())
    // The refetch stays pending, so only the immediate cache write can show the new team.
    api.listTeams.mockReturnValue(new Promise(() => {}))
    await act(() => result.current.action.mutateAsync(fields))
    expect(api.createTeam).toHaveBeenCalledWith(fields)
    await waitFor(() => expect(ids(result.current.teams.data)).toContain("4:d"))
  })

  it("replaces an updated team, and adopts the team as it stands on a stale save", async () => {
    const { result } = setup(useUpdateTeam)
    await waitFor(() => expect(result.current.teams.data).toBeDefined())
    const renamed = { ...team("b", 2, 2), name: "Renamed" }
    api.updateTeam.mockResolvedValue(renamed)
    // The refetch stays pending, so only the immediate cache write can show the rename.
    api.listTeams.mockReturnValue(new Promise(() => {}))
    await act(() =>
      result.current.action.mutateAsync({ teamId: "b", fields, revision: 1 })
    )
    expect(api.updateTeam).toHaveBeenCalledWith("b", fields, 1)
    await waitFor(() =>
      expect(result.current.teams.data?.teams[1]?.name).toBe("Renamed")
    )

    api.listTeams.mockReturnValue(new Promise(() => {}))
    api.updateTeam.mockRejectedValue(
      new ApiError(409, "stale", {
        issueCode: "teamRevisionStale",
        current: { ...team("b", 2, 5), name: "From another device" },
      })
    )
    await act(async () => {
      await result.current.action
        .mutateAsync({ teamId: "b", fields, revision: 2 })
        .catch(() => {})
    })
    await waitFor(() =>
      expect(result.current.teams.data?.teams[1]).toMatchObject({
        name: "From another device",
        revision: 5,
      })
    )
  })

  it("removes a deleted team and closes the gap", async () => {
    api.deleteTeam.mockResolvedValue(undefined)
    const { result } = setup(useDeleteTeam)
    await waitFor(() => expect(result.current.teams.data).toBeDefined())
    api.listTeams.mockReturnValue(new Promise(() => {}))
    await act(() => result.current.action.mutateAsync("a"))
    expect(api.deleteTeam).toHaveBeenCalledWith("a")
    await waitFor(() =>
      expect(ids(result.current.teams.data)).toEqual(["1:b", "2:c"])
    )
  })

  it("shows a reorder at once and keeps the saved order", async () => {
    const save = deferred<TeamList>()
    api.reorderTeams.mockReturnValue(save.promise)
    const { result } = setup(useReorderTeams)
    await waitFor(() => expect(result.current.teams.data).toBeDefined())
    act(() => result.current.action.mutate(["c", "b", "a"]))
    await waitFor(() =>
      expect(ids(result.current.teams.data)).toEqual(["1:c", "2:b", "3:a"])
    )
    api.listTeams.mockResolvedValue(list("c", "b", "a"))
    await act(async () => save.handle.settle?.(list("c", "b", "a")))
    expect(api.reorderTeams).toHaveBeenCalledWith(["c", "b", "a"])
    await waitFor(() =>
      expect(ids(result.current.teams.data)).toEqual(["1:c", "2:b", "3:a"])
    )
  })

  it("puts the previous order back when a reorder fails", async () => {
    api.reorderTeams.mockRejectedValue(new ApiError(500, "down"))
    const { result } = setup(useReorderTeams)
    await waitFor(() => expect(result.current.teams.data).toBeDefined())
    api.listTeams.mockReturnValue(new Promise(() => {}))
    await act(async () => {
      await result.current.action.mutateAsync(["c", "b", "a"]).catch(() => {})
    })
    await waitFor(() =>
      expect(ids(result.current.teams.data)).toEqual(["1:a", "2:b", "3:c"])
    )
  })

  it("adopts the current list when a reorder is stale", async () => {
    api.reorderTeams.mockRejectedValue(
      new ApiError(409, "stale", {
        issueCode: "teamOrderStale",
        current: list("a", "b", "c", "d"),
      })
    )
    const { result } = setup(useReorderTeams)
    await waitFor(() => expect(result.current.teams.data).toBeDefined())
    api.listTeams.mockReturnValue(new Promise(() => {}))
    await act(async () => {
      await result.current.action.mutateAsync(["c", "b", "a"]).catch(() => {})
    })
    await waitFor(() =>
      expect(ids(result.current.teams.data)).toEqual([
        "1:a",
        "2:b",
        "3:c",
        "4:d",
      ])
    )
  })
})

describe("applyTeamOrder", () => {
  it("orders and renumbers, keeping unlisted teams after", () => {
    expect(ids(applyTeamOrder(list("a", "b", "c"), ["c", "a"]))).toEqual([
      "1:c",
      "2:a",
      "3:b",
    ])
  })
})
