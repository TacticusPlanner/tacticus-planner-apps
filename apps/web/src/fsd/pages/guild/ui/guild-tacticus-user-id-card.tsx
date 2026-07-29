import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

import { updateTacticusIntegration, useCurrentUser } from "@/entities/account"
import { ApiError } from "@/shared/api"

type Props = {
  onSaved: () => void
}

/**
 * Shown when the caller has no configured Tacticus User ID yet — a prerequisite for viewing or
 * registering a guild. Reuses the existing tacticus-integration endpoint, omitting the API key so any
 * already-stored key is left unchanged (see Guild Phase 1 spec). Intentionally inline on the page, not a
 * modal — the account-management/onboarding dialogs are a separate flow.
 */
export function GuildTacticusUserIdCard({ onSaved }: Props) {
  const { t } = useTranslation()
  const { refetch: refetchCurrentUser } = useCurrentUser()
  const [userId, setUserId] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const updateIntegration = useMutation({
    mutationFn: updateTacticusIntegration,
  })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const trimmed = userId.trim()
    if (!trimmed) {
      return
    }

    setStatus("submitting")
    setErrorMessage(null)

    try {
      await updateIntegration.mutateAsync({
        tacticusUserId: trimmed,
      })
      refetchCurrentUser()
      onSaved()
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : t("guild.tacticusUserIdRequired.genericError")
      )
    }
  }

  return (
    <Card data-testid="guild-tacticus-user-id-required">
      <CardHeader>
        <CardTitle>{t("guild.tacticusUserIdRequired.title")}</CardTitle>
        <CardDescription>
          {t("guild.tacticusUserIdRequired.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <Field data-invalid={status === "error"}>
            <FieldLabel htmlFor="guild-tacticus-user-id">
              {t("guild.tacticusUserIdRequired.userIdLabel")}
            </FieldLabel>
            <FieldContent>
              <Input
                id="guild-tacticus-user-id"
                data-testid="guild-tacticus-user-id-input"
                autoComplete="off"
                placeholder={t(
                  "guild.tacticusUserIdRequired.userIdPlaceholder"
                )}
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
              />
            </FieldContent>
          </Field>

          {status === "error" && errorMessage ? (
            <FieldError data-testid="guild-tacticus-user-id-error">
              {errorMessage}
            </FieldError>
          ) : null}

          <Button
            data-testid="guild-tacticus-user-id-submit"
            disabled={status === "submitting" || !userId.trim()}
            type="submit"
          >
            {status === "submitting" ? <Spinner /> : null}
            {status === "submitting"
              ? t("guild.tacticusUserIdRequired.saving")
              : t("guild.tacticusUserIdRequired.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
