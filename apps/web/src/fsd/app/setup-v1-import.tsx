import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"

import {
  materialSteps,
  V1ImportPanel,
  type V1ImportSelection,
} from "@/features/v1-import"
import type { ImportV1ProfileResult } from "@/entities/account"

const ALL_SELECTED: V1ImportSelection = {
  personalTacticusApiKey: true,
  tacticusUserId: true,
  guildApiToken: true,
  goals: true,
  onslaughtProgress: true,
  campaignEventProgress: true,
  legendaryEventPlans: true,
}

// The whole point of this step is to obtain a key — a cleared checkbox here would strand the user
// on a step that never lets them finish setup.
const LOCKED_PARTS: ReadonlyArray<keyof V1ImportSelection> = [
  "personalTacticusApiKey",
]

/**
 * Composes `V1ImportPanel` (features/v1-import) into the account-setup "import" step
 * (features/account-onboarding, via its `renderImportStep` prop) — the `app` layer is where the two
 * features are allowed to meet (see account-setup-screen.tsx's `renderImportStep` doc comment).
 *
 * Deliberately does NOT call `onCompleted` as soon as the panel succeeds, unlike `ApiKeyForm`. That
 * convention works there because there is exactly one outcome to report. This import has six parts
 * and a goal-by-goal report, so once the key part is confirmed imported, a "Continue" button appears
 * alongside the report already rendered by the panel, and only that click hands control back to the
 * guard (`onCompleted`, which itself triggers the current-user refetch — see
 * `account-setup-screen.tsx`'s `handleCompleted`).
 *
 * Passes `refreshCurrentUserOnSuccess={false}` to the panel for the same reason: the panel's own
 * default behavior refetches the current-user query immediately on success, and
 * `AccountSetupRoute`'s reverse guard reads that same shared query — an immediate refetch would
 * trigger its redirect the instant the personal key succeeds, unmounting this screen (report and
 * Continue button included) before the user ever saw either.
 *
 * Also calls `onKeyImported` (sticky — never un-fires on a later rerun's own failure) so the host can
 * hide its own Back control once the key is in: backing out of setup after the account is already
 * provisioned makes no sense, and going back mid-way is exactly the "not yet available" case this
 * step still needs Back for.
 *
 * When a run's key part doesn't come across, an alert says so and "Paste an API key" becomes the
 * primary action; once that key is saved the route's guard goes straight to the name step.
 *
 * Material steps (V1 material and pre-farm goals, which need an Upgrade goal created by hand) can't be
 * acted on here — there is no goal-creation sheet outside the app shell — so a one-line notice next to
 * Continue points at the Goals page, where they stay (PendingMaterialSteps) until dismissed there.
 */
export function SetupV1Import({
  keyImported,
  onCompleted,
  onUseApiKey,
  onKeyImported,
  onSuggestedDisplayName,
  onImportProject,
}: {
  /** Whether the key part has imported — controlled by the host, which `onKeyImported` tells. */
  keyImported: boolean
  onCompleted: () => void
  onUseApiKey: () => void
  onKeyImported: () => void
  onSuggestedDisplayName: (name: string | null) => void
  /** The project a run put its goals in, so setup can end there; a run that created none keeps the last. */
  onImportProject?: (projectId: string) => void
}) {
  const { t } = useTranslation()
  // An import ran but its key part didn't come across (Skipped/Failed): setup can't finish without one.
  const [keyMissing, setKeyMissing] = useState(false)
  const [materialStepCount, setMaterialStepCount] = useState(0)

  const handleSuccess = (result: ImportV1ProfileResult) => {
    // Handed to the host for the name step's prefill; an unconfirmed suggestion, never confirmed here.
    onSuggestedDisplayName(result.suggestedDisplayName ?? null)
    if (result.importProjectId) onImportProject?.(result.importProjectId)
    setMaterialStepCount(materialSteps(result.outcomes).length)
    if (result.personalTacticusApiKey.status === "Imported") {
      onKeyImported()
    }
    setKeyMissing(result.personalTacticusApiKey.status !== "Imported")
  }

  return (
    <V1ImportPanel
      actions={
        <>
          {!keyImported && keyMissing ? (
            <>
              <Alert
                className="basis-full"
                data-testid="account-setup-v1-key-missing"
              >
                <AlertTitle>
                  {t("onboarding.import.keyMissingTitle")}
                </AlertTitle>
                <AlertDescription>
                  {t("onboarding.import.keyMissing")}
                </AlertDescription>
              </Alert>
              <Button
                data-testid="account-setup-v1-paste-api-key"
                onClick={onUseApiKey}
                type="button"
              >
                {t("onboarding.import.pasteApiKey")}
              </Button>
            </>
          ) : null}
          {!keyImported && !keyMissing ? (
            <Button
              data-testid="account-setup-v1-use-api-key"
              onClick={onUseApiKey}
              type="button"
              variant="outline"
            >
              {t("onboarding.import.useApiKey")}
            </Button>
          ) : null}
          {keyImported && materialStepCount > 0 ? (
            <p
              className="basis-full text-sm text-muted-foreground"
              data-testid="account-setup-v1-material-steps-notice"
            >
              {t("onboarding.import.materialStepsNotice", {
                count: materialStepCount,
              })}
            </p>
          ) : null}
          {keyImported ? (
            <Button
              data-testid="account-setup-v1-continue"
              onClick={onCompleted}
              type="button"
            >
              {t("onboarding.import.continue")}
            </Button>
          ) : null}
        </>
      }
      defaultSelection={ALL_SELECTED}
      lockedParts={LOCKED_PARTS}
      onSuccess={handleSuccess}
      refreshCurrentUserOnSuccess={false}
      setup
    />
  )
}
