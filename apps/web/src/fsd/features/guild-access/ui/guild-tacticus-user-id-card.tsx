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
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

import { updateTacticusIntegration, useCurrentUser } from "@/entities/account"
import { ApiError } from "@/shared/api"

export function GuildTacticusUserIdCard({ onSaved }: { onSaved: () => void }) {
  const { t } = useTranslation()
  const { refetch: refetchCurrentUser } = useCurrentUser()
  const [userId, setUserId] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const updateIntegration = useMutation({
    mutationFn: updateTacticusIntegration,
  })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = userId.trim()
    if (!trimmed) return

    setErrorMessage(null)
    try {
      await updateIntegration.mutateAsync({ tacticusUserId: trimmed })
      refetchCurrentUser()
      onSaved()
    } catch (error) {
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
        <form onSubmit={(event) => void handleSubmit(event)}>
          <FieldGroup>
            <Field data-invalid={Boolean(errorMessage)}>
              <FieldLabel htmlFor="guild-tacticus-user-id">
                {t("guild.tacticusUserIdRequired.userIdLabel")}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="guild-tacticus-user-id"
                  data-testid="guild-tacticus-user-id-input"
                  aria-invalid={Boolean(errorMessage)}
                  autoComplete="off"
                  placeholder={t(
                    "guild.tacticusUserIdRequired.userIdPlaceholder"
                  )}
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                />
              </FieldContent>
              {errorMessage ? (
                <FieldError data-testid="guild-tacticus-user-id-error">
                  {errorMessage}
                </FieldError>
              ) : null}
            </Field>
            <Button
              data-testid="guild-tacticus-user-id-submit"
              disabled={updateIntegration.isPending || !userId.trim()}
              type="submit"
            >
              {updateIntegration.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              {updateIntegration.isPending
                ? t("guild.tacticusUserIdRequired.saving")
                : t("guild.tacticusUserIdRequired.save")}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
