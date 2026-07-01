import type { ReactNode } from "react"

import { useTranslation } from "react-i18next"

import { uiKitSections } from "../model/ui-kit"
import { ButtonsShowcase } from "./buttons-showcase"
import { ColorsShowcase } from "./colors-showcase"
import { DataDisplayShowcase } from "./data-display-showcase"
import { FeedbackShowcase } from "./feedback-showcase"
import { FormsShowcase } from "./forms-showcase"
import { LayoutShowcase } from "./layout-showcase"
import { OverlaysShowcase } from "./overlays-showcase"
import { SelectionShowcase } from "./selection-showcase"
import { UiKitNav } from "./ui-kit-nav"
import { UiKitSection } from "./ui-kit-section"

type UiKitPageProps = {
  headerAction?: ReactNode
}

export function UiKitPage({ headerAction }: UiKitPageProps) {
  const { t } = useTranslation()

  return (
    <main
      className="min-h-svh bg-background text-foreground"
      data-testid="ui-kit-page"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            {t("app.name")}
          </p>
          <div className="flex max-w-4xl flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("uiKit.title")}
            </h1>
            <p className="text-muted-foreground">{t("uiKit.subtitle")}</p>
          </div>
        </div>
        {headerAction}
      </div>

      <UiKitNav />

      <div className="flex flex-col gap-10 px-6 py-8">
        {uiKitSections.map((section) => (
          <UiKitSection
            description={t(section.descriptionKey)}
            id={section.id}
            key={section.id}
            title={t(section.labelKey)}
          >
            {section.id === "colors" ? <ColorsShowcase /> : null}
            {section.id === "buttons" ? <ButtonsShowcase /> : null}
            {section.id === "forms" ? <FormsShowcase /> : null}
            {section.id === "selection" ? <SelectionShowcase /> : null}
            {section.id === "feedback" ? <FeedbackShowcase /> : null}
            {section.id === "overlays" ? <OverlaysShowcase /> : null}
            {section.id === "layout" ? <LayoutShowcase /> : null}
            {section.id === "data-display" ? <DataDisplayShowcase /> : null}
          </UiKitSection>
        ))}
      </div>
    </main>
  )
}
