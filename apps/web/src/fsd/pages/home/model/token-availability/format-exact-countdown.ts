export function formatExactCountdown(targetMs: number, nowMs: number): string {
  const remainingSeconds = Math.max(0, Math.ceil((targetMs - nowMs) / 1000))
  const hours = Math.floor(remainingSeconds / 3600)
  const minutes = Math.floor((remainingSeconds % 3600) / 60)
  const seconds = remainingSeconds % 60

  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`
}
