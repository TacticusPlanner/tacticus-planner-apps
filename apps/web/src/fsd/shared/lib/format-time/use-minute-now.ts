import { useEffect, useState } from "react"

const MINUTE_MS = 60_000

/** The current instant, refreshed once a minute so lifecycle and countdowns re-evaluate while a
 *  page stays open (render stays pure: callers read `nowMs`, never `Date.now()`). */
export function useMinuteNow(): number {
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), MINUTE_MS)
    return () => window.clearInterval(timer)
  }, [])
  return nowMs
}
