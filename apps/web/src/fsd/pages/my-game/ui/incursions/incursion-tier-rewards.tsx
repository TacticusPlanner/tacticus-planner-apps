import { useTranslation } from "react-i18next"
import { Gift } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

import { isShardReward } from "../../model/incursions.model"
import { IncursionRewards } from "./incursion-rewards"

/**
 * What finishing a tier still pays: the MoW's shards and mythic shards inline, and every reward
 * (badges, upgrades, gold…) in a popover.
 */
export function IncursionTierRewards({
  mowId,
  rewards,
  "data-testid": testId,
}: {
  mowId: string
  rewards: readonly string[]
  "data-testid"?: string
}) {
  const { t } = useTranslation("incursions")
  if (rewards.length === 0) return null
  const shards = rewards.filter((reward) => isShardReward(mowId, reward))
  return (
    <div className="flex items-center gap-1.5" data-testid={testId}>
      <IncursionRewards
        rewards={shards}
        className="[&_li]:text-sm [&_li]:text-foreground"
        data-testid={testId ? `${testId}-shards` : undefined}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={t("rewards.all")}
            data-testid={testId ? `${testId}-all` : undefined}
          >
            <Gift aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 space-y-2">
          <p className="text-sm font-medium">{t("rewards.all")}</p>
          <IncursionRewards
            rewards={rewards}
            data-testid={testId ? `${testId}-popover` : undefined}
          />
          <p className="text-xs text-muted-foreground">{t("rewards.hint")}</p>
        </PopoverContent>
      </Popover>
    </div>
  )
}
