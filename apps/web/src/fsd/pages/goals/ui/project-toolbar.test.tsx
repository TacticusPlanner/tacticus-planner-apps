import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
  }),
}))

const account = { homeAccountId: "acc-1", username: "test@example.com" }

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    accounts: [account],
    instance: { getActiveAccount: () => account },
  }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const activateProject = vi.fn()
const updateProjectGoalsStatus = vi.fn()

vi.mock("@/entities/project", () => ({
  activateProject: (...args: unknown[]) => activateProject(...args),
  updateProjectGoalsStatus: (...args: unknown[]) =>
    updateProjectGoalsStatus(...args),
}))

vi.mock("@/shared/api", () => ({ ApiError: class ApiError extends Error {} }))

import type { ProjectSummary } from "@/entities/project"

import { useProjectActions } from "../model/use-project-actions"
import { ProjectToolbar } from "./project-toolbar"

const inactiveProject: ProjectSummary = {
  projectId: "proj-1",
  name: "Event Prep",
  description: null,
  color: null,
  status: "Active",
  isActivePlan: false,
  isDefault: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

function Harness({ onChanged }: { onChanged: () => void }) {
  const projectActions = useProjectActions(onChanged)
  return (
    <ProjectToolbar
      onProjectIdChange={() => {}}
      projectActions={projectActions}
      projectId="proj-1"
      projects={[inactiveProject]}
    />
  )
}

describe("ProjectToolbar", () => {
  beforeEach(() => {
    activateProject.mockReset()
    updateProjectGoalsStatus.mockReset()
  })

  it("activates the selected project as the active plan", async () => {
    activateProject.mockResolvedValue({})
    const onChanged = vi.fn()
    render(<Harness onChanged={onChanged} />)

    fireEvent.click(screen.getByTestId("goals-project-set-active"))

    await vi.waitFor(() => {
      expect(activateProject).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "proj-1"
      )
    })
    expect(onChanged).toHaveBeenCalled()
  })

  it("bulk-pauses the project's goals", async () => {
    updateProjectGoalsStatus.mockResolvedValue({ goalsTransitioned: 2 })
    const onChanged = vi.fn()
    render(<Harness onChanged={onChanged} />)

    fireEvent.click(screen.getByTestId("goals-project-pause-all"))

    await vi.waitFor(() => {
      expect(updateProjectGoalsStatus).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "proj-1",
        "Paused"
      )
    })
    expect(onChanged).toHaveBeenCalled()
  })

  it("bulk-resumes the project's goals", async () => {
    updateProjectGoalsStatus.mockResolvedValue({ goalsTransitioned: 2 })
    const onChanged = vi.fn()
    render(<Harness onChanged={onChanged} />)

    fireEvent.click(screen.getByTestId("goals-project-resume-all"))

    await vi.waitFor(() => {
      expect(updateProjectGoalsStatus).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "proj-1",
        "Active"
      )
    })
  })
})
