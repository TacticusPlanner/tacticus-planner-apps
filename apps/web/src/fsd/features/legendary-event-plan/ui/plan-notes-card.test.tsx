import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  legendaryEventPlanQueries,
  type LegendaryEventPlan,
} from "@/entities/legendary-event"

import { PlanNotesCard } from "./plan-notes-card"

const api = vi.hoisted(() => ({ plan: vi.fn(), capture: vi.fn() }))

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}))
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent: api.capture }),
}))
vi.mock("@/entities/legendary-event", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/legendary-event")>()),
  updateLegendaryEventPlan: api.plan,
}))

const EVENT = "votanUthar"

function plan(
  revision: number,
  fields: Partial<LegendaryEventPlan> = {}
): LegendaryEventPlan {
  return {
    eventId: EVENT,
    revision,
    catalogVersion: "1",
    notes: null,
    showPaidOptions: true,
    teams: [],
    runs: [],
    annotations: [],
    ...fields,
  }
}

function setup(initial: LegendaryEventPlan) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  const queryKey = legendaryEventPlanQueries.detail(EVENT).queryKey
  queryClient.setQueryData(queryKey, initial)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  render(<PlanNotesCard eventId={EVENT} />, { wrapper })
  return {
    user: userEvent.setup(),
    cached: () => queryClient.getQueryData<LegendaryEventPlan>(queryKey)!,
  }
}

const input = () =>
  screen.getByRole<HTMLTextAreaElement>("textbox", { name: "notes.title" })
const saveButton = () => screen.getByTestId("legendary-event-notes-save")

describe("PlanNotesCard", () => {
  beforeEach(() => {
    for (const mock of Object.values(api)) mock.mockReset()
    vi.mocked(toast.error).mockReset()
  })

  it("shows the stored notes, imported from V1 or saved earlier", () => {
    setup(plan(3, { notes: "Beta last" }))
    expect(input().value).toBe("Beta last")
    expect(saveButton()).toBeDisabled()
  })

  it("saves the draft with Show paid options unchanged", async () => {
    api.plan.mockResolvedValue(plan(4, { notes: "Alpha first" }))
    const { user, cached } = setup(plan(3))

    await user.type(input(), "Alpha first")
    expect(screen.getByText(/notes\.unsaved/)).toBeInTheDocument()
    await user.click(saveButton())

    expect(api.plan).toHaveBeenCalledWith(EVENT, {
      expectedRevision: 3,
      notes: "Alpha first",
      showPaidOptions: true,
    })
    expect(cached().notes).toBe("Alpha first")
    expect(input().value).toBe("Alpha first")
    expect(saveButton()).toBeDisabled()
    expect(api.capture).toHaveBeenCalledWith({
      type: "legendary_event_notes_saved",
      eventId: EVENT,
      length: 11,
    })
  })

  it("clears the notes when the draft is blank", async () => {
    api.plan.mockResolvedValue(plan(4))
    const { user } = setup(plan(3, { notes: "Beta last" }))

    await user.clear(input())
    await user.type(input(), "   ")
    await user.click(saveButton())

    expect(api.plan).toHaveBeenCalledWith(
      EVENT,
      expect.objectContaining({ notes: null })
    )
  })

  it("discards the draft back to the stored notes", async () => {
    const { user } = setup(plan(3, { notes: "Beta last" }))

    await user.type(input(), " and Gamma")
    await user.click(screen.getByTestId("legendary-event-notes-discard"))

    expect(input().value).toBe("Beta last")
    expect(api.plan).not.toHaveBeenCalled()
  })

  it("keeps the draft and rolls back the plan when the save fails", async () => {
    api.plan.mockRejectedValue(new Error("boom"))
    const { user, cached } = setup(plan(3, { notes: "Beta last" }))

    await user.type(input(), "!")
    await user.click(saveButton())

    expect(toast.error).toHaveBeenCalledWith("notes.toasts.error")
    expect(cached().notes).toBe("Beta last")
    expect(input().value).toBe("Beta last!")
    expect(saveButton()).toBeEnabled()
  })
})
