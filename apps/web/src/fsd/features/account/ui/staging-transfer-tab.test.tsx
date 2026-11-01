import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const createStagingTransferCode = vi.fn()
const importFromProduction = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}))

vi.mock("@/entities/account", () => ({
  createStagingTransferCode: () => createStagingTransferCode(),
  importFromProduction: (code: string) => importFromProduction(code),
}))

vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {
    constructor(_status: number, message: string) {
      super(message)
    }
  },
}))

import { StagingTransferTab } from "./staging-transfer-tab"

describe("StagingTransferTab", () => {
  beforeEach(() => {
    createStagingTransferCode.mockReset()
    importFromProduction.mockReset()
  })

  it("creates a code in production and shows it to copy", async () => {
    createStagingTransferCode.mockResolvedValue({
      code: "TP1-abc",
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    })
    const user = userEvent.setup()
    render(<StagingTransferTab mode="export" />)

    await user.click(screen.getByTestId("manage-account-staging-create"))

    expect(
      await screen.findByTestId("manage-account-staging-code")
    ).toHaveValue("TP1-abc")
    expect(createStagingTransferCode).toHaveBeenCalledOnce()
  })

  it("imports on staging only after the replacement is confirmed", async () => {
    importFromProduction.mockResolvedValue({
      goals: 3,
      projects: 2,
      legendaryEventPlans: 1,
      legendaryEventRunRecords: 0,
      settings: true,
      overrides: false,
    })
    const user = userEvent.setup()
    render(<StagingTransferTab mode="import" />)
    const submit = screen.getByTestId("manage-account-staging-import-submit")

    await user.type(
      screen.getByTestId("manage-account-staging-import-code"),
      "  TP1-abc "
    )
    expect(submit).toBeDisabled()

    await user.click(screen.getByTestId("manage-account-staging-confirm"))
    await user.click(submit)

    expect(importFromProduction).toHaveBeenCalledWith("TP1-abc")
    expect(
      await screen.findByTestId("manage-account-staging-import-success")
    ).toHaveTextContent('"goals":3')
  })

  it("shows the API's message when a code is refused", async () => {
    const { ApiError } = await import("@/shared/api")
    importFromProduction.mockRejectedValue(new ApiError(400, "Code expired"))
    const user = userEvent.setup()
    render(<StagingTransferTab mode="import" />)

    await user.type(
      screen.getByTestId("manage-account-staging-import-code"),
      "TP1-old"
    )
    await user.click(screen.getByTestId("manage-account-staging-confirm"))
    await user.click(screen.getByTestId("manage-account-staging-import-submit"))

    expect(
      await screen.findByTestId("manage-account-staging-import-error")
    ).toHaveTextContent("Code expired")
  })
})
