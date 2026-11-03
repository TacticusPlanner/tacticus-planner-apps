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

import { registerGuild, type RegisteredGuild } from "@/entities/guild"
import { ApiError } from "@/shared/api"

import { GuildApiKeySteps } from "./guild-api-key-steps"

type Props = {
  guild: RegisteredGuild
  onReplaced: (guild: RegisteredGuild) => void
}

/**
 * Lets a Leader or Co-Leader swap the guild's stored Guild API key. Re-registering an already
 * registered guild updates its token and resyncs it (see the API's `POST guild/register`), so this
 * reuses the registration call rather than a dedicated endpoint.
 */
export function ReplaceGuildApiKeyCard({ guild, onReplaced }: Props) {
  const { t } = useTranslation()
  const [apiKey, setApiKey] = useState("")
  const replacement = useMutation({ mutationFn: registerGuild })
  const errorMessage = replacement.error
    ? replacement.error instanceof ApiError
      ? replacement.error.message
      : t("guild.settings.apiKey.genericError")
    : null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = apiKey.trim()
    if (!trimmed) return

    replacement.mutate(
      { guildApiToken: trimmed },
      {
        onSuccess: (updated) => {
          setApiKey("")
          onReplaced(updated)
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("guild.settings.apiKey.title")}</CardTitle>
        <CardDescription>
          {t("guild.settings.apiKey.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {guild.canSynchronize ? (
          <form
            aria-label={t("guild.settings.apiKey.title")}
            onSubmit={handleSubmit}
          >
            <FieldGroup>
              <GuildApiKeySteps />
              <Field data-invalid={Boolean(errorMessage)}>
                <FieldLabel htmlFor="guild-settings-api-key">
                  {t("guild.settings.apiKey.label")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="guild-settings-api-key"
                    aria-invalid={Boolean(errorMessage)}
                    autoComplete="off"
                    placeholder={t("guild.settings.apiKey.placeholder")}
                    type="password"
                    value={apiKey}
                    onChange={(event) => {
                      setApiKey(event.target.value)
                      if (!replacement.isIdle) replacement.reset()
                    }}
                  />
                </FieldContent>
                {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
              </Field>

              {replacement.isSuccess ? (
                <p className="text-sm text-muted-foreground" role="status">
                  {t("guild.settings.apiKey.replaced")}
                </p>
              ) : null}

              <Button
                className="self-start"
                disabled={replacement.isPending || !apiKey.trim()}
                type="submit"
              >
                {replacement.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : null}
                {replacement.isPending
                  ? t("guild.settings.apiKey.replacing")
                  : t("guild.settings.apiKey.replace")}
              </Button>
            </FieldGroup>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("guild.settings.apiKey.leadersOnly")}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
