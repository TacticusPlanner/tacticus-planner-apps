import { render, screen } from "@/test/render"
import { describe, expect, it, vi } from "vitest"

import type { RegisteredGuild } from "@/entities/guild"

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

vi.mock("@/features/guild-access", () => ({
  GuildAccessBoundary: ({
    children,
  }: {
    children: (guild: RegisteredGuild, refresh: () => void) => React.ReactNode
  }) => children(guild, vi.fn()),
}))

vi.mock("./guild-registered-view", () => ({
  GuildRegisteredView: ({ guild }: { guild: RegisteredGuild }) => (
    <div data-testid="mock-registered-view">{guild.name}</div>
  ),
}))

import { GuildPage } from "./guild-page"

describe("GuildPage", () => {
  it("renders the management experience through the shared ready slot", () => {
    render(<GuildPage />)

    expect(screen.getByTestId("guild-page")).toBeInTheDocument()
    expect(screen.getByTestId("mock-registered-view")).toHaveTextContent(
      "My Guild"
    )
  })
})
