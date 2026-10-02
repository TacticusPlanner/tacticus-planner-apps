import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import type { UpgradeId } from "@workspace/game-domain"

import { shopCurrencyIcon } from "@/features/shop-rewards"
import { EntityIcon, UpgradeIcon } from "@/shared/ui"
import type { MythicMaterialSelection } from "../../model/goal-creation-form/use-mythic-material-selection"
import { ShopOfferRow } from ".//acquisition-source-field"

/**
 * The Mythic-material shop-offer control for Rank, Upgrade, and Machine-of-War Ability goals
 * (add-mythic-material-shop-sources): per needed material, every daily-shop offer for it, checked by
 * default. Renders nothing when the goal needs none of the four materials. Below 768px a material with
 * several offers starts collapsed; at or above it every material is expanded — same rows either way.
 */
export function MythicMaterialSourceField({
  selection,
  showSpend = true,
}: {
  selection: MythicMaterialSelection
  /** The Edit goal dialog shows no estimate, so it hides the currency-spend preview. */
  showSpend?: boolean
}) {
  const { t } = useTranslation(["common", "shops"])
  const isMobile = useIsMobile()
  const { materialIds, offers, failed, checkedIds, toggle, currencySpend } =
    selection
  if (materialIds.length === 0) return null

  return (
    <div
      className="grid gap-2 rounded-2xl border p-3 text-sm"
      data-testid="goal-mythic-material-sources"
    >
      <p className="font-medium">{t("goals.create.mythicMaterials.title")}</p>
      <p className="text-xs text-muted-foreground">
        {t("goals.create.mythicMaterials.description")}
      </p>
      {failed ? (
        <p
          className="text-xs text-muted-foreground"
          data-testid="goal-mythic-material-sources-failed"
        >
          {t("goals.create.mythicMaterials.unavailable")}
        </p>
      ) : !offers ? (
        <p
          className="text-xs text-muted-foreground"
          data-testid="goal-mythic-material-sources-loading"
        >
          {t("goals.create.mythicMaterials.loading")}
        </p>
      ) : (
        materialIds.map((materialId) => {
          const materialOffers = offers.filter(
            (offer) => offer.rewardType === materialId
          )
          return (
            <MaterialSection
              defaultExpanded={!isMobile || materialOffers.length <= 1}
              key={`${materialId}-${isMobile}`}
              materialId={materialId}
            >
              {materialOffers.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("goals.create.mythicMaterials.noOffers")}
                </p>
              ) : (
                materialOffers.map((offer) => (
                  <ShopOfferRow
                    checked={checkedIds.includes(offer.offerId)}
                    key={offer.offerId}
                    offer={offer}
                    onToggle={toggle}
                  />
                ))
              )}
            </MaterialSection>
          )
        })
      )}
      {(showSpend ? currencySpend : []).map(({ currency, amount }) => {
        const icon = shopCurrencyIcon(currency)
        return (
          <p
            className="flex items-center gap-1.5"
            data-testid={`goal-mythic-material-spend-${currency}`}
            key={currency}
          >
            {icon ? (
              <EntityIcon alt="" className="size-5 shrink-0" src={icon} />
            ) : null}
            {t("goals.create.acquisitionSources.shopCurrencySpend", {
              amount,
              currency: t(`shops:currency.${currency}`, {
                defaultValue: currency,
              }),
            })}
          </p>
        )
      })}
    </div>
  )
}

function MaterialSection({
  materialId,
  defaultExpanded,
  children,
}: {
  materialId: string
  defaultExpanded: boolean
  children: React.ReactNode
}) {
  const { t } = useTranslation("upgrades")
  const [expanded, setExpanded] = useState(defaultExpanded)
  const Chevron = expanded ? ChevronUpIcon : ChevronDownIcon

  return (
    <div
      className="grid gap-1.5"
      data-testid={`goal-mythic-material-${materialId}`}
    >
      <button
        aria-expanded={expanded}
        className="flex items-center gap-2 text-left font-medium"
        data-testid={`goal-mythic-material-${materialId}-header`}
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        <UpgradeIcon
          className="size-6 shrink-0"
          id={materialId as UpgradeId}
          rarity="Mythic"
        />
        <span className="flex-1">
          {t(materialId, { defaultValue: materialId })}
        </span>
        <Chevron className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {expanded ? <div className="grid gap-2">{children}</div> : null}
    </div>
  )
}
