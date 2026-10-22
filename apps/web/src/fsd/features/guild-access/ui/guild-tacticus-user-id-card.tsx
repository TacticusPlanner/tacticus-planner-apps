import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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

import {
  applyTacticusIntegrationResult,
  updateTacticusIntegration,
} from "@/entities/account"
import { ApiError } from "@/shared/api"

export function GuildTacticusUserIdCard({ onSaved }: { onSaved: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [userId, setUserId] = useState("")
  // The response carries the account's new integration state, so the current user is patched from it
  // rather than refetched; the guild state depends on the saved id, so the caller refetches that.
  const updateIntegration = useMutation({
    mutationFn: updateTacticusIntegration,
    onSuccess: (result) => {
      applyTacticusIntegrationResult(queryClient, result)
      onSaved()
    },
  })
  const errorMessage = updateIntegration.error
    ? updateIntegration.error instanceof ApiError
      ? updateIntegration.error.message
      : t("guild.tacticusUserIdRequired.genericError")
    : null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = userId.trim()
    if (!trimmed) return
    updateIntegration.mutate({ tacticusApiKey: null, tacticusUserId: trimmed })
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
        <form onSubmit={handleSubmit}>
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
