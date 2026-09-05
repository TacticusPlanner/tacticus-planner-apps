import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import type { ShopShardOffer } from "@workspace/game-catalog"
import type { BattleId } from "@workspace/game-domain"

import { shopCurrencyIcon } from "@/features/shop-rewards"
import { EntityIcon } from "@/shared/ui"
import type { Battle, FarmLocation } from "@/features/goal-farming"
import { GoalShardLocationsField } from ".//goal-shard-locations-field"

const ASSET_ROOT = "/game_catalog"
const SHARD_ICON = `${ASSET_ROOT}/misc/ui_icon_character_shard_empty.png`

/** True when a shop offer's slot can resolve to more than one reward on at least one of its days —
 *  i.e. it shares a rotating slot (spec: *rotating-slot offer row content*). A guaranteed offer has
 *  probability 1 on every day it appears. */
function isRotatingOffer(offer: ShopShardOffer): boolean {
  return Object.values(offer.probabilityByDay).some(
    (probability) => (probability ?? 0) < 1
  )
}

/**
 * The Unlock/Ascension acquisition-source picker (plan: Campaigns/Onslaught/Shops multi-select,
 * tacticus-planner-apps#103) — replaces the single-select shard-source dropdown. Each top-level
 * group is rendered only when it can contribute for this goal and unit (spec: *A source group is
 * shown only when it can contribute*); renders nothing at all when none can. Groups start expanded
 * at/above the 768px breakpoint and collapsed below it (D9) — the same options, sub-options, and
 * selection either way.
 */
export function AcquisitionSourceField({
  showCampaigns,
  campaignEnabled,
  onCampaignEnabledChange,
  regularShardLocations,
  mythicShardLocations,
  battlesById,
  selectedShardLocationIds,
  onToggleShardLocation,
  showOnslaught,
  onslaughtEnabled,
  onOnslaughtEnabledChange,
  onslaughtShardsPerRun,
  onslaughtProgressSaved,
  shopOffers,
  shopsEnabled,
  onShopsEnabledChange,
  selectedShopOfferIds,
  onToggleShopOffer,
}: {
  showCampaigns: boolean
  campaignEnabled: boolean
  onCampaignEnabledChange: (enabled: boolean) => void
  regularShardLocations: readonly FarmLocation[]
  mythicShardLocations: readonly FarmLocation[]
  battlesById: ReadonlyMap<BattleId, Battle>
  selectedShardLocationIds: readonly string[]
  onToggleShardLocation: (battleId: string, checked: boolean) => void
  showOnslaught: boolean
  onslaughtEnabled: boolean
  onOnslaughtEnabledChange: (enabled: boolean) => void
  onslaughtShardsPerRun: number
  onslaughtProgressSaved: boolean
  shopOffers: readonly ShopShardOffer[] | undefined
  shopsEnabled: boolean
  onShopsEnabledChange: (enabled: boolean) => void
  selectedShopOfferIds: readonly string[]
  onToggleShopOffer: (offerId: string, checked: boolean) => void
}) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const showShops = (shopOffers?.length ?? 0) > 0

  if (!showCampaigns && !showOnslaught && !showShops) return null

  return (
    <div className="grid gap-2" data-testid="create-goal-acquisition-sources">
      <Label>{t("goals.create.acquisitionSources.label")}</Label>
      {showCampaigns ? (
        <SourceGroup
          checked={campaignEnabled}
          defaultExpanded={!isMobile}
          label={t("goals.create.acquisitionSources.campaignsGroup")}
          onCheckedChange={onCampaignEnabledChange}
          testId="campaigns"
        >
          <GoalShardLocationsField
            battlesById={battlesById}
            onToggle={onToggleShardLocation}
            selectedIds={selectedShardLocationIds}
            shardLocations={regularShardLocations}
            shardType="Regular"
          />
          <GoalShardLocationsField
            battlesById={battlesById}
            onToggle={onToggleShardLocation}
            selectedIds={selectedShardLocationIds}
            shardLocations={mythicShardLocations}
            shardType="Mythic"
          />
        </SourceGroup>
      ) : null}
      {showOnslaught ? (
        <SourceGroup
          checked={onslaughtEnabled}
          defaultExpanded={!isMobile}
          label={t("goals.create.acquisitionSources.onslaughtGroup")}
          onCheckedChange={onOnslaughtEnabledChange}
          testId="onslaught"
        >
          {onslaughtEnabled ? (
            <div
              className="grid gap-1 text-sm text-muted-foreground"
              data-testid="create-goal-onslaught-panel"
            >
              {onslaughtProgressSaved ? (
                <p className="flex items-center gap-1.5">
                  <EntityIcon alt="" className="size-5" src={SHARD_ICON} />
                  {t("goals.create.acquisitionSources.onslaughtYield", {
                    shards: onslaughtShardsPerRun.toFixed(1),
                  })}
                </p>
              ) : (
                <p>
                  {t("goals.create.acquisitionSources.onslaughtNoProgress")}
                </p>
              )}
              <Link
                className="font-medium text-primary underline"
                to="/onslaught"
              >
                {t("goals.create.acquisitionSources.editOnslaughtProgress")}
              </Link>
            </div>
          ) : null}
        </SourceGroup>
      ) : null}
      {showShops ? (
        <SourceGroup
          checked={shopsEnabled}
          defaultExpanded={!isMobile}
          label={t("goals.create.acquisitionSources.shopsGroup")}
          onCheckedChange={onShopsEnabledChange}
          testId="shops"
        >
          <div className="grid gap-1.5 sm:grid-cols-2">
            {(shopOffers ?? []).map((offer) => (
              <ShopOfferRow
                checked={selectedShopOfferIds.includes(offer.offerId)}
                key={offer.offerId}
                offer={offer}
                onToggle={onToggleShopOffer}
              />
            ))}
          </div>
        </SourceGroup>
      ) : null}
    </div>
  )
}

