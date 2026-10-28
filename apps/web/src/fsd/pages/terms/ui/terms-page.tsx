import { useTranslation } from "react-i18next"

import { LegalDocument } from "@/shared/ui"

/** Bump with any change to what the terms say; shown as the "last updated" date. */
const LAST_UPDATED = new Date(Date.UTC(2026, 9, 28))

const SECTIONS = [
  "fanProject",
  "account",
  "acceptableUse",
  "gameContent",
  "openSource",
  "noWarranty",
  "availability",
  "changes",
  "contact",
] as const

/** Public terms of use; rendered inside `PublicLayout`. */
export function TermsPage() {
  const { t } = useTranslation("terms")

  return (
    <LegalDocument
      idPrefix="terms"
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
