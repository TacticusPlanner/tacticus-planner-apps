import type { HreShardSource } from "@/entities/hre-mission"

type HreSourceCopy = {
  labelKey: "goals.hreSource.liveLabel" | "goals.hreSource.upcomingLabel"
  textKey:
    | "goals.hreSource.unlockRunning"
    | "goals.hreSource.unlockUpcoming"
    | "goals.hreSource.shardsRunning"
    | "goals.hreSource.shardsUpcoming"
}

/** The chip label and popover sentence for a goal whose shards come from a Hero Release Event. */
export function hreSourceCopy(
  source: Pick<HreShardSource, "status">,
  isUnlock: boolean
): HreSourceCopy {
  const running = source.status === "running"
  return {
    labelKey: running
      ? "goals.hreSource.liveLabel"
      : "goals.hreSource.upcomingLabel",
    textKey: isUnlock
      ? running
        ? "goals.hreSource.unlockRunning"
        : "goals.hreSource.unlockUpcoming"
      : running
        ? "goals.hreSource.shardsRunning"
        : "goals.hreSource.shardsUpcoming",
  }
}
