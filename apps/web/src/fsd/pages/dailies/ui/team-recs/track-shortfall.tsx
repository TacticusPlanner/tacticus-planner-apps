import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { EntityIcon, RankBadge, RarityIcon } from "@/shared/ui"

import type { SalvageEligibleCharacter } from "../../model/salvage-recommendations.types"

/**
 * The per-track "not enough characters" state for the alliance-locked Dailies pages (Salvage Run
 * now, Onslaught next): the owned characters of the track's alliance are listed, with a line
 * stating a full team cannot be built for the track and how many more of that alliance are needed.
 * It never pads from another alliance.
 */
export function TrackShortfall({
  trackLabel,
  ownedCount,
  needed,
  eligible,
  testIdPrefix = "salvage",
}: {
  trackLabel: string
  ownedCount: number
  needed: number
  eligible: readonly SalvageEligibleCharacter[]
  testIdPrefix?: string
}) {
  const { t } = useTranslation(["salvageRun", "characters"])

  return (
    <Card data-testid={`${testIdPrefix}-insufficient-track`}>
      <CardHeader>
        <CardTitle>
          {t("track.shortfallTitle", { track: trackLabel })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("track.shortfall", {
            track: trackLabel,
            owned: ownedCount,
            needed,
          })}
        </p>
        {eligible.length > 0 ? (
          <ul
            className="flex flex-col gap-2"
            data-testid={`${testIdPrefix}-eligible-list`}
          >
            {eligible.map((character) => {
              const name = t(`characters:${character.unitId}`, {
                defaultValue: character.unitId,
              })
              return (
                <li
                  key={character.unitId}
                  className="flex items-center gap-3 rounded-lg border p-2"
                >
                  <EntityIcon
                    alt={name}
                    src={characterIcon(character.unitId)}
                    className="size-10 shrink-0"
                  />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {name}
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <RarityIcon rarity={character.rarity} className="size-5" />
                    <RankBadge
                      rank={character.rank}
                      showLabel={false}
                      tooltip
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
