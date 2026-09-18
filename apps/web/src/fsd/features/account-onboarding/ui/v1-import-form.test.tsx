import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, waitFor } from "@/test/render"
import { ApiError } from "@/shared/api"
import type { ImportPartResult } from "@/entities/account"

const importV1Profile = vi.fn()

// Spread the real module rather than replacing it: `@/shared/api` pulls in the i18n bootstrap,
// which needs the genuine `initReactI18next`.
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@/entities/account", () => ({
  importV1Profile: (...args: unknown[]) => importV1Profile(...args),
}))

import { V1ImportForm } from "./v1-import-form"

const imported: ImportPartResult = {
  status: "Imported",
  code: null,
  message: null,
}
const notSelected: ImportPartResult = {
  status: "Skipped",
  code: "not_selected",
  message: null,
}

function response(personalTacticusApiKey: ImportPartResult, overrides = {}) {
  return {
    tacticusUserId: imported,
    personalTacticusApiKey,
    guildApiToken: notSelected,
    onslaughtProgress: notSelected,
    campaignEventProgress: notSelected,
    goals: notSelected,
    goalsSkipped: 0,
    goalIssues: [],
    ...overrides,
  }
}

async function submit(props: Parameters<typeof V1ImportForm>[0]) {
  const user = userEvent.setup()
  render(<V1ImportForm {...props} />)
  await user.type(screen.getByTestId("account-setup-v1-username-input"), "bob")
  await user.type(screen.getByTestId("account-setup-v1-password-input"), "pw")
  await user.click(screen.getByTestId("account-setup-v1-submit"))
  return user
}

describe("V1ImportForm", () => {
  beforeEach(() => {
    importV1Profile.mockReset()
  })

  it("completes setup when the import yields a usable key", async () => {
    importV1Profile.mockResolvedValue(response(imported))
    const onCompleted = vi.fn()

    await submit({ onCompleted })

    await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1))
    expect(
      screen.queryByTestId("account-setup-v1-error")
    ).not.toBeInTheDocument()
  })

  it.each([
    ["missing_personal_api_key", "onboarding.importOutcome.missingKey"],
    ["personal_api_key_invalid", "onboarding.importOutcome.invalidKey"],
    ["personal_api_key_not_saved", "onboarding.importOutcome.notSaved"],
    ["something_new", "onboarding.importOutcome.unknown"],
    [null, "onboarding.importOutcome.unknown"],
  ])(
    "does not complete setup for code %s and explains why",
    async (code, expectedMessage) => {
      importV1Profile.mockResolvedValue(
        response({
          status: code === "missing_personal_api_key" ? "Skipped" : "Failed",
          code,
          message: "server text that should not be shown",
        })
      )
      const onCompleted = vi.fn()

      await submit({ onCompleted })

      expect(
        await screen.findByTestId("account-setup-v1-error")
      ).toHaveTextContent(expectedMessage)
      expect(onCompleted).not.toHaveBeenCalled()
    }
  )

  it("leaves the form submittable after a non-completing outcome", async () => {
    importV1Profile.mockResolvedValue(
      response({
        status: "Skipped",
        code: "missing_personal_api_key",
        message: null,
      })
    )

    await submit({ onCompleted: vi.fn() })

    await screen.findByTestId("account-setup-v1-error")
    // Regression guard: the only exits from the submitting state used to be a thrown error and
    // unmounting on success, so this branch could leave the button spinning forever.
    expect(screen.getByTestId("account-setup-v1-submit")).toBeEnabled()
    expect(screen.getByTestId("account-setup-v1-username-input")).toHaveValue(
      "bob"
    )
  })

  it("reports an invalid-credentials rejection on the form", async () => {
    importV1Profile.mockRejectedValue(
      new ApiError(400, "The V1 username or password is invalid.")
    )
    const onCompleted = vi.fn()

    await submit({ onCompleted, onUseApiKey: vi.fn() })

    expect(
      await screen.findByTestId("account-setup-v1-error")
    ).toHaveTextContent("The V1 username or password is invalid.")
    expect(onCompleted).not.toHaveBeenCalled()
    // Switching to the API key path does not fix bad V1 credentials, so the shortcut is not offered.
    expect(
      screen.queryByTestId("account-setup-v1-use-api-key")
    ).not.toBeInTheDocument()
  })

  it("offers the API key shortcut on mobile, and advances only when it is activated", async () => {
    importV1Profile.mockResolvedValue(
      response({
        status: "Skipped",
        code: "missing_personal_api_key",
        message: null,
      })
    )
    const onUseApiKey = vi.fn()

    const user = await submit({ onCompleted: vi.fn(), onUseApiKey })

    const shortcut = await screen.findByTestId("account-setup-v1-use-api-key")
    expect(onUseApiKey).not.toHaveBeenCalled()
    expect(screen.getByTestId("account-setup-v1-form")).toBeVisible()

    await user.click(shortcut)
    expect(onUseApiKey).toHaveBeenCalledTimes(1)
  })

  it("omits the shortcut when no handler is supplied, as on desktop", async () => {
    importV1Profile.mockResolvedValue(
      response({
        status: "Skipped",
        code: "missing_personal_api_key",
        message: null,
      })
    )

    await submit({ onCompleted: vi.fn() })

    await screen.findByTestId("account-setup-v1-error")
    expect(
      screen.queryByTestId("account-setup-v1-use-api-key")
    ).not.toBeInTheDocument()
  })

  it("ignores the outcome of parts other than the API key", async () => {
    importV1Profile.mockResolvedValue(
      response(imported, {
        tacticusUserId: {
          status: "Failed",
          code: "tacticus_user_id_conflict",
          message: "already linked",
        },
      })
    )
    const onCompleted = vi.fn()

    await submit({ onCompleted })

    await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(/already linked/)).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("account-setup-v1-error")
    ).not.toBeInTheDocument()
  })

  it("requests only the personal key and user id", async () => {
    importV1Profile.mockResolvedValue(response(imported))

    await submit({ onCompleted: vi.fn() })

    await waitFor(() => expect(importV1Profile).toHaveBeenCalled())
    expect(importV1Profile.mock.calls[0][0].import).toEqual({
      personalTacticusApiKey: true,
      tacticusUserId: true,
      guildApiToken: false,
      goals: false,
      onslaughtProgress: false,
      campaignEventProgress: false,
    })
  })
})
