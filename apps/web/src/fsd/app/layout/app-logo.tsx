export function AppLogo({ className }: { className?: string }) {
  return (
    <img
      aria-hidden="true"
      className={className}
      src="/favicon-96x96.png"
      alt=""
      data-testid="app-header-logo"
    />
  )
}
