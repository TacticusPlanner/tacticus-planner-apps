import type { ComponentProps } from "react"
import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  createMemoryRouter,
  RouterProvider,
  useOutletContext,
} from "react-router"

import type { GuildMemberSummary, RegisteredGuild } from "@/entities/guild"

const syncMyGuild = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    i18n: { language: "en" },
  }),
}))

const { mockAccounts, mockInstance } = vi.hoisted(() => {
  const account = { homeAccountId: "acc-1", username: "test@example.com" }
  return {
    mockAccounts: [account],
    mockInstance: { getActiveAccount: () => account },
  }
})

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ accounts: mockAccounts, instance: mockInstance }),
}))

vi.mock("@/entities/guild", () => ({
  syncMyGuild: (...args: unknown[]) => syncMyGuild(...args),
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

vi.mock("@/shared/lib", () => ({
  formatRelativeTime: () => "3 hours ago",
}))

vi.mock("./guild-purge-dialog", () => ({
  GuildPurgeDialog: ({ open }: { open: boolean }) => (
    <div data-testid="mock-purge-dialog" data-open={open} />
  ),
}))

import { GuildRegisteredView } from "./guild-registered-view"

beforeEach(() => {
  syncMyGuild.mockReset()
})

const member = (
  overrides: Partial<GuildMemberSummary> = {}
): GuildMemberSummary => ({
  guildMemberId: "member-1",
  maskedTacticusUserId: "••••••••1234",
  linkedPlayerName: null,
  isLinked: false,
  role: "Member",
  level: 10,
  lastActiveInGameOn: null,
  lastActiveInPlannerOn: null,
  displayLabel: "••••••••1234",
  ...overrides,
})

const baseGuild: RegisteredGuild = {
  guildId: "guild-1",
  tacticusGuildId: "tacticus-guild-1",
  tag: "TAG",
  name: "My Guild",
  level: 5,
  lastSyncSucceededAt: "2026-07-12T09:00:00.000Z",
  callerRole: "Leader",
  canSynchronize: true,
  members: [member()],
}

function MembersProbe() {
  const members = useOutletContext<GuildMemberSummary[]>()
  return <div data-testid="members-probe">{members.length} member(s)</div>
}

function renderView(
  props: Partial<ComponentProps<typeof GuildRegisteredView>> = {},
  initialPath = "/guild/members"
) {
  const router = createMemoryRouter(
    [
      {
        path: "/guild",
        element: (
          <GuildRegisteredView
            guild={baseGuild}
            onPurged={vi.fn()}
            onSynced={vi.fn()}
            {...props}
          />
        ),
        children: [{ path: "members", element: <MembersProbe /> }],
      },
    ],
    { initialEntries: [initialPath] }
  )
  return { ...render(<RouterProvider router={router} />), router }
}

describe("GuildRegisteredView", () => {
  it("renders the guild summary and passes members to the routed outlet", () => {
    renderView()

    expect(screen.getByTestId("guild-summary")).toHaveTextContent("My Guild")
    expect(screen.getByTestId("guild-summary")).toHaveTextContent("TAG")
    expect(screen.getByTestId("members-probe")).toHaveTextContent("1 member(s)")
  })

  it("shows the sync and delete-guild buttons when canSynchronize is true", () => {
    renderView({ guild: { ...baseGuild, canSynchronize: true } })

    expect(screen.getByTestId("guild-sync-button")).toBeInTheDocument()
    expect(screen.getByTestId("guild-purge-open")).toBeInTheDocument()
  })

  it("hides the sync and delete-guild buttons when canSynchronize is false", () => {
    renderView({
      guild: { ...baseGuild, canSynchronize: false, callerRole: "Member" },
    })

    expect(screen.queryByTestId("guild-sync-button")).not.toBeInTheDocument()
    expect(screen.queryByTestId("guild-purge-open")).not.toBeInTheDocument()
  })

  it("syncs the guild and calls onSynced on success", async () => {
    syncMyGuild.mockResolvedValue(undefined)
    const onSynced = vi.fn()
    const user = userEvent.setup()

    renderView({ onSynced })

    await user.click(screen.getByTestId("guild-sync-button"))

    await vi.waitFor(() => {
      expect(onSynced).toHaveBeenCalledTimes(1)
    })
    expect(syncMyGuild).toHaveBeenCalledOnce()
  })

  it("shows an ApiError's message when sync fails", async () => {
    const { ApiError } = await import("@/shared/api")
    syncMyGuild.mockRejectedValue(
      new ApiError(403, "Only the Leader can sync.")
    )
    const user = userEvent.setup()

    renderView()

    await user.click(screen.getByTestId("guild-sync-button"))

    expect(await screen.findByTestId("guild-sync-error")).toHaveTextContent(
      "Only the Leader can sync."
    )
  })

  it("opens the purge dialog when the delete-guild button is clicked", async () => {
    const user = userEvent.setup()
    renderView()

    expect(screen.getByTestId("mock-purge-dialog")).toHaveAttribute(
      "data-open",
      "false"
    )

    await user.click(screen.getByTestId("guild-purge-open"))

    expect(screen.getByTestId("mock-purge-dialog")).toHaveAttribute(
      "data-open",
      "true"
    )
  })
})
