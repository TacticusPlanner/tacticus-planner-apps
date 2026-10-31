import { ExternalLink } from "lucide-react"
import { useTranslation } from "react-i18next"

import { DISCORD_INVITE_URL, GITHUB_ORG_URL } from "@/shared/config"
import { useDateLocale } from "@/shared/lib"

interface LegalDocumentSection {
  id: string
  title: string
  body: string
}

/**
 * Body of a public legal page (privacy, terms): title, "last updated" date, intro, one titled
 * paragraph per section and the project's contact links. Rendered inside `PublicLayout`, which owns
 * the top bar, footer and `main`. `idPrefix` keeps section heading ids unique per page.
 */
export function LegalDocument({
  idPrefix,
  intro,
  lastUpdated,
  sections,
  title,
}: {
  idPrefix: string
  intro: string
  lastUpdated: Date
  sections: readonly LegalDocumentSection[]
  title: string
}) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const lastUpdatedLabel = new Intl.DateTimeFormat(dateLocale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(lastUpdated)

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 md:px-6 md:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("publicSite.lastUpdated", { date: lastUpdatedLabel })}
        </p>
        <p className="text-lg text-muted-foreground">{intro}</p>
      </header>
      {sections.map((section) => (
        <section
          aria-labelledby={`${idPrefix}-${section.id}`}
          className="flex flex-col gap-2"
          key={section.id}
        >
          <h2
            className="font-heading text-xl font-semibold tracking-tight"
            id={`${idPrefix}-${section.id}`}
          >
            {section.title}
          </h2>
          <p className="leading-relaxed">{section.body}</p>
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
            {t("publicSite.discord")}
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
            {t("publicSite.github")}
            <ExternalLink aria-hidden="true" className="size-3" />
          </a>
        </li>
      </ul>
    </article>
  )
}
