import { Info, Lightbulb } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { AbilityText } from "@/shared/ability-text"
import { useAnalyticsActions } from "@/shared/analytics"
import { DetailsOverlay } from "@/shared/ui"

import type { HreObjective } from "@/entities/hre-mission"
import { hasGuidance, objectiveTipKeys } from "../model/hre-objective-tips"

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
  const tips = objectiveTipKeys(objective.kind)
  if (!hint && tips.length === 0) return null
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
      {tips.map((key, index) => (
        <p
          key={key}
          className="flex gap-2 text-xs text-muted-foreground"
          data-testid={index === 0 ? `${testId}-tip` : `${testId}-tip-${key}`}
        >
          <Lightbulb
            aria-hidden="true"
            className="mt-0.5 size-icon-sm shrink-0"
          />
          <span>{t(`tips.${key}` as never)}</span>
        </p>
      ))}
    </div>
  )
}

/** The objective's 'i' button: the game's hint and our tip in a details overlay (a popover on
 *  desktop, a content-height sheet on phones), as the game's own 'i'. */
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
  const { captureEvent } = useAnalyticsActions()
  if (!hasGuidance(objective, hint)) return null
  return (
    <DetailsOverlay
      onOpenChange={(open) => {
        if (open) {
          captureEvent({
            type: "hre_objective_info_opened",
            objectiveKind: objective.kind,
          })
        }
      }}
      testId={`${testId}-details`}
      title={objectiveText}
      trigger={
        <Button
          aria-label={t("tracker.info", { objective: objectiveText })}
          className="shrink-0 text-muted-foreground"
          data-testid={`${testId}-info`}
          size="icon-xs"
          variant="ghost"
        >
          <Info aria-hidden="true" />
        </Button>
      }
    >
      <ObjectiveGuidance
        hint={hint}
        objective={objective}
        testId={`${testId}-guidance`}
      />
    </DetailsOverlay>
  )
}
