import { useContext, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Info } from "lucide-react"

import type { LegendaryEventLaneId } from "@/entities/legendary-event"

import { BattleInfoContext } from "./battle-info-context"

/** A token's battle label: a button opening that battle's info when the page provides it. */
export function BattleInfoButton({
  laneId,
  battleIndex,
  children,
}: {
  laneId: LegendaryEventLaneId
  battleIndex: number
  children: ReactNode
}) {
  const { t } = useTranslation("legendaryEvents")
  const open = useContext(BattleInfoContext)
  if (!open) return <span>{children}</span>
  return (
    <button
      aria-label={t("battleInfo.open", {
        lane: t(`lanes.${laneId}`),
        battle: battleIndex + 1,
      })}
      className="inline-flex max-w-full items-center gap-1 rounded-sm text-left underline decoration-dotted underline-offset-4 hover:decoration-solid focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      data-testid="token-battle-info"
      onClick={() => open(laneId, battleIndex)}
      type="button"
    >
      <span className="truncate">{children}</span>
      <Info aria-hidden="true" className="size-3.5 shrink-0" />
    </button>
  )
}
