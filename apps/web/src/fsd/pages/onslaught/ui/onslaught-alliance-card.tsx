import { useTranslation } from "react-i18next"
import {
  onslaughtAllianceIcon,
  type OnslaughtRewardStorageModel,
} from "@workspace/game-catalog"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  onslaughtSectors,
  type OnslaughtAlliance,
  type OnslaughtAllianceProgress,
  type OnslaughtSector,
  type OnslaughtTier,
} from "@/entities/player-data-override"
import { EntityIcon } from "@/shared/ui"

import { AllianceYield, OnslaughtEmblem } from "./onslaught-emblem"
import {
  farmableTiers,
  selectedTier,
  tierAfterCompleteToggle,
  tierAfterSectorChange,
} from "./tier-after-sector-change"

/** One alliance's position editor: sector, farmable tier (1-3), the separate "Sector complete"
 *  checkbox (stored as tier 4), and the shards one run yields at that position. */
export function OnslaughtAllianceCard({
  alliance,
  value,
  rewards,
  onChange,
}: {
  alliance: OnslaughtAlliance
  value: OnslaughtAllianceProgress
  rewards: readonly OnslaughtRewardStorageModel[]
  onChange: (patch: { sector?: OnslaughtSector; tier?: OnslaughtTier }) => void
}) {
  const { t } = useTranslation()
  const key = alliance.toLowerCase()
  return (
    <Card data-testid={`${key}-onslaught-card`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <EntityIcon
            src={onslaughtAllianceIcon(alliance)}
            alt=""
            className="size-6"
          />
          {t(`alliances.${alliance}`)}
        </CardTitle>
        {value.isSet ? null : (
          <Badge variant="outline" data-testid={`${key}-onslaught-not-set`}>
            {t("onslaught.notSet")}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${key}-sector`}>{t("onslaught.sector")}</Label>
          <Select
            value={value.isSet ? value.sector : ""}
            onValueChange={(sector) =>
              onChange({
                sector: sector as OnslaughtSector,
                tier: value.isSet
                  ? tierAfterSectorChange(
                      value.sector,
                      sector as OnslaughtSector,
                      value.tier
                    )
                  : 1,
              })
            }
          >
            <SelectTrigger
              id={`${key}-sector`}
              data-testid={`${key}-onslaught-sector`}
            >
              <SelectValue placeholder={t("onslaught.notSet")} />
            </SelectTrigger>
            <SelectContent>
              {onslaughtSectors.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  <OnslaughtEmblem
                    sector={sector}
                    tier={value.isSet ? value.tier : 1}
                  />
                  <span>{t(`onslaught.sectors.${sector}`)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${key}-tier`}>{t("onslaught.tier")}</Label>
          <Select
            value={value.isSet ? String(selectedTier(value.tier)) : ""}
            disabled={!value.isSet}
            onValueChange={(tier) =>
              onChange({
                tier: Number(tier) as OnslaughtTier,
              })
            }
          >
            <SelectTrigger
              id={`${key}-tier`}
              data-testid={`${key}-onslaught-tier`}
            >
              <SelectValue placeholder={t("onslaught.notSet")} />
            </SelectTrigger>
            <SelectContent>
              {farmableTiers.map((tier) => (
                <SelectItem key={tier} value={String(tier)}>
                  <OnslaughtEmblem sector={value.sector} tier={tier} />
                  <span>{t("onslaught.tierNumber", { tier })}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <Checkbox
            id={`${key}-complete`}
            checked={value.isSet && value.tier === 4}
            disabled={!value.isSet}
            onCheckedChange={(checked) =>
              onChange({
                tier: tierAfterCompleteToggle(checked === true),
              })
            }
            data-testid={`${key}-onslaught-complete`}
          />
          <Label htmlFor={`${key}-complete`}>
            {t("onslaught.tierComplete")}
          </Label>
        </div>
        {value.isSet ? (
          <AllianceYield
            rewards={rewards}
            sector={value.sector}
            tier={value.tier}
            testId={`${key}-onslaught-yield`}
          />
        ) : (
          <p
            className="col-span-2 text-sm text-muted-foreground"
            data-testid={`${key}-onslaught-yield`}
          >
            {t("onslaught.notSetHint")}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
