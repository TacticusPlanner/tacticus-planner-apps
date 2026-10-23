// Shop `cost.currency` id → icon asset, ported from V1's `4-entities/shops/shop-currency-icon.ts`
// (`getShopCurrencyIconKey`). Assets live in `public/game_catalog/resources/` (copied from V1's
// `snowprint_assets/resources/`). An unregistered currency (e.g. a future event shop) returns
// `undefined` and the amount renders without an icon.

import { gameAssetUrl } from "@workspace/game-catalog"

const CURRENCY_ICON_BY_ID: Record<string, string> = {
  guildCredits: gameAssetUrl(
    `resources/ui_icon_resource_guild_credits_large.webp`
  ),
  guildWarCurrency: gameAssetUrl(
    `resources/ui_icon_resource_guild_war_currency_large.webp`
  ),
  elderShopCurrency: gameAssetUrl(
    `resources/ui_icon_resource_elder_shop_currency_large.webp`
  ),
  crusadeCurrency: gameAssetUrl(
    `resources/ui_icon_resource_crusade_currency_large.webp`
  ),
}

export function shopCurrencyIcon(currencyId: string): string | undefined {
  return CURRENCY_ICON_BY_ID[currencyId]
}
