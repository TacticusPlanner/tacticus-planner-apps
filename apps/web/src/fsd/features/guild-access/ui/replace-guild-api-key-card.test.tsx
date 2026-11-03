import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { RegisteredGuild } from "@/entities/guild"

const registerGuild = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@/entities/guild/api/guild.api", () => ({
  registerGuild: (...args: unknown[]) => registerGuild(...args),
}))

vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  },
}))

import { ApiError } from "@/shared/api"

import { ReplaceGuildApiKeyCard } from "./replace-guild-api-key-card"

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

beforeEach(() => {
  registerGuild.mockReset()
})

const keyInput = () =>
  screen.getByLabelText("guild.settings.apiKey.label", { selector: "input" })
const replaceButton = () =>
  screen.getByRole("button", { name: "guild.settings.apiKey.replace" })

describe("ReplaceGuildApiKeyCard", () => {
  it("re-registers the guild with the new key and hands back the updated guild", async () => {
    const updated = { ...guild, level: 6 }
    registerGuild.mockResolvedValue(updated)
    const onReplaced = vi.fn()
    render(<ReplaceGuildApiKeyCard guild={guild} onReplaced={onReplaced} />)

    expect(replaceButton()).toBeDisabled()
    await userEvent.type(keyInput(), "  new-key  ")
    await userEvent.click(replaceButton())

    expect(registerGuild.mock.calls[0]?.[0]).toEqual({
      guildApiToken: "new-key",
    })
    expect(onReplaced).toHaveBeenCalledWith(updated)
    expect(await screen.findByRole("status")).toHaveTextContent(
      "guild.settings.apiKey.replaced"
    )
    expect(keyInput()).toHaveValue("")
  })

  it("links to the Tacticus API portal", () => {
    render(<ReplaceGuildApiKeyCard guild={guild} onReplaced={vi.fn()} />)

    expect(
      screen.getByRole("link", { name: /guild\.apiKeySteps\.getKey/ })
    ).toHaveAttribute("href", "https://api.tacticusgame.com")
  })

  it("shows the API's message when Tacticus rejects the key", async () => {
    registerGuild.mockRejectedValue(new ApiError(403, "Not a Co-Leader."))
    const onReplaced = vi.fn()
    render(<ReplaceGuildApiKeyCard guild={guild} onReplaced={onReplaced} />)

    await userEvent.type(keyInput(), "bad-key")
    await userEvent.click(replaceButton())

    expect(await screen.findByText("Not a Co-Leader.")).toBeInTheDocument()
    expect(onReplaced).not.toHaveBeenCalled()
  })

  it("tells members only a Leader or Co-Leader can replace the key", () => {
    render(
      <ReplaceGuildApiKeyCard
        guild={{ ...guild, callerRole: "Member", canSynchronize: false }}
        onReplaced={vi.fn()}
      />
    )

    expect(
      screen.getByText("guild.settings.apiKey.leadersOnly")
    ).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "guild.settings.apiKey.replace" })
    ).not.toBeInTheDocument()
  })
})
