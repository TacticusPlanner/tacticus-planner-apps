import { MemoryRouter } from "react-router"
import { fireEvent, render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MyGuildResponse, RegisteredGuild } from "@/entities/guild"

const getMyGuild = vi.fn()
const registerGuild = vi.fn()
const syncMyGuild = vi.fn()
const updateTacticusIntegration = vi.fn()
const applyTacticusIntegrationResult = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => true,
  useMsal: () => ({
    accounts: [{ homeAccountId: "acc-1", username: "test@example.com" }],
    instance: { getActiveAccount: () => null },
  }),
}))

vi.mock("@/entities/account", async (importOriginal) => {
  const { isTacticusUserId, tacticusUserIdProblem } =
    await importOriginal<typeof import("@/entities/account")>()
  return {
    isTacticusUserId,
    tacticusUserIdProblem,
    updateTacticusIntegration: (...args: unknown[]) =>
      updateTacticusIntegration(...args),
    applyTacticusIntegrationResult: (...args: unknown[]) =>
      applyTacticusIntegrationResult(...args),
  }
})

vi.mock("@/entities/guild/api/guild.api", () => ({
  getMyGuild: (...args: unknown[]) => getMyGuild(...args),
  registerGuild: (...args: unknown[]) => registerGuild(...args),
  syncMyGuild: (...args: unknown[]) => syncMyGuild(...args),
}))

vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {
    status: number
    issueCode?: string
    retryAfterSeconds?: number
    constructor(
      status: number,
      message: string,
      problem: { issueCode?: string; retryAfterSeconds?: number } = {}
    ) {
      super(message)
      this.status = status
      this.issueCode = problem.issueCode
      this.retryAfterSeconds = problem.retryAfterSeconds
    }
  },
}))

import { GuildAccessBoundary } from "./guild-access-boundary"

