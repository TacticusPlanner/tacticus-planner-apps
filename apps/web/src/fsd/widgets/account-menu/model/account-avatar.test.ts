import { describe, expect, it } from "vitest"

import {
  getAccountAvatarColor,
  getAccountInitials,
} from "./account-avatar-model"

describe("account avatar", () => {
  it.each([
    ["Ada Lovelace", "AL"],
    ["Prince", "P"],
    ["  Jean   Luc Picard  ", "JP"],
    ["Élodie Durand", "ÉD"],
    ["", "?"],
  ])("derives initials from %j", (displayName, expected) => {
    expect(getAccountInitials(displayName)).toBe(expected)
  })

  it("always assigns the same palette color to an application account", () => {
    expect(getAccountAvatarColor("application-account-42")).toBe(
      getAccountAvatarColor("application-account-42")
    )
  })

  it("can assign different palette colors to different accounts", () => {
    const colors = new Set(
      Array.from({ length: 20 }, (_, index) =>
        getAccountAvatarColor(`application-account-${index}`)
      )
    )

    expect(colors.size).toBeGreaterThan(1)
  })
})
