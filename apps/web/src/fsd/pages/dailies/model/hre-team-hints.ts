import type { HreObjectiveKind, HreTeamPlan } from "@/entities/hre-mission"

/** One hint over an HRE token-mode team, worded by the team card. */
export type HreTeamHint =
  /** Spare tokens: held against the remaining missions' need, so `play` battles fit here. */
  | { key: "spare"; held: number; need: number; play: number }
  /** Arena shows the opponents before the battle: fight only teams with this faction. */
  | { key: "arenaFaction"; faction: string }
  /** Kills in Arena: opponents with summoners give more to defeat. */
  | { key: "arenaSummoners" }
  /** Onslaught and Salvage Run progress the mission but score no HRE event points. */
  | { key: "noEventPoints" }
  /** Onslaught ability uses: deploy every unit, weakest first. */
  | { key: "wholeTrack" }

const KILL_KINDS: ReadonlySet<HreObjectiveKind> = new Set([
  "killEnemies",
  "killWithMelee",
  "killWithRanged",
  "killWithAlliance",
  "killFaction",
])

/**
 * The hints over a token-mode team (hre-mission-teams): why it plays on spare tokens, the Arena
 * faction and summoner picks for kills, the whole-alliance Onslaught order for ability uses, and
 * that Onslaught and Salvage Run earn no event points (the HREs score only in Campaign, Elite,
 * Mirror, Campaign Event, Arena and Guild Raid battles).
 */
export function hreTeamHints(plan: HreTeamPlan): HreTeamHint[] {
  const hints: HreTeamHint[] = []
  if (plan.spare) {
    hints.push({
      key: "spare",
      ...plan.spare,
      play: plan.spare.held - plan.spare.need,
    })
  }
  if (plan.mode === "arena") {
    const faction = plan.objectives.find(
      (objective) => objective.kind === "killFaction"
    )?.qualifier
    if (faction) hints.push({ key: "arenaFaction", faction })
    if (plan.objectives.some((objective) => KILL_KINDS.has(objective.kind))) {
      hints.push({ key: "arenaSummoners" })
    }
  }
  if (plan.wholeTrack) hints.push({ key: "wholeTrack" })
  if (plan.mode === "onslaught" || plan.mode === "salvageRun") {
    hints.push({ key: "noEventPoints" })
  }
  return hints
}
