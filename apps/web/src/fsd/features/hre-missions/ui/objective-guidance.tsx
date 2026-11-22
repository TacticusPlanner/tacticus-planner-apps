import { Info, Lightbulb } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

import { AbilityText } from "@/shared/ability-text"

import type { HreObjective } from "@/entities/hre-mission"
import { hasGuidance, hasObjectiveTip } from "../model/hre-objective-tips"

/** The game's hint for one objective, then our tip for its kind; either may be missing. */
export function ObjectiveGuidance({
  objective,
  hint,
  testId,
}: {
  objective: HreObjective
  /** The game's hint text (placeholders filled, `<style>` markup kept), or undefined. */
  hint: string | undefined
  testId: string
}) {
  const { t } = useTranslation("hre")
  const tip = hasObjectiveTip(objective.kind)
  if (!hint && !tip) return null
  return (
    <div className="space-y-1.5" data-testid={testId}>
      {hint ? (
        <div data-testid={`${testId}-hint`}>
          <AbilityText
            className="text-xs/relaxed whitespace-pre-line text-muted-foreground"
            level={1}
            rarity={undefined}
            text={hint}
            variables={{}}
          />
        </div>
      ) : null}
      {tip ? (
        <p
          className="flex gap-2 text-xs text-muted-foreground"
          data-testid={`${testId}-tip`}
        >
          <Lightbulb aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>{t(`tips.${objective.kind}` as never)}</span>
        </p>
      ) : null}
    </div>
  )
}

/** The objective's 'i' button: a popover with the game's hint and our tip, as the game's own 'i'. */
export function ObjectiveInfo({
  objective,
  objectiveText,
  hint,
  testId,
}: {
  objective: HreObjective
  objectiveText: string
  hint: string | undefined
  testId: string
}) {
  const { t } = useTranslation("hre")
  if (!hasGuidance(objective, hint)) return null
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={t("tracker.info", { objective: objectiveText })}
          className="shrink-0 text-muted-foreground"
          data-testid={`${testId}-info`}
          size="icon-xs"
          variant="ghost"
        >
          <Info aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 max-w-[calc(100vw-2rem)]">
        <ObjectiveGuidance
          hint={hint}
          objective={objective}
          testId={`${testId}-guidance`}
        />
      </PopoverContent>
    </Popover>
  )
}
