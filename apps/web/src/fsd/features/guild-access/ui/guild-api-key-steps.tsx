import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

const TACTICUS_API_PORTAL_URL = "https://api.tacticusgame.com"

/** How a Leader or Co-Leader gets a Guild API key, with a link to the Tacticus API portal. */
export function GuildApiKeySteps() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="guild-api-key-steps-title"
      className="flex flex-col items-start gap-2 text-sm"
    >
      <h3 className="font-medium" id="guild-api-key-steps-title">
        {t("guild.apiKeySteps.title")}
      </h3>
      <ol className="list-decimal space-y-1 ps-5 text-muted-foreground">
        <li>{t("guild.apiKeySteps.signIn")}</li>
        <li>{t("guild.apiKeySteps.create")}</li>
        <li>{t("guild.apiKeySteps.paste")}</li>
      </ol>
      <Button asChild size="xs" variant="outline">
        <a
          href={TACTICUS_API_PORTAL_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t("guild.apiKeySteps.getKey")}
          <ExternalLink data-icon="inline-end" />
        </a>
      </Button>
    </section>
  )
}
