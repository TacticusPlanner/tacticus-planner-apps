/**
 * The countdown layer of a Sync control: fills its round parent clockwise from 12 o'clock with the
 * share of the auto-sync interval that has elapsed, so a full circle means the next background
 * sync is due. The parent supplies the dimmed track (e.g. `bg-accent/30`), `relative` and
 * `rounded-full`; the icon on top should be `relative` so it paints above this layer.
 */
export function AutoSyncFill({ fraction }: { fraction: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 rounded-full"
      data-progress={Math.round(fraction * 100)}
      data-testid="auto-sync-fill"
      style={{
        background: `conic-gradient(var(--accent) ${fraction * 360}deg, transparent 0deg)`,
      }}
    />
  )
}
