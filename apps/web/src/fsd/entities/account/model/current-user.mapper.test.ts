import { describe, expect, it } from "vitest"

import { isAccountSetupComplete } from "./current-user"
import {
  mapCurrentUserDtoToDomain,
  type CurrentUserDto,
} from "./current-user.mapper"

const base: CurrentUserDto = {
  applicationUserId: "user-1",
  hasCompletedOnboarding: true,
  tacticusApiKeyMasked: "abcd****",
  tacticusUserIdMasked: null,
  analyticsId: "analytics-1",
}

describe("mapCurrentUserDtoToDomain", () => {
  it("keeps a chosen name as the account's name", () => {
    const user = mapCurrentUserDtoToDomain({
      ...base,
      displayName: "Ada",
      suggestedDisplayName: null,
    })

    expect(user.displayName).toBe("Ada")
    expect(user.suggestedDisplayName).toBeNull()
    expect(isAccountSetupComplete(user)).toBe(true)
  })

  it("keeps a suggestion private with no account name", () => {
    const user = mapCurrentUserDtoToDomain({
      ...base,
      displayName: null,
      suggestedDisplayName: "ada@example.com",
    })

    expect(user.displayName).toBeNull()
    expect(user.suggestedDisplayName).toBe("ada@example.com")
    expect(isAccountSetupComplete(user)).toBe(false)
  })

  it.each([null, undefined, "   "])(
    "maps a missing suggestion (%s) to null",
    (suggestion) => {
      const user = mapCurrentUserDtoToDomain({
        ...base,
        displayName: null,
        suggestedDisplayName: suggestion,
      })

      expect(user.suggestedDisplayName).toBeNull()
    }
  )

  it.each([undefined, null, "", "   "])(
    "treats a blank name (%j) as no name",
    (displayName) => {
      const user = mapCurrentUserDtoToDomain({ ...base, displayName })

      expect(user.displayName).toBeNull()
      expect(isAccountSetupComplete(user)).toBe(false)
    }
  )

  it("is incomplete without a key even when a name is set", () => {
    const noKey = mapCurrentUserDtoToDomain({
      ...base,
      hasCompletedOnboarding: false,
      displayName: "Ada",
    })

    expect(isAccountSetupComplete(noKey)).toBe(false)
  })
})
