import type { ReactNode } from "react"

import { TooltipProvider } from "@workspace/ui/components/tooltip"

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
  return (
    <TooltipProvider>
      <main className="min-h-svh bg-background text-foreground" data-testid="ui-kit-page">
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-8">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              Tacticus Planner
            </p>
            <div className="flex max-w-4xl flex-col gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">UI Kit</h1>
              <p className="text-muted-foreground">
                Focused shadcn component catalog for the v2 planner app.
              </p>
            </div>
          </div>
          {headerAction}
        </div>

        <UiKitNav />

        <div className="flex flex-col gap-10 px-6 py-8">
          <UiKitSection
            description="Semantic colors from the active shadcn preset."
            id={uiKitSections[0].id}
            title={uiKitSections[0].label}
          >
            <ColorsShowcase />
          </UiKitSection>

          <UiKitSection
            description="Core action styles, sizes, disabled states, and icon composition."
            id={uiKitSections[1].id}
            title={uiKitSections[1].label}
          >
            <ButtonsShowcase />
          </UiKitSection>

          <UiKitSection
            description="Field layout, descriptions, validation, disabled states, and grouped inputs."
            id={uiKitSections[2].id}
            title={uiKitSections[2].label}
          >
            <FormsShowcase />
          </UiKitSection>

          <UiKitSection
            description="Checkboxes, radios, switches, selects, sliders, and segmented controls."
            id={uiKitSections[3].id}
            title={uiKitSections[3].label}
          >
            <SelectionShowcase />
          </UiKitSection>

          <UiKitSection
            description="Alerts, badges, progress, skeletons, and loading indicators."
            id={uiKitSections[4].id}
            title={uiKitSections[4].label}
          >
            <FeedbackShowcase />
          </UiKitSection>

          <UiKitSection
            description="Tooltip, dialog, popover, and command composition."
            id={uiKitSections[5].id}
            title={uiKitSections[5].label}
          >
            <OverlaysShowcase />
          </UiKitSection>

          <UiKitSection
            description="Cards, separators, accordions, tabs, and scrollable regions."
            id={uiKitSections[6].id}
            title={uiKitSections[6].label}
          >
            <LayoutShowcase />
          </UiKitSection>

          <UiKitSection
            description="Basic table usage and a TanStack data table composition."
            id={uiKitSections[7].id}
            title={uiKitSections[7].label}
          >
            <DataDisplayShowcase />
          </UiKitSection>
        </div>
      </main>
    </TooltipProvider>
  )
}
