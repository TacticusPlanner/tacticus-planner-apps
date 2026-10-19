import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { ChevronDown } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import {
  hordeStrategy,
  hordeSynergies,
  useHordeModeTiers,
  useHordeStrategyText,
} from "@/entities/legendary-event"
import { EntityIcon } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

function StrategyBlock({
  label,
  testId,
  text,
}: {
  label: string
  testId: string
  text: string | undefined
}) {
  if (text === undefined) return null
  return (
    <div className="flex flex-col gap-0.5" data-testid={testId}>
      <h3 className="font-medium">{label}</h3>
      <p className="text-muted-foreground">{text}</p>
    </div>
  )
}

/** The tile details' collapsed Strategy section (spec: tile details show horde-mode strategy):
 *  strengths, how to use, recommended teammates linking to the Library and relic advice. Absent
 *  when the character has no strategy text and no teammates. */
export function TierTileStrategy({ unitId }: { unitId: string }) {
  const { t } = useTranslation("legendaryEvents")
  const tiers = useHordeModeTiers()
  const strategyText = useHordeStrategyText()
  const unitName = useUnitName()
  const [open, setOpen] = useState(false)
  const contentId = useId()
  const strategy = hordeStrategy(
    strategyText(unitId),
    hordeSynergies(tiers.status === "ready" ? tiers.data : null, unitId)
  )
  if (!strategy) return null
  return (
    <div className="flex flex-col gap-2 text-sm" data-testid="tier-strategy">
      <button
        aria-controls={open ? contentId : undefined}
        aria-expanded={open}
        className="flex min-h-11 w-fit items-center gap-1 font-medium text-primary md:min-h-0"
        data-testid="tier-strategy-toggle"
        onClick={() => setOpen(!open)}
        type="button"
      >
        {t("tierList.strategy.title")}
        <ChevronDown
          aria-hidden="true"
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div
          className="flex flex-col gap-3 md:max-h-72 md:overflow-y-auto"
          data-testid="tier-strategy-content"
          id={contentId}
        >
          <StrategyBlock
            label={t("tierList.strategy.strengths")}
            testId="tier-strategy-strengths"
            text={strategy.strengths}
          />
          <StrategyBlock
            label={t("tierList.strategy.howToUse")}
            testId="tier-strategy-how-to-use"
            text={strategy.howToUse}
          />
          {strategy.teammates.length > 0 ? (
            <div className="flex flex-col gap-1">
              <h3 className="font-medium">
                {t("tierList.strategy.teammates")}
              </h3>
              <ul
                className="flex flex-wrap gap-2"
                data-testid="tier-strategy-teammates"
              >
                {strategy.teammates.map((teammate) => (
                  <li key={teammate}>
                    <Link
                      className="flex items-center gap-1.5 rounded-md border border-border px-1.5 py-1 hover:bg-muted"
                      data-testid="tier-strategy-teammate"
                      to={`/library/characters/${teammate}`}
                    >
                      <EntityIcon
                        alt=""
                        className="size-6 shrink-0 rounded-full"
                        src={characterIcon(teammate as UnitId)}
                      />
                      <span>{unitName("Character", teammate)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <StrategyBlock
            label={t("tierList.strategy.relicAdvice")}
            testId="tier-strategy-relic"
            text={strategy.relicAdvice}
          />
        </div>
      ) : null}
    </div>
  )
}
