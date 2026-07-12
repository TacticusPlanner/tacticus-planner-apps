import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { GuildMemberSummary } from "@/entities/guild"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}))

const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))

import { GuildMembersList } from "./guild-members-list"

const NOW = new Date("2026-07-12T12:00:00.000Z").getTime()

function member(overrides: Partial<GuildMemberSummary>): GuildMemberSummary {
  return {
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
  }
}

beforeEach(() => {
  useIsMobileMock.mockReturnValue(false)
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("GuildMembersList", () => {
  it("renders the empty state when there are no members", () => {
    render(<GuildMembersList members={[]} />)

    expect(screen.getByTestId("guild-members-empty")).toHaveTextContent(
      "guild.members.empty"
    )
  })

  it("renders 'never' for a member who has never been active in either place", () => {
    render(
      <GuildMembersList
        members={[
          member({ lastActiveInGameOn: null, lastActiveInPlannerOn: null }),
        ]}
      />
    )

    const row = screen.getByTestId("guild-member-row")
    expect(row).toHaveTextContent("guild.members.never")
  })

  // Regression test: lastActiveInGameOn is unix milliseconds straight from the Tacticus API. A stray
  // "* 1000" here would push this ~56,000 years into the future and (via the formatter's old unguarded
  // "< 60 seconds" check) silently render as "now" instead of a correct past/future relative time.
  it("renders a correct relative time for lastActiveInGameOn without misinterpreting its units", () => {
    const threeHoursAgo = NOW - 3 * 3_600_000

    render(
      <GuildMembersList
        members={[member({ lastActiveInGameOn: threeHoursAgo })]}
      />
    )

    const row = screen.getByTestId("guild-member-row")
    expect(row).toHaveTextContent("3 hours ago")
  })

  it("parses lastActiveInPlannerOn as an ISO date string", () => {
    const twoDaysAgo = new Date(NOW - 2 * 86_400_000).toISOString()

    render(
      <GuildMembersList
        members={[member({ lastActiveInPlannerOn: twoDaysAgo })]}
      />
    )

    const row = screen.getByTestId("guild-member-row")
    expect(row).toHaveTextContent("2 days ago")
  })

  it("shows linked vs not-linked status", () => {
    render(
      <GuildMembersList
        members={[
          member({ guildMemberId: "linked", isLinked: true }),
          member({ guildMemberId: "unlinked", isLinked: false }),
        ]}
      />
    )

    const rows = screen.getAllByTestId("guild-member-row")
    expect(rows[0]).toHaveTextContent("guild.members.linked")
    expect(rows[1]).toHaveTextContent("guild.members.notLinked")
  })

  it("renders the desktop table by default", () => {
    render(<GuildMembersList members={[member({})]} />)

    expect(screen.getByTestId("guild-members-table")).toBeInTheDocument()
    expect(screen.queryByTestId("guild-members-cards")).not.toBeInTheDocument()
  })

  it("renders mobile cards instead of the table when useIsMobile is true", () => {
    useIsMobileMock.mockReturnValue(true)

    render(<GuildMembersList members={[member({})]} />)

    expect(screen.getByTestId("guild-members-cards")).toBeInTheDocument()
    expect(screen.queryByTestId("guild-members-table")).not.toBeInTheDocument()
  })
})
