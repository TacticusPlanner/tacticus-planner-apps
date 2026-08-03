import { useTranslation } from "react-i18next"

import { UnderConstruction } from "@/shared/ui"

export function DailiesPlaceholderPage() {
  const { t } = useTranslation("dailies")
  return (
    <UnderConstruction
      title={t("placeholder.title")}
      description={t("placeholder.description")}
      testId="dailies-placeholder-page"
    />
  )
}
