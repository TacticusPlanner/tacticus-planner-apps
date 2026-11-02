import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { heroStarIcon } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

/** A tier's stars as the game shows them: a star, a filling bar and "38/45", ticked when full. */
export function IncursionStarsBar({
  earned,
  max,
  className,
  "data-testid": testId,
}: {
  earned: number
  max: number
  className?: string
  "data-testid"?: string
}) {
  const { t } = useTranslation("incursions")
  const full = max > 0 && earned >= max
  const percent = max > 0 ? Math.round((earned / max) * 100) : 0
  return (
    <div
      className={cn("flex min-w-0 items-center gap-1.5", className)}
      title={t("tier.starsLabel", { earned, max })}
      data-testid={testId}
      data-full={full || undefined}
    >
      <EntityIcon src={heroStarIcon()} alt="" className="size-4 shrink-0" />
      <div
        className="relative h-3 min-w-16 flex-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={t("tier.starsLabel", { earned, max })}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={earned}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-amber-300 to-yellow-500"
          style={{ width: `${percent}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] leading-none font-semibold text-foreground tabular-nums">
          {earned}/{max}
        </span>
      </div>
      {full ? (
        <Check
          className="size-4 shrink-0 text-sky-500"
          aria-hidden="true"
          data-testid={testId ? `${testId}-full` : undefined}
        />
      ) : null}
    </div>
  )
}
