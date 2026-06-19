import { useTranslation } from "react-i18next"

import { uiKitSections } from "../model/ui-kit"

export function UiKitNav() {
  const { t } = useTranslation()

  return (
    <nav
      aria-label={t("uiKit.navLabel")}
      className="sticky top-0 flex flex-wrap items-center gap-2 border-b bg-background/95 px-6 py-3 backdrop-blur"
      data-testid="ui-kit-nav"
    >
      {uiKitSections.map((section) => (
        <a
          className="rounded-2xl px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          href={`#${section.id}`}
          key={section.id}
        >
          {t(section.labelKey)}
        </a>
      ))}
    </nav>
  )
}
