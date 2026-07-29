import { unitIdSchema } from "@workspace/game-domain"

// Slugs that diverge from the default camelCase→snake_case derivation, mirroring
// `characterIconOverrides`. This package has no static MoW dataset to check ids against (MoWs sync
// from the live API into IndexedDB at runtime), so the id half of each entry is a best-effort guess
// at the real unit id inferred from the game's own unit name — the slug half is the confirmed
// existing filename under characters/. A wrong guess is harmless (the entry just never matches and
// the MoW falls through to the combobox's fallback glyph); fix the id once the real one is visible
// (e.g. in a failed request's URL) rather than the slug.
export const mowIconOverrides = new Map([
  [unitIdSchema.parse("thousDaemonPrince"), "thous_daemonprince"],
  [unitIdSchema.parse("orksRukkatrukk"), "orkss_rukkatrukk"],
  [unitIdSchema.parse("astraOrdnanceBattery"), "astra_ordnancebattery"],
  [unitIdSchema.parse("tauBroadside"), "tauta_broadside"],
  [unitIdSchema.parse("darkaStormSpeeder"), "darka_stormspeeder"],
])
