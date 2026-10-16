import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

import type { MowAbility } from "./mow-upgrades.model"

type MowPanel = MowAbility | "mythic"

const PANELS: readonly MowPanel[] = ["primary", "secondary", "mythic"]

/**
 * The MoW Details tab: the Primary, Secondary and Mythic ability panels. Desktop: a grid. Mobile:
 * collapsible sections with the level in each header, Primary expanded.
 */
export function MowUnitDetails({
  panels,
  metas,
  names,
  isMobile,
}: {
  panels: Record<MowPanel, ReactNode>
  /** Each section header's summary: "Lv 30", or "Unlocks at Mythic". */
  metas: Record<MowPanel, string>
  names: Record<MowPanel, string>
  isMobile: boolean
}) {
  const { t } = useTranslation("library")
  const [openSections, setOpenSections] = useState<string[]>(["primary"])

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4" data-testid="unit-details">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
        >
          {PANELS.map((ability) => (
            <AccordionItem
              key={ability}
              value={ability}
              data-testid={`unit-section-${ability}`}
            >
              <AccordionTrigger className="min-h-[52px] items-center">
                <span className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    {t(`mowUnit.abilities.${ability}`)}
                  </span>
                  <span className="truncate text-base font-semibold">
                    {names[ability]}
                  </span>
                </span>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground tabular-nums">
                  {metas[ability]}
                </span>
              </AccordionTrigger>
              <AccordionContent>{panels[ability]}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    )
  }

  return (
    <section
      className="flex flex-col gap-3"
      aria-labelledby="mow-abilities-title"
      data-testid="unit-details"
    >
      <h2 id="mow-abilities-title" className="font-heading text-lg font-bold">
        {t("mowUnit.abilities.title")}
      </h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(400px,100%),1fr))] gap-4">
        {panels.primary}
        {panels.secondary}
        {panels.mythic}
      </div>
    </section>
  )
}
