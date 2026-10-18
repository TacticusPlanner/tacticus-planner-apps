/** Tier colours, from design tokens (never raw Tailwind colours). */
const TIER_TONES: Readonly<Record<string, string>> = {
  S: "border-chart-4 bg-chart-4/20",
  A: "border-chart-2 bg-chart-2/20",
  B: "border-chart-1 bg-chart-1/20",
  C: "border-chart-3 bg-chart-3/20",
  // No chart token is left that reads apart from B's chart-1, so D is a dashed, muted outline:
  // "evaluated, low" without the destructive tone, and distinct from the solid untiered border.
  D: "border-dashed border-muted-foreground/60 bg-muted",
}
const UNTIERED_TONE = "border-border bg-muted"

/** A horde-mode tier's border and background classes; the neutral tone for an untiered row or a
 *  tier without a colour of its own. */
export function tierToneClass(tier: string | null | undefined): string {
  return (tier && TIER_TONES[tier]) ?? UNTIERED_TONE
}
