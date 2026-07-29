// All asset paths (including the app's own custom icons — rarity badges, gold/red stars, the
// crafted-upgrade badge) are relative to the web app's /public/game_catalog/ root. These
// helpers return URL strings; the actual files live in apps/web/public/game_catalog/.
// ASSET_BASE_PATH is the single source of truth for that root — change it here to relocate assets.
export const ASSET_BASE_PATH = "/game_catalog"