function SourceGroup({
  label,
  checked,
  onCheckedChange,
  defaultExpanded,
  testId,
  children,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  defaultExpanded: boolean
  testId: string
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const Chevron = expanded ? ChevronUpIcon : ChevronDownIcon

  return (
    <div
      className="grid gap-1.5 rounded-2xl border p-3"
      data-testid={`create-goal-acquisition-group-${testId}`}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          aria-label={label}
          checked={checked}
          data-testid={`create-goal-acquisition-group-${testId}-toggle`}
          onCheckedChange={(value) => onCheckedChange(value === true)}
        />
        <button
          className="flex flex-1 items-center justify-between gap-2 text-left font-medium"
          data-testid={`create-goal-acquisition-group-${testId}-header`}
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          {label}
          <Chevron className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </div>
      {expanded ? <div className="grid gap-2 pl-6">{children}</div> : null}
    </div>
  )
}

/** Exported for the Ascension card's own mythic-only shop-offer row when Unlock is also enabled —
 *  see `goal-type-cards.tsx`'s `sharedWithUnlock` handling. */
export function ShopOfferRow({
  offer,
  checked,
  onToggle,
}: {
  offer: ShopShardOffer
  checked: boolean
  onToggle: (offerId: string, checked: boolean) => void
}) {
  const { t } = useTranslation(["common", "shops"])
  const rotating = isRotatingOffer(offer)
  const currencyIcon = shopCurrencyIcon(offer.cost.currency)
  const currencyLabel = t(`shops:currency.${offer.cost.currency}`, {
    defaultValue: offer.cost.currency,
  })
  const days = offer.days.join(", ")

  return (
    <Label
      className="flex items-start gap-2 rounded-xl border p-2 font-normal"
      data-testid={`create-goal-shop-offer-${offer.offerId}`}
    >
      <Checkbox
        checked={checked}
        data-testid={`create-goal-shop-offer-checkbox-${offer.offerId}`}
        onCheckedChange={(value) => onToggle(offer.offerId, value === true)}
      />
      <span className="grid gap-0.5">
        <span className="flex items-center gap-1.5">
          <EntityIcon alt="" className="size-5 shrink-0" src={SHARD_ICON} />
          {offer.shopId}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {currencyIcon ? (
            <EntityIcon alt="" className="size-4 shrink-0" src={currencyIcon} />
          ) : null}
          {t("goals.create.acquisitionSources.shopOfferAvailable", {
            qty: offer.rewardQty,
            amount: offer.maxPerDay,
            cost: offer.cost.amount,
            currency: currencyLabel,
          })}
        </span>
        <span className="text-xs text-muted-foreground">
          {t("goals.create.acquisitionSources.shopOfferDays", { days })}
        </span>
        {rotating ? (
          <span
            className="text-xs text-muted-foreground"
            data-testid={`create-goal-shop-offer-possible-${offer.offerId}`}
          >
            {t("goals.create.acquisitionSources.shopOfferPossibleReward")}
            {" — "}
            {t("goals.create.acquisitionSources.shopOfferChance", {
              percent: Math.round(
                (Math.max(
                  ...Object.values(offer.probabilityByDay).map((p) => p ?? 0)
                ) || 0) * 100
              ),
              days,
            })}
          </span>
        ) : null}
      </span>
    </Label>
  )
}
