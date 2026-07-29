import { useTranslation } from "react-i18next"
import type { Rarity } from "@workspace/game-domain"

import { energyIconUrl, EntityIcon, RarityIcon } from "@/shared/ui"
import type { EstimateOutcome } from "../../model/estimate/estimate.domain"

/**
 * "{{owned}} / {{total}} shards" + "{{remaining}} remaining · ≈energy · ≈days" + "Unlocks at
 * {{rarity}}" (plan: Unlock resources-needed format). Regular shards only — Unlock never costs
 * mythic shards regardless of the character's rarity (see `unlockResourceNeed`'s always-zero
 * `mythicShards`), so there's no mythic row here at all. `energyEstimate` is `null` until the user
 * picks at least one shard location (the create-goal drawer never preselects one — see
 * use-shard-location-selection.ts), in which case the middle row shows a prompt instead of a figure.
 */
export function UnlockRequirementField({
  ownedShards,
  totalShards,
  rarity,
  energyEstimate,
}: {
  ownedShards: number
  totalShards: number
  rarity: Rarity
  energyEstimate: EstimateOutcome | null
}) {
  const { t } = useTranslation()
  const remaining = Math.max(0, totalShards - ownedShards)

  return (
    <div
      className="grid gap-1 rounded-2xl border p-3 text-sm"
      data-testid="create-goal-unlock-requirement"
    >
      <p className="font-semibold">
        {t("goals.create.unlock.ownedOfTotal", {
          owned: ownedShards,
          total: totalShards,
        })}
      </p>
      <p className="flex flex-wrap items-center gap-1.5">
        <span className="font-semibold">
          {t("goals.create.unlock.remaining", { count: remaining })}
        </span>
        {energyEstimate ? (
          energyEstimate.status === "Blocked" ? (
            <span className="text-muted-foreground">
              {t(`goals.estimate.blocked.${energyEstimate.reason}`)}
            </span>
          ) : (
            <>
              <span className="text-muted-foreground">·</span>
              <EntityIcon
                alt=""
                className="size-4 shrink-0"
                src={energyIconUrl}
              />
              <span className="text-muted-foreground">
                {t("goals.create.shardLocations.energyValue", {
                  energy: energyEstimate.energyTotal,
                })}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {t("goals.create.shardLocations.daysValue", {
                  days: energyEstimate.days,
                })}
              </span>
            </>
          )
        ) : (
          <span className="text-muted-foreground">
            {t("goals.create.unlock.selectLocationPrompt")}
          </span>
        )}
      </p>
      <p className="flex items-center gap-1.5">
        {t("goals.create.unlock.unlocksAt")}
        <RarityIcon className="size-5" rarity={rarity} />
        <span className="font-semibold">
          {t(`rarities.${rarity}`, { defaultValue: rarity })}
        </span>
      </p>
    </div>
  )
}
