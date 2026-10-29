import { useTranslation } from "react-i18next"
import { shopIcon } from "@workspace/game-catalog"

import type { ShopRecommendationSectionView } from "@/features/shop-recommendations"
import { EntityIcon } from "@/shared/ui"
import { ShopRecommendationCard } from "./shop-recommendation-card"

/**
 * Per-shop sections as single-column stacks of dense rows, with the Guaranteed and Possible groups as
 * inline sub-headers. Used at every width: the Today shop card sits in a narrow dashboard column.
 */
export function ShopList({
  sections,
}: {
  sections: ShopRecommendationSectionView[]
}) {
  const { t } = useTranslation("shops")
  const populated = sections.filter(
    (section) => section.guaranteed.length + section.possible.length > 0
  )

  return (
    <div className="space-y-6" data-testid="shop-list">
      {populated.map((section) => (
        <section
          key={section.shopId}
          className="space-y-3"
          data-testid={`shop-section-${section.shopId}`}
        >
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <EntityIcon
              alt=""
              className="size-6 shrink-0"
              src={shopIcon(section.shopId)}
            />
            {t(`shopName.${section.shopId}`, { defaultValue: section.shopId })}
          </h3>
          {section.guaranteed.length > 0 ? (
            <div className="space-y-1.5" data-testid="shop-group-guaranteed">
              <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("group.guaranteed")}
              </h4>
              {section.guaranteed.map((card) => (
                <ShopRecommendationCard key={card.rewardType} card={card} />
              ))}
            </div>
          ) : null}
          {section.possible.length > 0 ? (
            <div className="space-y-1.5" data-testid="shop-group-possible">
              <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("group.possible")}
              </h4>
              {section.possible.map((card) => (
                <ShopRecommendationCard key={card.rewardType} card={card} />
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  )
}
