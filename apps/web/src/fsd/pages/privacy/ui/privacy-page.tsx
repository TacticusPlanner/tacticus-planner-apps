import { useTranslation } from "react-i18next"

import { LegalDocument } from "@/shared/ui"

/** Bump with any change to what the notice says; shown as the "last updated" date. */
const LAST_UPDATED = new Date(Date.UTC(2026, 9, 29))

const SECTIONS = [
  "signIn",
  "apiKey",
  "plannerData",
  "cookies",
  "analytics",
  "feedback",
  "noSale",
  "deletion",
  "contact",
] as const

/** Public "Privacy & cookies" notice; rendered inside `PublicLayout`. */
export function PrivacyPage() {
  const { t } = useTranslation("privacy")

  return (
    <LegalDocument
      idPrefix="privacy"
      intro={t("intro")}
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS.map((id) => ({
        id,
        title: t(`sections.${id}.title`),
        body: t(`sections.${id}.body`),
      }))}
      title={t("title")}
    />
  )
}
