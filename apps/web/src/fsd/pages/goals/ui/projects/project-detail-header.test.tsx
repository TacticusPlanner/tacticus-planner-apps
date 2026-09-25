import { render, screen } from "@/test/render"
import { describe, expect, it, vi } from "vitest"

const translate = vi.fn((key: string, opts?: Record<string, unknown>) =>
  opts ? `${key}:${JSON.stringify(opts)}` : key
)

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: translate,
    i18n: { resolvedLanguage: "en" },
  }),
}))

import { ProjectDetailHeader } from "./project-detail-header"

const project = {
  projectId: "proj-a",
  name: "My Goals",
  description: null,
  color: null,
  status: "Active" as const,
  isActivePlan: true,
  isDefault: true,
  revision: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

/** Only the completion-outlook props vary; the rest are inert scaffolding for this surface. */
function renderHeader(outlook: {
  completionDate: string | null
  unestimatedGoalCount: number
}) {
  return render(
    <ProjectDetailHeader
      accountGoalTotal={undefined}
      blockedCount={1}
      goalCount={7}
      group="none"
      isMobile={false}
      mobileReorderActive={false}
      onAddGoals={vi.fn()}
      onCreateGoal={vi.fn()}
      onEdit={vi.fn()}
      onGroupChange={vi.fn()}
      onNavigateBack={vi.fn()}
      onNavigateToProject={vi.fn()}
      onStatusFilterChange={vi.fn()}
      onToggleMobileReorder={vi.fn()}
      project={project}
      projectActions={{} as never}
      projectId="proj-a"
      projects={[project]}
      reachedCount={2}
      showMobileReorderToggle={false}
      statusFilter="toReach"
      statusFilterCounts={{} as never}
      unitCount={3}
      {...outlook}
    />
  )
}

describe("ProjectDetailHeader completion outlook", () => {
  it("formats the completion date and shows no caveat when nothing is excluded", () => {
    renderHeader({ completionDate: "2026-10-11", unestimatedGoalCount: 0 })

    expect(
      screen.getByText('goals.project.completionSummary:{"date":"Oct 11"}')
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId("project-completion-excluded")
    ).not.toBeInTheDocument()
  })

  it("shows the caveat alongside a date derived from only some goals", () => {
    renderHeader({ completionDate: "2026-10-11", unestimatedGoalCount: 1 })

    expect(
      screen.getByText('goals.project.completionSummary:{"date":"Oct 11"}')
    ).toBeInTheDocument()
    expect(screen.getByTestId("project-completion-excluded")).toHaveTextContent(
      'goals.insights.completionExcluded:{"count":1}'
    )
  })

  it("shows the caveat with no date line when nothing could be estimated", () => {
    // design Decision 5: this surface carries no unknown placeholder, so the caveat alone is what
    // keeps an omitted date from reading as "no information".
    renderHeader({ completionDate: null, unestimatedGoalCount: 7 })

    expect(
      screen.queryByText(/goals\.project\.completionSummary/)
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("project-completion-excluded")).toHaveTextContent(
      'goals.insights.completionExcluded:{"count":7}'
    )
  })
})
