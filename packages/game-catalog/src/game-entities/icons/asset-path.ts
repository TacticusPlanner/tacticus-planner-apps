// All asset paths (including the app's own custom icons — rarity badges, gold/red stars, the
// crafted-upgrade badge) are relative to the web app's /public/game_catalog/ root. These
// helpers return URL strings; the actual files live in apps/web/public/game_catalog/.
// ASSET_BASE_PATH is the single source of truth for that root — change it here to relocate assets.
export const ASSET_BASE_PATH = "/game_catalog"

// Set by apps/web's vite.config.ts for builds only: the git tree hash of public/game_catalog, so it
// changes whenever any catalog image does. Unset in dev and tests (plain URLs).
const assetsVersion = import.meta.env.VITE_GAME_ASSETS_VERSION

/**
 * URL of a file under the catalog image root, e.g. `gameAssetUrl("stars/gold.webp")`. In a build it
 * carries `?v=<asset version>`, which lets the host serve catalog images immutably while a changed
 * image still reaches every client (spec: static-asset-caching).
 */
export function gameAssetUrl(path: string): string {
  const url = `${ASSET_BASE_PATH}/${path}`
  return assetsVersion ? `${url}?v=${assetsVersion}` : url
}

/**
 * URL of a game sprite copied from the pinned data-mines commit, by its path under data-mines
 * `sprites-webp/` (e.g. `datamineAssetUrl("atlases/ui_icon_trait_flying_01.webp")`). The files live in
 * apps/web/public/game_catalog/datamines/ (spec: datamine-source).
 */
export function datamineAssetUrl(path: string): string {
  return gameAssetUrl(`datamines/${path}`)
}
