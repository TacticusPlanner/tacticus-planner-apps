import { render, screen } from "@/test/render"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { GuildRaidExactReadinessQuery } from "@/entities/guild-raid-meta"

import type { GuildRaidsViewModel } from "./guild-raid-status-view-model"

const register = vi.fn()
const useIsMobile = vi.fn(() => false)

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobile(),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))
vi.mock("@/features/guild-access", () => ({
  GuildAccessBoundary: ({
    children,
  }: {
    children: (guild: { name: string }) => React.ReactNode
  }) => children({ name: "My Guild" }),
}))

const loadingViewModel: GuildRaidsViewModel = {
  status: { kind: "loading" },
  resources: { kind: "unavailable" },
  refresh: vi.fn(),
  isRefreshing: false,
  hasRefreshError: false,
}
let viewModel: GuildRaidsViewModel = loadingViewModel
vi.mock("./use-guild-raids-view-model", () => ({
  useGuildRaidsViewModel: () => viewModel,
}))

const useGuildRaidExactReadiness =
  vi.fn<
    (bossUnitSetId: string, threshold: unknown) => GuildRaidExactReadinessQuery
  >()
vi.mock("@/entities/guild-raid-meta", () => ({
  useGuildRaidExactReadiness: (bossUnitSetId: string, threshold: unknown) =>
    useGuildRaidExactReadiness(bossUnitSetId, threshold),
}))

// The real hook composes three data sources (catalog + raid-bosses + roster) from local reads — out of
// scope for this page-shell test, which only exercises section placement. Its own composition/fallback
// logic is covered directly in use-guild-raid-investment-readiness's own tests.
const useGuildRaidReadinessThreshold = vi.fn((): unknown => null)
vi.mock("./exact-meta/use-guild-raid-readiness-threshold", () => ({
  useGuildRaidReadinessThreshold: () => useGuildRaidReadinessThreshold(),
}))

import { GuildRaidsPage } from "./guild-raids-page"

const NOW = Date.now()

function activeViewModel(): GuildRaidsViewModel {
  return {
    status: {
      kind: "active",
      freshness: "fresh",
      observedAtMs: NOW,
      lastGuildSyncSucceededAtMs: NOW,
      catalogWarning: false,
      season: {
        seasonNumber: 1,
        tierNumber: 1,
        setNumber: 1,
        setCount: 1,
        difficulty: "Common",
        endsAt: { kind: "unavailable" },
        boss: {
          unitSetId: "boss",
          name: "Boss",
          portraitSrc: undefined,
          remainingHp: 1,
          maximumHp: 1,
          isUpcoming: false,
          progressionIndex: 1,
        },
        primes: [],
      },
    },
    resources: { kind: "unavailable" },
    refresh: vi.fn(),
    isRefreshing: false,
    hasRefreshError: false,
  }
}

describe("GuildRaidsPage", () => {
  beforeEach(() => {
    register.mockClear()
    useIsMobile.mockReturnValue(false)
    viewModel = loadingViewModel
    useGuildRaidExactReadiness.mockClear()
    useGuildRaidExactReadiness.mockReturnValue({ status: "absentMeta" })
    useGuildRaidReadinessThreshold.mockClear()
    useGuildRaidReadinessThreshold.mockReturnValue(null)
  })

  it.each([
    ["desktop", false, "guild-raids-desktop-shell"],
    ["mobile", true, "guild-raids-mobile-shell"],
  ] as const)(
    "renders a valid %s tutorial target set",
    (_name, mobile, shell) => {
      useIsMobile.mockReturnValue(mobile)
      viewModel = activeViewModel()
      render(<GuildRaidsPage />)

      const steps = register.mock.lastCall?.[0] as {
        desktop: { target: string }[]
        mobile: { target: string }[]
      }
      const selected = mobile ? steps.mobile : steps.desktop

      expect(screen.getByTestId(shell)).toBeInTheDocument()
      for (const step of selected) {
        expect(document.querySelector(step.target)).not.toBeNull()
      }
    }
  )

  it("renders the status section and the resources card once guild access is ready", () => {
    render(<GuildRaidsPage />)

    expect(screen.getByTestId("guild-raid-status-section")).toBeInTheDocument()
    expect(screen.getByTestId("guild-raid-resources-card")).toBeInTheDocument()
    expect(screen.queryByTestId("guild-summary")).not.toBeInTheDocument()
    expect(screen.queryByTestId("guild-sync-button")).not.toBeInTheDocument()
    expect(screen.queryByTestId("guild-purge-open")).not.toBeInTheDocument()
  })

  it("places the freshness footer and resources card before the status section", () => {
    viewModel = activeViewModel()
    render(<GuildRaidsPage />)

    const observedAt = screen.getByTestId("guild-raid-observed-at")
    const resources = screen.getByTestId("guild-raid-resources-card")
    const statusSection = screen.getByTestId("guild-raid-status-section")

    expect(
      observedAt.compareDocumentPosition(resources) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      resources.compareDocumentPosition(statusSection) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("does not render the freshness footer while there is no observation yet", () => {
    viewModel = loadingViewModel
    render(<GuildRaidsPage />)

    expect(
      screen.queryByTestId("guild-raid-observed-at")
    ).not.toBeInTheDocument()
  })

  it("does not render the exact-Meta section when there is no active boss", () => {
    viewModel = loadingViewModel
    render(<GuildRaidsPage />)

    expect(
      screen.queryByTestId("guild-raid-exact-meta-section")
    ).not.toBeInTheDocument()
  })

  it("renders the exact-Meta section for the active boss, below the status section", () => {
    viewModel = activeViewModel()
    render(<GuildRaidsPage />)

    expect(useGuildRaidExactReadiness).toHaveBeenLastCalledWith("boss", null)
    const statusSection = screen.getByTestId("guild-raid-status-section")
    const exactMetaSection = screen.getByTestId("guild-raid-exact-meta-section")
    expect(
      statusSection.compareDocumentPosition(exactMetaSection) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("passes the live threshold through and shows no percentage without one", () => {
    viewModel = activeViewModel()
    useGuildRaidExactReadiness.mockReturnValue({
      status: "populated",
      source: { sourceId: "source", name: "Source" },
      updatedOn: "2026-07-01",
      threshold: null,
      recommendations: [
        {
          id: "rec-1",
          kind: { id: "meta", label: "Meta" },
          efficiency: 1,
          comps: [],
          status: "substitutes",
          slots: [
            {
              kind: "hero",
              role: { id: "signature", label: "Signature" },
              essential: true,
              ideal: { id: "heroA", name: "Hero A", kind: "character" },
              picked: { id: "heroA", name: "Hero A", kind: "character" },
              isSubstitute: false,
              options: [],
            },
          ],
        },
      ],
    })

    render(<GuildRaidsPage />)

    expect(
      screen.getByTestId("guild-raid-exact-meta-status")
    ).toHaveTextContent("guildRaids.exactMeta.status.substitutes")
    expect(
      screen.getByTestId("guild-raid-exact-meta-no-target")
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId("guild-raid-exact-meta-team-readiness")
    ).not.toBeInTheDocument()

    const threshold = { requiredAbilityLevel: 50 }
    useGuildRaidReadinessThreshold.mockReturnValue(threshold)
    render(<GuildRaidsPage />)
    expect(useGuildRaidExactReadiness).toHaveBeenLastCalledWith(
      "boss",
      threshold
    )
  })
})
