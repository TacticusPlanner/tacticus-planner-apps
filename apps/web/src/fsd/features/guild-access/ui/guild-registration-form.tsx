import { useState, type FormEvent } from "react"
import { Link } from "react-router"
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

import { registerGuild } from "@/entities/guild"
import { ApiError } from "@/shared/api"

type Props = {
  onRegistered: () => void
  showGuildManagementLink: boolean
}

export function GuildRegistrationForm({
  onRegistered,
  showGuildManagementLink,
}: Props) {
  const { t } = useTranslation()
  const [token, setToken] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const registration = useMutation({ mutationFn: registerGuild })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = token.trim()
    if (!trimmed) return

    setErrorMessage(null)
    try {
      await registration.mutateAsync({ guildApiToken: trimmed })
      setToken("")
      onRegistered()
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : t("guild.unregistered.genericError")
      )
    }
  }

  return (
    <Card data-testid="guild-unregistered">
      <CardHeader>
        <CardTitle>{t("guild.unregistered.title")}</CardTitle>
        <CardDescription className="flex flex-col gap-2">
          <p>{t("guild.unregistered.description")}</p>
          <p>{t("guild.unregistered.leaderPrompt")}</p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          data-testid="guild-registration-form"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <FieldGroup>
            <Field data-invalid={Boolean(errorMessage)}>
              <FieldLabel htmlFor="guild-api-token">
                {t("guild.unregistered.tokenLabel")}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="guild-api-token"
                  data-testid="guild-api-token-input"
                  aria-invalid={Boolean(errorMessage)}
                  autoComplete="off"
                  placeholder={t("guild.unregistered.tokenPlaceholder")}
                  type="password"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                />
                <FieldDescription>
                  {t("guild.unregistered.eligibility")}
                </FieldDescription>
              </FieldContent>
              {errorMessage ? (
                <FieldError data-testid="guild-registration-error">
                  {errorMessage}
                </FieldError>
              ) : null}
            </Field>

            {errorMessage ? (
              <div
                className="flex flex-col items-start gap-2"
                data-testid="guild-registration-handoff"
              >
                <p className="text-sm text-muted-foreground">
                  {t("guild.unregistered.handoff")}
                </p>
                {showGuildManagementLink ? (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/guild">{t("guild.openManagement")}</Link>
                  </Button>
                ) : null}
              </div>
            ) : null}

            <Button
              data-testid="guild-register-submit"
              disabled={registration.isPending || !token.trim()}
              type="submit"
            >
              {registration.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              {registration.isPending
                ? t("guild.unregistered.registering")
                : t("guild.unregistered.register")}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
