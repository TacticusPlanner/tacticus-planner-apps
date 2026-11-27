import { useContext } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Info } from "lucide-react"

import type { LegendaryEventLaneId } from "@/entities/legendary-event"

import { BattleInfoContext } from "./battle-info-context"
import { Button } from "@workspace/ui/components/button"

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
    <Button
      variant="link"
      aria-label={t("battleInfo.open", {
        lane: t(`lanes.${laneId}`),
        battle: battleIndex + 1,
      })}
      className="inline-flex h-auto max-w-full items-center gap-1 rounded-sm p-0 text-left text-[length:inherit] font-normal whitespace-normal text-current hover:underline"
      data-testid="token-battle-info"
      onClick={() => open(laneId, battleIndex)}
    >
      <span className="truncate">{children}</span>
      <Info aria-hidden="true" className="size-icon-sm shrink-0" />
    </Button>
  )
}
