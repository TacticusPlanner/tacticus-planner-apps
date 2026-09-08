import { useTranslation } from "react-i18next"
import { characterIcon, mowIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"

import { EntityIcon, RarityIcon } from "@/shared/ui"

import type { OnslaughtShardRecipientResult } from "../../model/onslaught-shard-recipient"

/**
 * The post-battle Onslaught shard recipient. After an Onslaught battle the player picks one unit to
 * receive shards; this panel recommends the best character or Machine of War drawn from the active
 * Onslaught-farming Ascension goals of the selected track. It is independent of the battle team —
 * it renders even when the team is incomplete — and shows the "no shard target configured" state
 * when the track has no eligible goal.
 */
export function ShardRecipientPanel({
  result,
  projectName,
  testIdPrefix = "onslaught",
}: {
  result: OnslaughtShardRecipientResult
  /** Resolved name of the recipient's project, when its goal belongs to the selected project. */
  projectName?: string
  testIdPrefix?: string
}) {
  const { t } = useTranslation(["onslaught", "characters", "progression"])

  return (
    <Card data-testid={`${testIdPrefix}-shard-recipient`}>
      <CardHeader>
        <CardTitle>{t("recipient.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {result.status === "none" ? (
          <p className="text-sm text-muted-foreground">{t("recipient.none")}</p>
        ) : (
          (() => {
            const { recipient } = result
            const name =
              recipient.unitKind === "character"
                ? t(`characters:${recipient.unitId}`, {
                    defaultValue: recipient.unitName,
                  })
                : recipient.unitName
            const iconSrc =
              recipient.unitKind === "character"
                ? characterIcon(recipient.unitId as UnitId)
                : mowIcon(recipient.unitId as UnitId)
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <EntityIcon
                    alt={name}
                    src={iconSrc}
                    className="size-10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <Badge variant="secondary" className="mt-0.5">
                      {t(`recipient.unitKind.${recipient.unitKind}`)}
                    </Badge>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">
                      {t("recipient.currentRarity")}
                    </dt>
                    <dd>
                      <RarityIcon
                        rarity={recipient.currentRarity}
                        className="size-5"
                      />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">
                      {t("recipient.targetRarity")}
                    </dt>
                    <dd>
                      <RarityIcon
                        rarity={recipient.targetRarity}
                        className="size-5"
                      />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">
                      {t("recipient.currentShards")}
                    </dt>
                    <dd>{recipient.currentShards.toLocaleString()}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">
                      {t("recipient.requiredShards")}
                    </dt>
                    <dd>{recipient.requiredShards.toLocaleString()}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">
                      {t("recipient.remainingShards")}
                    </dt>
                    <dd className="font-medium">
                      {recipient.remainingShards.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">
                      {t("recipient.goal")}
                    </dt>
                    <dd className="truncate">
                      {t("recipient.ascendGoal", {
                        rarity: t(
                          `progression:rarities.${recipient.targetRarity}`
                        ),
                      })}
                    </dd>
                  </div>
                  {projectName ? (
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">
                        {t("recipient.project")}
                      </dt>
                      <dd className="truncate">{projectName}</dd>
                    </div>
                  ) : null}
                </dl>

                <p className="text-xs text-muted-foreground">
                  {t(`recipient.reason.${recipient.reason}`)}
                </p>
              </div>
            )
          })()
        )}
      </CardContent>
    </Card>
  )
}
