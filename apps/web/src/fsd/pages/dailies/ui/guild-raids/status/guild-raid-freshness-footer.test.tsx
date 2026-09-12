import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { GuildRaidFreshnessFooter } from "./guild-raid-freshness-footer"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    i18n: { language: "en" },
  }),
}))

const NOW = Date.now()

describe("GuildRaidFreshnessFooter", () => {
  it("renders the observed and guild-synced relative times", () => {
    render(
      <GuildRaidFreshnessFooter
        freshness="fresh"
        hasRefreshError={false}
        isRefreshing={false}
        lastGuildSyncSucceededAtMs={NOW - 10 * 60_000}
        observedAtMs={NOW - 5 * 60_000}
        refresh={vi.fn()}
      />
    )

    expect(screen.getByTestId("guild-raid-observed-at")).toBeInTheDocument()
    expect(screen.getByTestId("guild-raid-guild-synced-at")).toBeInTheDocument()
    expect(
      screen.queryByTestId("guild-raid-stale-warning")
    ).not.toBeInTheDocument()
  })

  it("shows the stale warning when freshness is stale", () => {
    render(
      <GuildRaidFreshnessFooter
        freshness="stale"
        hasRefreshError={false}
        isRefreshing={false}
        lastGuildSyncSucceededAtMs={NOW}
        observedAtMs={NOW}
        refresh={vi.fn()}
      />
    )

    expect(screen.getByTestId("guild-raid-stale-warning")).toBeInTheDocument()
  })

  it("surfaces a refresh error alongside the retained status", () => {
    render(
      <GuildRaidFreshnessFooter
        freshness="fresh"
        hasRefreshError={true}
        isRefreshing={false}
        lastGuildSyncSucceededAtMs={NOW}
        observedAtMs={NOW}
        refresh={vi.fn()}
      />
    )

    expect(screen.getByTestId("guild-raid-refresh-error")).toBeInTheDocument()
  })

  it("invokes the refresh action on click and disables the button while a refresh is pending", async () => {
    const refresh = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <GuildRaidFreshnessFooter
        freshness="fresh"
        hasRefreshError={false}
        isRefreshing={false}
        lastGuildSyncSucceededAtMs={NOW}
        observedAtMs={NOW}
        refresh={refresh}
      />
    )

    const button = screen.getByTestId("guild-raid-refresh")
    expect(button).toBeEnabled()
    await user.click(button)
    expect(refresh).toHaveBeenCalledTimes(1)

    rerender(
      <GuildRaidFreshnessFooter
        freshness="fresh"
        hasRefreshError={false}
        isRefreshing={true}
        lastGuildSyncSucceededAtMs={NOW}
        observedAtMs={NOW}
        refresh={refresh}
      />
    )
    expect(screen.getByTestId("guild-raid-refresh")).toBeDisabled()
  })
})
