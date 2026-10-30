import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

import {
  isTacticusUserId,
  tacticusUserIdProblem,
  updateTacticusIntegration,
} from "@/entities/account"
import { ApiError } from "@/shared/api"

/**
 * Pastes a Tacticus API key straight into the account. The key is validated server-side against
 * Tacticus before it is stored, so a rejected key comes back as a 400 whose field message is
 * already actionable — it is surfaced as-is rather than remapped.
 *
 * `onCompleted` only refreshes the current-user query; it deliberately does not navigate. See
 * `account-setup-screen.tsx` for why the route guard owns that.
 */
export function ApiKeyForm({ onCompleted }: { onCompleted: () => void }) {
  const { t } = useTranslation()
  const [apiKey, setApiKey] = useState("")
  const [userId, setUserId] = useState("")
  const updateIntegration = useMutation({
    mutationFn: updateTacticusIntegration,
    onSuccess: onCompleted,
  })
  // Stays busy after success: the setup screen leaves once the refreshed account state arrives.
  const submitting = updateIntegration.isPending || updateIntegration.isSuccess
  // A user-id problem (client-side format check, or the API's GUID/in-use answer) shows under the
  // user-id field; anything else stays the form-level message.
  const trimmedUserId = userId.trim()
  const userIdFormatInvalid =
    trimmedUserId !== "" && !isTacticusUserId(trimmedUserId)
  const userIdProblem = userIdFormatInvalid
    ? "invalid"
    : tacticusUserIdProblem(updateIntegration.error)
  const errorMessage =
    updateIntegration.error && !userIdProblem
      ? updateIntegration.error instanceof ApiError
        ? updateIntegration.error.message
        : t("onboarding.genericError")
      : null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const trimmedApiKey = apiKey.trim()
    if (!trimmedApiKey || userIdFormatInvalid) {
      return
    }

    updateIntegration.mutate({
      tacticusApiKey: trimmedApiKey,
      // Null rather than empty: the API preserves an already-stored user id when the field is null,
      // and only clears it on an explicit clearTacticusUserId.
      tacticusUserId: trimmedUserId || null,
    })
  }

  return (
    <form
      className="flex flex-col gap-4"
      data-testid="account-setup-api-key-form"
      onSubmit={handleSubmit}
    >
      <Field data-invalid={Boolean(errorMessage)}>
        <FieldLabel htmlFor="account-setup-api-key">
          {t("onboarding.signUp.apiKeyLabel")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="account-setup-api-key"
            data-testid="account-setup-api-key-input"
            autoComplete="off"
            required
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
          <FieldDescription>
            {t("onboarding.signUp.apiKeyDescription")}
          </FieldDescription>
          <Button asChild className="self-start" size="xs" variant="outline">
            <a
              data-testid="account-setup-get-key-link"
              href="https://api.tacticusgame.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("onboarding.signUp.getKey")}
              <ExternalLink data-icon="inline-end" />
            </a>
          </Button>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(userIdProblem)}>
        <FieldLabel htmlFor="account-setup-user-id">
          {t("onboarding.signUp.userIdLabel")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="account-setup-user-id"
            data-testid="account-setup-user-id-input"
            aria-invalid={Boolean(userIdProblem)}
            autoComplete="off"
            value={userId}
            onChange={(event) => {
              setUserId(event.target.value)
              // The API's answer was about the id just submitted, not the one now typed.
              if (tacticusUserIdProblem(updateIntegration.error)) {
                updateIntegration.reset()
              }
            }}
          />
          <FieldDescription>
            {t("onboarding.signUp.userIdDescription")}
          </FieldDescription>
          {userIdProblem ? (
            <FieldError data-testid="account-setup-user-id-error">
              {t(`tacticusUserId.${userIdProblem}`)}
            </FieldError>
          ) : null}
        </FieldContent>
      </Field>

      {errorMessage ? (
        <FieldError data-testid="account-setup-api-key-error">
          {errorMessage}
        </FieldError>
      ) : null}

      <Button
        data-testid="account-setup-api-key-submit"
        disabled={submitting || !apiKey.trim() || userIdFormatInvalid}
        type="submit"
      >
        {submitting ? <Spinner /> : null}
        {t("onboarding.signUp.submit")}
      </Button>
    </form>
  )
}
