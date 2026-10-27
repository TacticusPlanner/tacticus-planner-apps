// Shop `cost.currency` id → icon asset, ported from V1's `4-entities/shops/shop-currency-icon.ts`
// (`getShopCurrencyIconKey`). The icons are the game's own sprites under
// `public/game_catalog/datamines/`. An unregistered currency (e.g. a future event shop) returns
// `undefined` and the amount renders without an icon.

import { datamineAssetUrl } from "@workspace/game-catalog"

const CURRENCY_ICON_BY_ID: Record<string, string> = {
  guildCredits: datamineAssetUrl(
    `atlases/ui_icon_resource_guild_credits_large.webp`
  ),
  guildWarCurrency: datamineAssetUrl(
    `ui/ui_icon_resource_guild_war_currency_large.webp`
  ),
  elderShopCurrency: datamineAssetUrl(
    `atlases/ui_icon_resource_elder_shop_currency_large.webp`
  ),
  crusadeCurrency: datamineAssetUrl(
    `ui/ui_icon_resource_crusade_currency_large.webp`
  ),
}

export function shopCurrencyIcon(currencyId: string): string | undefined {
  return CURRENCY_ICON_BY_ID[currencyId]
}
