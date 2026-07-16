import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MyGuildResponse } from "@/entities/guild"

const getMyGuild = vi.fn()

beforeEach(() => {
  getMyGuild.mockReset()
})

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
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
  getMyGuild: (...args: unknown[]) => getMyGuild(...args),
  guildQueries: {
    current: (accountId: string) => ({
      queryKey: ["account", accountId, "guild", "current"],
      queryFn: () => getMyGuild(),
    }),
  },
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

vi.mock("./guild-tacticus-user-id-card", () => ({
  GuildTacticusUserIdCard: () => (
    <div data-testid="mock-tacticus-user-id-card" />
  ),
}))

vi.mock("./guild-registration-form", () => ({
  GuildRegistrationForm: () => <div data-testid="mock-registration-form" />,
}))

vi.mock("./guild-registered-view", () => ({
  GuildRegisteredView: ({ guild }: { guild: { name: string } }) => (
    <div data-testid="mock-registered-view">{guild.name}</div>
  ),
}))

import { GuildPage } from "./guild-page"

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe("GuildPage", () => {
  it("shows a loading skeleton while the initial fetch is pending", () => {
    getMyGuild.mockReturnValue(new Promise(() => {}))

    render(<GuildPage />)

    expect(screen.getByTestId("guild-page-loading")).toBeInTheDocument()
  })

  it("renders the Tacticus-user-id card for the tacticusUserIdRequired state", async () => {
    getMyGuild.mockResolvedValue({
      state: "tacticusUserIdRequired",
      guild: null,
    } satisfies MyGuildResponse)

    render(<GuildPage />)

    expect(
      await screen.findByTestId("mock-tacticus-user-id-card")
    ).toBeInTheDocument()
    expect(screen.queryByTestId("guild-page-loading")).not.toBeInTheDocument()
  })

  it("renders the registration form for the unregistered state", async () => {
    getMyGuild.mockResolvedValue({
      state: "unregistered",
      guild: null,
    } satisfies MyGuildResponse)

    render(<GuildPage />)

    expect(
      await screen.findByTestId("mock-registration-form")
    ).toBeInTheDocument()
  })

  it("renders the registered view for the registered state", async () => {
    getMyGuild.mockResolvedValue({
      state: "registered",
      guild: { name: "My Guild" },
    } as unknown as MyGuildResponse)

    render(<GuildPage />)

    const view = await screen.findByTestId("mock-registered-view")
    expect(view).toHaveTextContent("My Guild")
  })

  it("shows an error message and retries the fetch when the retry button is clicked", async () => {
    const { ApiError } = await import("@/shared/api")
    const user = userEvent.setup()

    const first = deferred<MyGuildResponse>()
    getMyGuild.mockReturnValueOnce(first.promise)

    render(<GuildPage />)

    first.reject(new ApiError(400, "Something went wrong"))
    expect(await screen.findByTestId("guild-page-error")).toHaveTextContent(
      "Something went wrong"
    )

    getMyGuild.mockResolvedValueOnce({
      state: "unregistered",
      guild: null,
    } satisfies MyGuildResponse)

    await user.click(screen.getByText("guild.retry"))

    expect(
      await screen.findByTestId("mock-registration-form")
    ).toBeInTheDocument()
    expect(getMyGuild).toHaveBeenCalledTimes(2)
  })
})
