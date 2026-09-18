import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

import { importV1Profile, type ImportPartResult } from "@/entities/account"
import { ApiError } from "@/shared/api"

/**
 * The API reports each imported part independently inside an HTTP 200 body, so a "successful"
 * import can still leave the account without a usable key. These are the codes it returns for the
 * personal key; anything else falls back to the generic message.
 */
const OUTCOME_MESSAGE_KEYS = {
  missing_personal_api_key: "onboarding.importOutcome.missingKey",
  personal_api_key_invalid: "onboarding.importOutcome.invalidKey",
  personal_api_key_not_saved: "onboarding.importOutcome.notSaved",
} as const

type Failure = {
  message: string
  /** Only set for a 200 that yielded no usable key — a credential rejection is not fixed by
   * switching paths, so it does not offer the shortcut. */
  offerApiKey: boolean
}

/**
 * Imports the Tacticus API key (and user id) from a V1 planner account. Only those two parts are
 * requested here — the full import lives in `features/v1-import` and stays available afterwards.
 *
 * `onCompleted` only refreshes the current-user query; it deliberately does not navigate. See
 * `account-setup-screen.tsx` for why the route guard owns that.
 */
export function V1ImportForm({
  onCompleted,
  onUseApiKey,
}: {
  onCompleted: () => void
  /** Supplied on mobile only: on desktop the API key panel is already on screen beside this one. */
  onUseApiKey?: () => void
}) {
  const { t } = useTranslation()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState<Failure | null>(null)
  const importProfile = useMutation({ mutationFn: importV1Profile })

  const outcomeMessage = (part: ImportPartResult) => {
    const key =
      part.code && part.code in OUTCOME_MESSAGE_KEYS
        ? OUTCOME_MESSAGE_KEYS[part.code as keyof typeof OUTCOME_MESSAGE_KEYS]
        : "onboarding.importOutcome.unknown"
    return t(key)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!username.trim() || !password) {
      return
    }

    setSubmitting(true)
    setFailure(null)

    try {
      const imported = await importProfile.mutateAsync({
        username: username.trim(),
        password,
        import: {
          personalTacticusApiKey: true,
          tacticusUserId: true,
          guildApiToken: false,
          goals: false,
          onslaughtProgress: false,
          campaignEventProgress: false,
        },
      })

      const personalKey = imported.personalTacticusApiKey
      if (personalKey.status === "Imported") {
        // Stay in the submitting state: the screen shows progress until the refreshed account
        // state confirms the key, and the route guard then navigates. Deliberately no refetch on
        // any other branch — nothing was configured, so there is nothing to refresh.
        onCompleted()
        return
      }

      // The outcome of other parts (a user id conflict, say) is not reported here: it does not
      // block setup and is visible in Manage Account.
      setSubmitting(false)
      setFailure({
        message: outcomeMessage(personalKey),
        offerApiKey: true,
      })
    } catch (error) {
      setSubmitting(false)
      setFailure({
        message:
          error instanceof ApiError
            ? error.message
            : t("onboarding.genericError"),
        offerApiKey: false,
      })
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      data-testid="account-setup-v1-form"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <FieldDescription>{t("onboarding.import.description")}</FieldDescription>

      <Field data-invalid={failure !== null}>
        <FieldLabel htmlFor="account-setup-v1-username">
          {t("onboarding.import.usernameLabel")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="account-setup-v1-username"
            data-testid="account-setup-v1-username-input"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </FieldContent>
      </Field>

      <Field data-invalid={failure !== null}>
        <FieldLabel htmlFor="account-setup-v1-password">
          {t("onboarding.import.passwordLabel")}
        </FieldLabel>
        <FieldContent>
          <Input
            id="account-setup-v1-password"
            data-testid="account-setup-v1-password-input"
            autoComplete="current-password"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FieldContent>
      </Field>

      {failure ? (
        <div
          className="flex flex-col items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          data-testid="account-setup-v1-error"
          role="alert"
        >
          <p>{failure.message}</p>
          {failure.offerApiKey && onUseApiKey ? (
            <Button
              data-testid="account-setup-v1-use-api-key"
              onClick={onUseApiKey}
              size="sm"
              type="button"
              variant="outline"
            >
              {t("onboarding.importOutcome.useApiKey")}
            </Button>
          ) : null}
        </div>
      ) : null}

      <Button
        data-testid="account-setup-v1-submit"
        disabled={submitting || !username.trim() || !password}
        type="submit"
      >
        {submitting ? <Spinner /> : null}
        {t("onboarding.import.submit")}
      </Button>
    </form>
  )
}
