import { describe, expect, it } from "vitest"

import type { MyGuildResponse, RegisteredGuild } from "@/entities/guild"

import { resolveGuildAccess } from "./guild-access"

const guild: RegisteredGuild = {
  guildId: "guild-1",
  tacticusGuildId: "tacticus-guild-1",
  tag: "TAG",
  name: "My Guild",
  level: 5,
  lastSyncSucceededAt: "2026-09-11T10:00:00.000Z",
  callerRole: "Leader",
  canSynchronize: true,
  members: [],
}

function resolved(data: MyGuildResponse) {
  return { data, error: null, isError: false, isPending: false }
}

describe("resolveGuildAccess", () => {
  it("resolves loading", () => {
    expect(
      resolveGuildAccess({
        data: undefined,
        error: null,
        isError: false,
        isPending: true,
      })
    ).toEqual({ status: "loading" })
  })

  it("resolves load failure", () => {
    const error = new Error("offline")
    expect(
      resolveGuildAccess({
        data: undefined,
        error,
        isError: true,
        isPending: false,
      })
    ).toEqual({ status: "error", error })
  })

  it.each([
    [
      "Tacticus user id required",
      { state: "tacticusUserIdRequired", guild: null },
      "tacticus-user-id-required",
    ],
    ["unregistered", { state: "unregistered", guild: null }, "unregistered"],
  ] as const)("resolves %s", (_name, data, status) => {
    expect(resolveGuildAccess(resolved(data))).toEqual({ status })
  })

  it("resolves a registered guild without a successful sync as never synchronized", () => {
    expect(
      resolveGuildAccess(
        resolved({
          state: "registered",
          guild: { ...guild, lastSyncSucceededAt: null },
        })
      )
    ).toMatchObject({
      status: "never-synchronized",
      guild: { name: "My Guild" },
    })
  })

  it("resolves a synchronized guild as ready", () => {
    expect(
      resolveGuildAccess(resolved({ state: "registered", guild }))
    ).toEqual({
      status: "ready",
      guild,
    })
  })
})
