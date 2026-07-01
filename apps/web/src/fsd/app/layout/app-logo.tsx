export function AppLogo({ className }: { className?: string }) {
  return (
    <img
      aria-hidden="true"
      className={className}
      src="/favicon.svg"
      alt=""
      data-testid="app-header-logo"
    />
  )
}
