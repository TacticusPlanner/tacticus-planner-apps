import { ExternalLink } from "lucide-react"
import { useTranslation } from "react-i18next"

import { DISCORD_INVITE_URL, GITHUB_ORG_URL } from "@/shared/config"

/** Bump with any change to what the notice says; shown as the "last updated" date. */
const LAST_UPDATED = new Date(Date.UTC(2026, 9, 28))

const SECTIONS = [
  "signIn",
  "apiKey",
  "plannerData",
  "analytics",
  "feedback",
  "noSale",
  "deletion",
  "contact",
] as const

/** Public privacy notice; rendered inside `PublicLayout`, which owns the top bar, footer and `main`. */
export function PrivacyPage() {
  const { i18n, t } = useTranslation(["privacy", "common"])
  const lastUpdated = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(LAST_UPDATED)

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 md:px-6 md:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("lastUpdated", { date: lastUpdated })}
        </p>
        <p className="text-lg text-muted-foreground">{t("intro")}</p>
      </header>
      {SECTIONS.map((section) => (
        <section
          aria-labelledby={`privacy-${section}`}
          className="flex flex-col gap-2"
          key={section}
        >
          <h2
            className="font-heading text-xl font-semibold tracking-tight"
            id={`privacy-${section}`}
          >
            {t(`sections.${section}.title`)}
          </h2>
          <p className="leading-relaxed">{t(`sections.${section}.body`)}</p>
        </section>
      ))}
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <li>
          <a
            className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            href={DISCORD_INVITE_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t("common:publicSite.discord")}
            <ExternalLink aria-hidden="true" className="size-3" />
          </a>
        </li>
        <li>
          <a
            className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            href={GITHUB_ORG_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t("common:publicSite.github")}
            <ExternalLink aria-hidden="true" className="size-3" />
          </a>
        </li>
      </ul>
    </article>
  )
}
