import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { HreTokenNeedRow } from "../model/hre-objectives"

/** Battles of Arena, Guild Raid, Onslaught and Salvage Run the remaining missions need, against
 * the synced tokens now: "short" when the need exceeds them, "not unlocked" without a bucket. */
export function TokensNeededCard({
  rows,
  synced,
}: {
  rows: readonly HreTokenNeedRow[]
  /** False when no token data is synced: only the needs are shown. */
  synced: boolean
}) {
  const { t } = useTranslation("hre")
  if (rows.length === 0) return null
  return (
    <Card data-testid="hre-tokens">
      <CardHeader>
        <CardTitle>{t("tokens.title")}</CardTitle>
        <CardDescription>
          {t(synced ? "tokens.description" : "tokens.notSynced")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2">
          {rows.map((row) => (
            <li
              key={row.mode}
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
              data-testid={`hre-tokens-${row.mode}`}
            >
              <span className="font-medium">
                {t(`tokens.modes.${row.mode}`)}
              </span>
              <span className="flex items-center gap-2 tabular-nums">
                {row.have === null
                  ? t("tokens.needOnly", { need: row.need })
                  : t("tokens.needHave", { need: row.need, have: row.have })}
                {!synced ? null : row.have === null ? (
                  <Badge variant="outline">{t("tokens.notUnlocked")}</Badge>
                ) : row.short ? (
                  <Badge
                    data-testid={`hre-tokens-${row.mode}-short`}
                    variant="destructive"
                  >
                    {t("tokens.short")}
                  </Badge>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
