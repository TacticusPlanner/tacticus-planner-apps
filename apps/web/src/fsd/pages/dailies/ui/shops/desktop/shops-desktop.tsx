import { useTranslation } from "react-i18next"

import type { ShopRecommendationSectionView } from "../../../model/use-shop-recommendations"
import { ShopRecommendationCard } from "../shop-recommendation-card"

/**
 * Desktop layout (≥768px): one section per shop with cards, each section split into a Guaranteed and a
 * Possible group, laid out as a multi-column card grid that fills the content width.
 */
export function ShopsDesktop({
  sections,
}: {
  sections: ShopRecommendationSectionView[]
}) {
  const { t } = useTranslation("shops")
  const populated = sections.filter(
    (section) => section.guaranteed.length + section.possible.length > 0
  )

  return (
    <div className="space-y-8" data-testid="shops-desktop">
      {populated.map((section) => (
        <section
          key={section.shopId}
          className="space-y-4"
          data-testid={`shop-section-${section.shopId}`}
        >
          <h2 className="text-lg font-semibold">
            {t(`shopName.${section.shopId}`, { defaultValue: section.shopId })}
          </h2>
          {section.guaranteed.length > 0 ? (
            <Group label={t("group.guaranteed")} testId="guaranteed">
              {section.guaranteed.map((card) => (
                <ShopRecommendationCard
                  key={card.rewardType}
                  card={card}
                  variant="desktop"
                />
              ))}
            </Group>
          ) : null}
          {section.possible.length > 0 ? (
            <Group label={t("group.possible")} testId="possible">
              {section.possible.map((card) => (
                <ShopRecommendationCard
                  key={card.rewardType}
                  card={card}
                  variant="desktop"
                />
              ))}
            </Group>
          ) : null}
        </section>
      ))}
    </div>
  )
}

function Group({
  label,
  testId,
  children,
}: {
  label: string
  testId: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2" data-testid={`shop-group-${testId}`}>
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
    </div>
  )
}
