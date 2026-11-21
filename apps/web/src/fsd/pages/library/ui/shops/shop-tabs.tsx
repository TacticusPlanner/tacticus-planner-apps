import { useTranslation } from "react-i18next"
import { shopIcon } from "@workspace/game-catalog"
import { Tabs } from "@workspace/ui/components/tabs"

import { EntityIcon, PageTabsList, PageTabsTrigger } from "@/shared/ui"

import { LIBRARY_SHOP_IDS } from "../../model/shops/use-library-shops"
import type { LibraryShopId } from "../../model/shops/use-library-shops"

/** The shop tabs under the page toolbar's day select, on every viewport: left-aligned underline
 *  tabs that scroll sideways on a phone (ui-style-guide rule 4). */
export function ShopTabs({
  shopId,
  setShopId,
}: {
  shopId: LibraryShopId
  setShopId: (shopId: LibraryShopId) => void
}) {
  const { t } = useTranslation(["library", "shops"])

  return (
    <Tabs
      value={shopId}
      onValueChange={(value) => setShopId(value as LibraryShopId)}
    >
      <PageTabsList
        aria-label={t("shops.shopLabel")}
        data-testid="shops-shop-toggle"
      >
        {LIBRARY_SHOP_IDS.map((value) => (
          <PageTabsTrigger key={value} value={value}>
            <EntityIcon
              size="inline"
              alt=""
              className="shrink-0"
              src={shopIcon(value)}
            />
            {t(`shops.shopName.${value}`)}
          </PageTabsTrigger>
        ))}
      </PageTabsList>
    </Tabs>
  )
}
