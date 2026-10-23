import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"

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
 * Material steps (V1 material and pre-farm goals, which need an Upgrade goal created by hand) can't be
 * acted on here — there is no goal-creation sheet outside the app shell — so Continue waits until the
 * user acknowledges them; they stay on the Goals page (PendingMaterialSteps) until dismissed there.
 */
export function SetupV1Import({
  onCompleted,
  onUseApiKey,
  onKeyImported,
  onSuggestedDisplayName,
}: {
  onCompleted: () => void
  onUseApiKey: () => void
  onKeyImported: () => void
  onSuggestedDisplayName: (name: string | null) => void
}) {
  const { t } = useTranslation()
  const [keySucceeded, setKeySucceeded] = useState(false)
  const [hasMaterialSteps, setHasMaterialSteps] = useState(false)
  const [stepsAcknowledged, setStepsAcknowledged] = useState(false)

  const handleSuccess = (result: ImportV1ProfileResult) => {
    // Handed to the host for the name step's prefill; an unconfirmed suggestion, never confirmed here.
    onSuggestedDisplayName(result.suggestedDisplayName ?? null)
    setHasMaterialSteps(materialSteps(result.outcomes).length > 0)
    setStepsAcknowledged(false)
    if (result.personalTacticusApiKey.status === "Imported") {
      setKeySucceeded(true)
      onKeyImported()
    }
  }

  return (
    <V1ImportPanel
      actions={
        <>
          {!keySucceeded ? (
            <Button
              data-testid="account-setup-v1-use-api-key"
              onClick={onUseApiKey}
              type="button"
              variant="outline"
            >
              {t("onboarding.import.useApiKey")}
            </Button>
          ) : null}
          {keySucceeded && hasMaterialSteps ? (
            <label className="flex basis-full items-start gap-2 text-sm">
              <Checkbox
                className="mt-0.5"
                checked={stepsAcknowledged}
                data-testid="account-setup-v1-material-steps-ack"
                onCheckedChange={(checked) =>
                  setStepsAcknowledged(checked === true)
                }
              />
              {t("onboarding.import.materialStepsAcknowledge")}
            </label>
          ) : null}
          {keySucceeded ? (
            <Button
              data-testid="account-setup-v1-continue"
              disabled={hasMaterialSteps && !stepsAcknowledged}
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
    />
  )
}
