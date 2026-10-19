import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon, RankBadge, RarityIcon } from "@/shared/ui"

import { formatMultiplier, type TierTileDetails } from "./tier-list.view-model"
import { TierTileStrategy } from "./tier-tile-strategy"

function DetailRow({
  label,
  testId,
  children,
}: {
  label: string
  testId: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className="flex items-center gap-1.5 font-medium tabular-nums"
        data-testid={testId}
      >
        {children}
      </dd>
    </div>
  )
}

/** The details list shared by the desktop popover and the mobile sheet: tier, effective
 *  multiplier, the tier default when overridden, the owned state, each relic rating (with its
 *  equipped state when the roster is known), the Strategy section and the Library link. */
function TierTileDetailsList({ details }: { details: TierTileDetails }) {
  const { t, i18n } = useTranslation(["legendaryEvents", "equipmentItems"])
  const format = (value: number) => formatMultiplier(value, i18n.language)
  const { ownership } = details
  return (
    <div className="flex flex-col gap-3" data-testid="tier-tile-details">
      <dl className="flex flex-col gap-2 text-sm">
        <DetailRow label={t("tierList.details.tier")} testId="tier-detail-tier">
          {details.tier ?? t("tierList.untiered")}
        </DetailRow>
        <DetailRow
          label={t("tierList.details.multiplier")}
          testId="tier-detail-multiplier"
        >
          {format(details.multiplier)}
        </DetailRow>
        {details.tierMultiplier === null ? null : (
          <DetailRow
            label={t("tierList.details.tierDefault")}
            testId="tier-detail-tier-default"
          >
            {format(details.tierMultiplier)}
          </DetailRow>
        )}
        <DetailRow
          label={t("tierList.details.owned")}
          testId="tier-detail-owned"
        >
          {ownership.state === "owned" ? (
            <>
              <RarityIcon className="size-5" rarity={ownership.rarity} />
              <RankBadge rank={ownership.rank} />
            </>
          ) : null}
          {ownership.state === "locked"
            ? t("tierList.details.notUnlocked")
            : null}
          {ownership.state === "unknown"
            ? t("tierList.details.rosterUnknown")
            : null}
        </DetailRow>
        {details.relics.map((relic) => (
          <DetailRow
            key={relic.equipmentId}
            label={t(`equipmentItems:${relic.equipmentId}`, {
              defaultValue: relic.equipmentId,
            })}
            testId="tier-detail-relic"
          >
            {format(relic.multiplier)}
            {relic.equipped === undefined ? null : (
              <span
                className={cn(
                  "text-xs font-normal",
                  relic.equipped ? "text-primary" : "text-muted-foreground"
                )}
                data-testid="tier-detail-relic-equipped"
                data-equipped={relic.equipped}
              >
                {t(
                  relic.equipped
                    ? "tierList.details.relicEquipped"
                    : "tierList.details.relicNotEquipped"
                )}
              </span>
            )}
          </DetailRow>
        ))}
      </dl>
      <TierTileStrategy unitId={details.unitId} />
      <Button asChild size="sm" variant="outline">
        <Link
          data-testid="tier-detail-library-link"
          to={`/library/characters/${details.unitId}`}
        >
          {t("tierList.details.openInLibrary")}
        </Link>
      </Button>
    </div>
  )
}

function DetailsHeading({ name, unitId }: { name: string; unitId: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <EntityIcon
        alt=""
        className="size-8 shrink-0 rounded-full"
        src={characterIcon(unitId as UnitId)}
      />
      <span className="truncate">{name}</span>
    </span>
  )
}

/** The desktop popover's body. */
export function TierTileDetailsBody({
  details,
  name,
}: {
  details: TierTileDetails
  name: string
}) {
  return (
    <>
      <h2 className="font-heading font-medium" data-testid="tier-detail-name">
        <DetailsHeading name={name} unitId={details.unitId} />
      </h2>
      <TierTileDetailsList details={details} />
    </>
  )
}

/** The mobile bottom sheet with a tile's details; closed while `details` is undefined. */
export function TierTileDetailsSheet({
  details,
  name,
  onClose,
}: {
  details: TierTileDetails | undefined
  name: string
  onClose: () => void
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <Sheet
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      open={details !== undefined}
    >
      <SheetContent data-testid="tier-tile-details-sheet" side="bottom">
        {details ? (
          <>
            <SheetHeader>
              <SheetTitle data-testid="tier-detail-name">
                <DetailsHeading name={name} unitId={details.unitId} />
              </SheetTitle>
              <SheetDescription className="sr-only">
                {t("tierList.details.description")}
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <TierTileDetailsList details={details} />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
