import { useTranslation } from "react-i18next"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { campaignDescriptor, campaignIcon } from "@workspace/game-catalog"
import type { BattleId } from "@workspace/game-domain"

import { useCampaignDisplay } from "@/shared/lib"
import { EntityIcon } from "@/shared/ui"
import { dropRate } from "@/features/goal-farming"
import type { Battle, FarmLocation } from "@/features/goal-farming"

/** The full campaign battle name for a shard-farm location, e.g. "Fall of Cadia Standard 22" or
 *  "Death Guard Extremis 5B" — falls back to the raw battle id when the battle's campaign/type
 *  combination doesn't resolve to a known descriptor (shouldn't happen for real catalog data). */
function battleLabel(
  battle: Battle | undefined,
  battleId: string,
  fullLabel: ReturnType<typeof useCampaignDisplay>["fullLabel"]
): string {
  if (!battle) return battleId
  const descriptor = campaignDescriptor(
    battle.campaignGroupId,
    battle.type,
    battle.challenge
  )
  if (!descriptor) return battleId
  return `${fullLabel(descriptor)} ${battle.nodeNumber}${battle.challenge ? "B" : ""}`
}

/**
 * Checkbox list of a character's shard farm nodes of ONE type (regular or mythic) — shared by the
 * Unlock and Ascension cards (plan: shard-location selector, mythic-vs-regular filtering), each
 * showing the expected energy to obtain one shard there (`battle.energyCost / dropRate(location)`,
 * the same per-item economics `selectFarmNodes`'s least-energy pick already uses internally). The
 * caller is responsible for only passing in locations of the type actually needed — Unlock only ever
 * needs regular shards, and Ascension needs whichever type(s) its current progression range crosses
 * (see use-progression-preview.ts's `ascensionNeedsRegularShards`/`ascensionNeedsMythicShards`), so a
 * mythic-only node (e.g. a Mythic-tier Extremis node) is never offered for a goal that can't use it.
 * Never shown for a MoW — it has no `shardLocations` in the catalog at all (see
 * `unlockCostUnsupportedMow`). Empty selection means "no restriction": the engine auto-picks the
 * least-energy node(s) among all of that type, exactly the behavior before this selector existed —
 * mirrors `goal-locations-field.tsx`'s detail-sheet convention, where an empty override reads as
 * unrestricted for the same reason.
 */
export function GoalShardLocationsField({
  shardType,
  shardLocations,
  battlesById,
  selectedIds,
  onToggle,
}: {
  shardType: "Regular" | "Mythic"
  shardLocations: readonly FarmLocation[]
  battlesById: ReadonlyMap<BattleId, Battle>
  selectedIds: readonly string[]
  onToggle: (battleId: string, checked: boolean) => void
}) {
  const { t } = useTranslation()
  const { fullLabel } = useCampaignDisplay()
  if (shardLocations.length === 0) return null

  return (
    <div
      className="grid gap-1.5"
      data-testid={`create-goal-shard-locations-${shardType.toLowerCase()}`}
    >
      <p className="text-xs text-muted-foreground">
        {t(
          shardType === "Mythic"
            ? "goals.create.shardLocations.labelMythic"
            : "goals.create.shardLocations.labelRegular"
        )}
      </p>
      {shardLocations.map((location) => {
        const battle = battlesById.get(location.battleId)
        const rate = dropRate(location)
        const energyPerShard =
          battle && battle.energyCost > 0 && rate > 0
            ? battle.energyCost / rate
            : null
        const icon = battle
          ? campaignIcon(battle.campaignGroupId, battle.type, battle.challenge)
          : undefined
        return (
          <Field
            data-testid={`create-goal-shard-location-${location.battleId}`}
            key={location.battleId}
            orientation="horizontal"
          >
            <Checkbox
              checked={selectedIds.includes(location.battleId)}
              data-testid={`create-goal-shard-location-checkbox-${location.battleId}`}
              onCheckedChange={(checked) =>
                onToggle(location.battleId, checked === true)
              }
            />
            <EntityIcon alt="" className="size-5 shrink-0" src={icon} />
            <FieldLabel className="font-normal">
              {battleLabel(battle, location.battleId, fullLabel)}
              {energyPerShard != null
                ? ` — ${t("goals.create.shardLocations.energyPerShard", {
                    energy: Math.ceil(energyPerShard),
                  })}`
                : ""}
            </FieldLabel>
          </Field>
        )
      })}
    </div>
  )
}
