import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/shared/auth", () => ({
  acquireAccessToken: () => Promise.resolve("access-token"),
}))
vi.mock("@/shared/config", () => ({
  getRequiredEnvironmentValue: () => "https://api.example",
}))

import { ApiError } from "@/shared/api"
import { lastRequest } from "@/test/last-request"

import {
  isTeamLimitReached,
  isTeamNameTaken,
  staleTeam,
  staleTeamOrder,
  teamRulesBroken,
} from "../model/team-errors"
import type { Team, TeamFields } from "../model/types"
import {
  createTeam,
  deleteTeam,
  listTeams,
  reorderTeams,
  updateTeam,
} from "./team.api"

const BASE = "https://api.example/api/v1/teams"

const fields: TeamFields = {
  name: "Horde core",
  modes: ["horde"],
  characterIds: ["ultraCalgar", "ultraTitus"],
  flexStartIndex: 1,
  mowIds: [],
  mowFlexStartIndex: null,
  campaignGroupId: null,
  incursionMowIds: [],
  notes: null,
  rarityCap: null,
}

const team = (id = "t1", revision = 1): Team => ({
  ...fields,
  id,
  revision,
  position: 1,
  issues: [],
})

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

const answer = (body: unknown, status = 200) =>
  vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(() => Promise.resolve(json(body, status)))

const failure = async (call: () => Promise<unknown>) => {
  try {
    await call()
  } catch (error) {
    return error
  }
  throw new Error("expected the call to fail")
}

describe("teams API", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("lists the teams", async () => {
    const fetch = answer({ teams: [team()] })
    expect(await listTeams()).toEqual({ teams: [team()] })
    expect(await lastRequest(fetch)).toMatchObject({ method: "GET", url: BASE })
  })

  it("creates a team from its fields", async () => {
    const fetch = answer(team())
    expect(await createTeam(fields)).toEqual(team())
    expect(await lastRequest(fetch)).toMatchObject({
      method: "POST",
      url: BASE,
      body: fields,
    })
  })

  it("updates a team with the revision it was read at", async () => {
    const fetch = answer(team("t1", 4))
    await updateTeam("t1", fields, 3)
    expect(await lastRequest(fetch)).toMatchObject({
      method: "PUT",
      url: `${BASE}/t1`,
      body: { ...fields, revision: 3 },
    })
  })

  it("deletes a team", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() =>
        Promise.resolve(new Response(null, { status: 204 }))
      )
    await deleteTeam("t1")
    expect(await lastRequest(fetch)).toMatchObject({
      method: "DELETE",
      url: `${BASE}/t1`,
    })
  })

  it("saves the whole order", async () => {
    const fetch = answer({ teams: [team("t2"), team("t1")] })
    await reorderTeams(["t2", "t1"])
    expect(await lastRequest(fetch)).toMatchObject({
      method: "PUT",
      url: `${BASE}/order`,
      body: { teamIds: ["t2", "t1"] },
    })
  })

  it("reads the team as it stands from a stale update", async () => {
    answer(
      {
        status: 409,
        issueCode: "teamRevisionStale",
        current: team("t1", 7),
      },
      409
    )
    const error = await failure(() => updateTeam("t1", fields, 3))
    expect(staleTeam(error)).toEqual(team("t1", 7))
    expect(staleTeamOrder(error)).toBeNull()
  })

  it("reads the current list from a stale reorder", async () => {
    const current = { teams: [team("t1"), team("t3")] }
    answer({ status: 409, issueCode: "teamOrderStale", current }, 409)
    const error = await failure(() => reorderTeams(["t1"]))
    expect(staleTeamOrder(error)).toEqual(current)
    expect(staleTeam(error)).toBeNull()
  })

  it("reads the broken rules of a refused save in the API's order", async () => {
    answer(
      {
        status: 400,
        issueCode: "teamRulesBroken",
        rules: ["tooManyCoreMows", "nameLength"],
        errors: { rules: ["The team breaks one or more team rules."] },
      },
      400
    )
    const error = await failure(() => createTeam(fields))
    expect(teamRulesBroken(error)).toEqual(["nameLength", "tooManyCoreMows"])
  })

  it("names the other refusals", () => {
    const taken = new ApiError(400, "x", { issueCode: "teamNameTaken" })
    const limit = new ApiError(400, "x", { issueCode: "teamLimitReached" })
    expect([isTeamNameTaken(taken), isTeamLimitReached(taken)]).toEqual([
      true,
      false,
    ])
    expect([isTeamNameTaken(limit), isTeamLimitReached(limit)]).toEqual([
      false,
      true,
    ])
    expect(teamRulesBroken(taken)).toBeNull()
  })
})
