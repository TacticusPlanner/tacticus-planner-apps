import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"

import { accountQueries } from "../api/account.queries"
import { applyTacticusIntegrationResult } from "./apply-tacticus-integration-result"

const result = {
  profileId: "p1",
  tacticusUserIdConfigured: true,
  tacticusApiKeyConfigured: true,
  playerName: null,
  powerLevel: null,
  tacticusApiKeyMasked: "abc…xyz",
  tacticusUserIdMasked: "123…789",
}

describe("applyTacticusIntegrationResult", () => {
  it("patches the configured-key and user-id state of the cached current user", () => {
    const client = new QueryClient()
    const key = accountQueries.current().queryKey
    client.setQueryData(key, {
      applicationUserId: "u1",
      displayName: "Ana",
      hasCompletedOnboarding: false,
      tacticusApiKeyMasked: null,
      tacticusUserIdMasked: null,
    } as never)

    applyTacticusIntegrationResult(client, result)

    expect(client.getQueryData(key)).toEqual({
      applicationUserId: "u1",
      displayName: "Ana",
      hasCompletedOnboarding: true,
      tacticusApiKeyMasked: "abc…xyz",
      tacticusUserIdMasked: "123…789",
    })
  })

  it("leaves an empty cache empty", () => {
    const client = new QueryClient()

    applyTacticusIntegrationResult(client, result)

    expect(
      client.getQueryData(accountQueries.current().queryKey)
    ).toBeUndefined()
  })
})