const synchronizedGuild: RegisteredGuild = {
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

const response = {
  userIdRequired: {
    state: "tacticusUserIdRequired",
    guild: null,
  } satisfies MyGuildResponse,
  unregistered: {
    state: "unregistered",
    guild: null,
  } satisfies MyGuildResponse,
  neverSynchronized: {
    state: "registered",
    guild: { ...synchronizedGuild, lastSyncSucceededAt: null },
  } satisfies MyGuildResponse,
  ready: {
    state: "registered",
    guild: synchronizedGuild,
  } satisfies MyGuildResponse,
}

function renderBoundary(showGuildManagementLink = false) {
  return render(
    <MemoryRouter>
      <GuildAccessBoundary showGuildManagementLink={showGuildManagementLink}>
        {(guild) => <div data-testid="ready-slot">{guild.name}</div>}
      </GuildAccessBoundary>
    </MemoryRouter>
  )
}

describe("GuildAccessBoundary", () => {
  beforeEach(() => {
    getMyGuild.mockReset()
    registerGuild.mockReset()
    syncMyGuild.mockReset()
    updateTacticusIntegration.mockReset()
    applyTacticusIntegrationResult.mockReset()
  })

  it("withholds content while guild access is loading", () => {
    getMyGuild.mockReturnValue(new Promise(() => {}))
    renderBoundary()

    expect(screen.getByTestId("guild-access-loading")).toBeInTheDocument()
    expect(screen.queryByTestId("ready-slot")).not.toBeInTheDocument()
  })

  it("shows a load error and retries the current-guild query", async () => {
    const { ApiError } = await import("@/shared/api")
    getMyGuild
      .mockRejectedValueOnce(new ApiError(503, "Guild service unavailable"))
      .mockResolvedValueOnce(response.unregistered)
    const user = userEvent.setup()
    renderBoundary()

    expect(await screen.findByTestId("guild-access-error")).toHaveTextContent(
      "Guild service unavailable"
    )
    await user.click(screen.getByText("guild.retry"))
    expect(await screen.findByTestId("guild-unregistered")).toBeInTheDocument()
    expect(getMyGuild).toHaveBeenCalledTimes(2)
  })

  it("refreshes access after saving the required Tacticus user id", async () => {
    getMyGuild
      .mockResolvedValueOnce(response.userIdRequired)
      .mockResolvedValueOnce(response.unregistered)
    const integration = { tacticusUserIdConfigured: true }
    updateTacticusIntegration.mockResolvedValue(integration)
    const user = userEvent.setup()
    renderBoundary()

    fireEvent.change(
      await screen.findByTestId("guild-tacticus-user-id-input"),
      {
        target: { value: "  3f2504e0-4f89-11d3-9a0c-0305e82c3301  " },
      }
    )
    await user.click(screen.getByTestId("guild-tacticus-user-id-submit"))

    expect(await screen.findByTestId("guild-unregistered")).toBeInTheDocument()
    expect(updateTacticusIntegration).toHaveBeenCalledWith(
      {
        tacticusApiKey: null,
        tacticusUserId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
      },
      expect.anything()
    )
    // The current user is patched from the response, not refetched; the guild state is refetched.
    expect(applyTacticusIntegrationResult).toHaveBeenCalledExactlyOnceWith(
      expect.anything(),
      integration
    )
    expect(getMyGuild).toHaveBeenCalledTimes(2)
  })

  it("drops a 409 tacticusUserIdInUse once the user edits the id", async () => {
    getMyGuild.mockResolvedValue(response.userIdRequired)
    const { ApiError } = await import("@/shared/api")
    updateTacticusIntegration.mockRejectedValue(
      new ApiError(409, "Already linked.", { issueCode: "tacticusUserIdInUse" })
    )
    const user = userEvent.setup()
    renderBoundary()

    const input = await screen.findByTestId("guild-tacticus-user-id-input")
    fireEvent.change(input, {
      target: { value: "3f2504e0-4f89-11d3-9a0c-0305e82c3301" },
    })
    await user.click(screen.getByTestId("guild-tacticus-user-id-submit"))
    expect(
      await screen.findByTestId("guild-tacticus-user-id-error")
    ).toHaveTextContent("tacticusUserId.inUse")

    fireEvent.change(input, {
      target: { value: "3f2504e0-4f89-11d3-9a0c-0305e82c3302" },
    })

    expect(
      screen.queryByTestId("guild-tacticus-user-id-error")
    ).not.toBeInTheDocument()
  })

  it("offers the role-unknown registration form with eligibility guidance", async () => {
    getMyGuild.mockResolvedValue(response.unregistered)
    renderBoundary()

    expect(
      await screen.findByTestId("guild-registration-form")
    ).toBeInTheDocument()
    expect(
      screen.getByText("guild.unregistered.eligibility")
    ).toBeInTheDocument()
  })

  it("keeps registration gated and shows authorization handoff with Guild management", async () => {
    const { ApiError } = await import("@/shared/api")
    getMyGuild.mockResolvedValue(response.unregistered)
    registerGuild.mockRejectedValue(
      new ApiError(403, "Only a Leader or Co-Leader may register this guild")
    )
    const user = userEvent.setup()
    renderBoundary(true)

    fireEvent.change(await screen.findByTestId("guild-api-token-input"), {
      target: { value: "guild-token" },
    })
    await user.click(screen.getByTestId("guild-register-submit"))

    expect(
      await screen.findByTestId("guild-registration-error")
    ).toHaveTextContent("Only a Leader or Co-Leader may register this guild")
    expect(screen.getByTestId("guild-registration-handoff")).toHaveTextContent(
      "guild.unregistered.handoff"
    )
    expect(
      screen.getByRole("link", { name: "guild.openManagement" })
    ).toHaveAttribute("href", "/guild")
    expect(screen.queryByTestId("ready-slot")).not.toBeInTheDocument()
  })

  it("shows the registered guild from the registration response without refetching", async () => {
    getMyGuild.mockResolvedValueOnce(response.unregistered)
    registerGuild.mockResolvedValue(synchronizedGuild)
    const user = userEvent.setup()
    renderBoundary()

    fireEvent.change(await screen.findByTestId("guild-api-token-input"), {
      target: { value: " guild-token " },
    })
    await user.click(screen.getByTestId("guild-register-submit"))

    expect(await screen.findByTestId("ready-slot")).toHaveTextContent(
      "My Guild"
    )
    expect(registerGuild).toHaveBeenCalledWith(
      { guildApiToken: "guild-token" },
      expect.anything()
    )
    expect(getMyGuild).toHaveBeenCalledTimes(1)
  })

  it("lets an authorized manager perform the first synchronization and shows its response", async () => {
    getMyGuild.mockResolvedValueOnce(response.neverSynchronized)
    syncMyGuild.mockResolvedValue(synchronizedGuild)
    const user = userEvent.setup()
    renderBoundary()

    await user.click(await screen.findByTestId("guild-access-sync-button"))

    expect(await screen.findByTestId("ready-slot")).toBeInTheDocument()
    expect(syncMyGuild).toHaveBeenCalledOnce()
    expect(getMyGuild).toHaveBeenCalledTimes(1)
  })

  it("gives a registered member Leader or Co-Leader guidance without a sync action", async () => {
    getMyGuild.mockResolvedValue({
      state: "registered",
      guild: {
        ...synchronizedGuild,
        callerRole: "Member",
        canSynchronize: false,
        lastSyncSucceededAt: null,
      },
    } satisfies MyGuildResponse)
    renderBoundary()

    expect(
      await screen.findByTestId("guild-never-synchronized")
    ).toHaveTextContent("guild.access.syncRequiredMember")
    expect(
      screen.queryByTestId("guild-access-sync-button")
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId("ready-slot")).not.toBeInTheDocument()
  })

  it("renders the consumer's ready slot only for a synchronized guild", async () => {
    getMyGuild.mockResolvedValue(response.ready)
    renderBoundary()

    expect(await screen.findByTestId("ready-slot")).toHaveTextContent(
      "My Guild"
    )
  })
})
